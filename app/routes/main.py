import os
import json
from flask import Blueprint, render_template, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename
import threading
from utils import upload_files, generate_study_guide

# Create the blueprint
main_bp = Blueprint('main', __name__)

# Dictionary to track active operations
active_operations = {}

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/upload', methods=['POST'])
def upload_handler():
    if 'files[]' not in request.files:
        return jsonify({'error': 'No files uploaded'}), 400
    
    uploaded_files = request.files.getlist('files[]')
    if not uploaded_files or uploaded_files[0].filename == '':
        return jsonify({'error': 'No files selected'}), 400
    
    # Save uploaded files
    file_paths = []
    for file in uploaded_files:
        filename = secure_filename(file.filename)
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        file_paths.append(file_path)
    
    # Process the files with Gemini API
    try:
        # Always use newly uploaded files by removing any existing file_uris.json
        if os.path.exists('file_uris.json'):
            os.remove('file_uris.json')
        
        # Upload the new files to Gemini
        file_refs = upload_files(file_paths)
        
        # Generate study guide
        result = generate_study_guide(file_refs)
        
        # Clear any existing chat sessions from the chat blueprint module
        from .chat import active_chats
        active_chats.clear()
        
        return jsonify({'success': True, 'message': 'Study guide generated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main_bp.route('/study-guide')
def study_guide():
    try:
        # Read the generated JSON file
        with open(os.path.join('static', 'output.json'), 'r') as f:
            data = json.load(f)
        return render_template('study_guide.html', data=data)
    except FileNotFoundError:
        return render_template('error.html', message="Study guide not found. Please upload files first.")
    except Exception as e:
        return render_template('error.html', message=f"Error loading study guide: {str(e)}")

@main_bp.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)