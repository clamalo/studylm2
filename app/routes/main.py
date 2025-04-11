import os
import json
import uuid
from flask import Blueprint, render_template, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename
import threading
from app.services.file_service import FileService
from app.core.study_guide_generator import StudyGuideGenerator
from app.helpers.json_utils import load_json_from_file
from app.helpers.progress_updates import init_progress, add_progress_message, get_progress, clear_progress

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
    
    # Generate a unique operation ID for this upload/processing job
    operation_id = str(uuid.uuid4())
    init_progress(operation_id)
    add_progress_message(operation_id, "Processing uploaded files...", status="uploading")
    
    # Save uploaded files using our FileService
    try:
        file_paths = []
        for file in uploaded_files:
            filename = secure_filename(file.filename)
            file_path = FileService.save_uploaded_file(file, filename)
            file_paths.append(file_path)
        
        current_app.logger.info(f"Saved {len(file_paths)} uploaded files")
        
        # Get the current app for the background thread
        app = current_app._get_current_object()
        
        # Start processing in background thread with app context
        thread = threading.Thread(
            target=process_files_in_background,
            args=(file_paths, operation_id, app)
        )
        thread.daemon = True
        thread.start()
        
        # Return immediately with operation_id
        return jsonify({
            'success': True, 
            'message': 'Processing started', 
            'operation_id': operation_id
        })
    except Exception as e:
        current_app.logger.error(f"Error handling file upload: {e}")
        add_progress_message(operation_id, f"Error: {str(e)}", status="error")
        return jsonify({'error': str(e)}), 500

def process_files_in_background(file_paths, operation_id, app):
    """Process uploaded files in a background thread with progress updates"""
    # Create an application context for this thread
    with app.app_context():
        try:
            # Always use newly uploaded files by removing any existing file_uris.json
            if os.path.exists('file_uris.json'):
                os.remove('file_uris.json')
                app.logger.info("Removed existing file_uris.json")
            
            # Create a progress callback for file uploads
            def file_upload_progress(filename, index, total):
                # Just display a message without affecting the progress percentage
                add_progress_message(
                    operation_id, 
                    f"Uploading file: {filename} ({index}/{total})",
                    status="uploading"
                )
            
            # Upload the new files to Gemini using our service
            file_refs = FileService.upload_files_to_gemini(
                file_paths, 
                operation_id=operation_id,
                progress_callback=file_upload_progress
            )
            app.logger.info(f"Uploaded {len(file_refs)} files")

            # Cleanup
            try:
                for file_path in file_paths:
                    os.remove(file_path)
                    app.logger.info(f"Deleted local file: {file_path}")
            except OSError as e:
                app.logger.error(f"Error deleting local file {file_path}: {e}")
            
            # Starting study guide generation - set to 0% progress
            add_progress_message(operation_id, "Starting study guide generation...", status="generating", progress=0)
            
            # Create a progress callback that passes both message and progress
            def progress_callback(msg, progress=None):
                add_progress_message(operation_id, msg, status=None, progress=progress)
            
            # Generate the study guide with our enhanced progress tracking
            # Quiz generation will start at 0% and progress to 100%
            result = StudyGuideGenerator.generate_study_guide(
                file_refs, 
                progress_callback=progress_callback
            )
            
            # Mark as complete
            add_progress_message(operation_id, "Study guide generation complete!", status="complete", progress=100)
            
            # Clear any existing chat sessions from the chat blueprint module
            try:
                from .chat import active_chats
                active_chats.clear()
                app.logger.info("Cleared existing chat sessions")
            except Exception as e:
                app.logger.warning(f"Could not clear chat sessions: {e}")
        
        except Exception as e:
            app.logger.error(f"Error in background processing: {e}")
            add_progress_message(operation_id, f"Error: {str(e)}", status="error")

@main_bp.route('/generation-status/<operation_id>', methods=['GET'])
def generation_status(operation_id):
    """Get the current status of a generation operation"""
    progress_data = get_progress(operation_id)
    if not progress_data:
        return jsonify({'error': 'Operation not found'}), 404
    
    return jsonify(progress_data)

@main_bp.route('/study-guide')
def study_guide():
    try:
        # Read the generated JSON file using our helper
        output_file_path = os.path.join('static', 'output.json')
        data = load_json_from_file(output_file_path)
        return render_template('study_guide.html', data=data)
    except FileNotFoundError:
        return render_template('error.html', message="Study guide not found. Please upload files first.")
    except Exception as e:
        current_app.logger.error(f"Error loading study guide: {e}")
        return render_template('error.html', message=f"Error loading study guide: {str(e)}")

@main_bp.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)