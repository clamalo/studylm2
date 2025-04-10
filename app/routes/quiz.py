import os
import json
import uuid
import threading
import time
from flask import Blueprint, render_template, request, jsonify, current_app
from utils import load_files_from_uris, generate_quiz_questions
import model_config

# Create the blueprint
quiz_bp = Blueprint('quiz', __name__)

# Store quiz generation results
quiz_results = {}

@quiz_bp.route('/quiz')
def quiz():
    return render_template('quiz.html')

@quiz_bp.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    try:
        data = request.get_json()
        model = data.get('model', model_config.DEFAULT_QUIZ_MODEL)
        question_count = data.get('question_count', 10)
        
        # Use the same file loading method as chat functionality
        file_refs = load_files_from_uris()
        if not file_refs:
            return jsonify({
                'status': 'error',
                'error': 'No study materials found. Please upload documents first.'
            }), 400
        
        # Generate a unique ID for this quiz generation
        generation_id = str(uuid.uuid4())

        current_app.logger.info(f"Generating quiz with {question_count} questions")
        
        # Start the quiz generation in a background thread
        thread = threading.Thread(
            target=generate_quiz_in_background,
            args=(generation_id, question_count, file_refs)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({
            'status': 'generating',
            'generation_id': generation_id
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@quiz_bp.route('/cancel-quiz/<generation_id>', methods=['POST'])
def cancel_quiz(generation_id):
    if generation_id in quiz_results:
        # Mark the quiz as canceled if it's still generating
        if quiz_results[generation_id].get('status') == 'generating':
            quiz_results[generation_id] = {
                'status': 'canceled',
                'message': 'Quiz generation was canceled by the user'
            }
        
        # Clean up after a delay
        def cleanup():
            time.sleep(60)  # Keep for 1 minute
            quiz_results.pop(generation_id, None)
        
        threading.Thread(target=cleanup, daemon=True).start()
        
        return jsonify({
            'success': True,
            'message': 'Quiz generation canceled'
        })
    
    return jsonify({
        'success': False,
        'message': 'Quiz generation not found or already completed'
    })

@quiz_bp.route('/quiz-status/<generation_id>')
def quiz_status(generation_id):
    if generation_id not in quiz_results:
        return jsonify({
            'status': 'generating'
        })
    
    result = quiz_results[generation_id]
    
    # If complete, we can clean up the result from our storage after a delay
    if result.get('status') in ['complete', 'error']:
        result_copy = result.copy()
        # Remove from storage after a short delay to allow for retries
        def cleanup():
            time.sleep(300)  # Keep for 5 minutes (increased from 1 minute)
            quiz_results.pop(generation_id, None)
        
        threading.Thread(target=cleanup, daemon=True).start()
        return jsonify(result_copy)
    
    return jsonify(result)

def generate_quiz_in_background(generation_id, question_count, file_refs):
    """Helper function to generate quiz in a background thread"""
    try:
        if not file_refs:
            quiz_results[generation_id] = {
                'status': 'error',
                'message': 'No study materials found. Please upload documents first.'
            }
            return
        
        # Use our consolidated quiz generation function
        questions_list = generate_quiz_questions(file_refs, question_count)
        
        if not questions_list:
            quiz_results[generation_id] = {
                'status': 'error',
                'message': 'Failed to generate quiz questions'
            }
            return
        
        # Format the response in the expected structure
        quiz_json = {'questions': questions_list}
        
        # Store the quiz result
        quiz_results[generation_id] = {
            'status': 'complete',
            'quiz': quiz_json
        }
    except Exception as e:
        quiz_results[generation_id] = {
            'status': 'error',
            'message': str(e)
        }