import os
import json
import uuid
import logging
import traceback
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify, send_from_directory, session, Response, stream_with_context
from werkzeug.utils import secure_filename
from queue import Queue
import threading
import time
import re

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload
app.config['SECRET_KEY'] = 'your_secret_key_here'

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Dictionary to store active chat sessions
active_chats = {}

# Dictionary to store message queues for streaming (maps chat_id to a queue)
message_queues = {}

# Configure Gemini API
genai.configure(api_key="AIzaSyDCFi4E7uEaxZMks-aW7hZ6cX5-7yQXfu8")

# Helper functions from multi_file.py
def upload_files(file_paths):
    """
    Upload files to Gemini and save their URIs to a JSON file.
    Returns the file references for immediate use.
    """
    # Upload files and get references
    file_refs = [genai.upload_file(file_path) for file_path in file_paths]
    
    # Extract URIs and save to file_uris.json
    file_uris = [file_ref.uri.split('/')[-1] for file_ref in file_refs]
    with open('file_uris.json', 'w') as f:
        json.dump(file_uris, f)
    
    return file_refs

def load_files_from_uris():
    """
    Load files using URIs saved in file_uris.json.
    This is faster than re-uploading files that have already been uploaded.
    """
    if not os.path.exists('file_uris.json'):
        return None
    
    with open('file_uris.json', 'r') as f:
        file_uris = json.load(f)
    
    file_refs = []
    for uri in file_uris:
        file_ref = genai.get_file(uri)
        file_refs.append(file_ref)
    
    return file_refs

def create_input_with_files(file_refs, additional_text=None):
    """
    Create an input list with files separated by two newlines.
    Prepend the file display name before each file.
    Optionally append additional text at the end.
    """
    input_list = []
    for i, file_ref in enumerate(file_refs):
        # Prepend the file display name
        input_list.append(f"File: {file_ref.display_name}\n")
        input_list.append(file_ref)
        if i < len(file_refs) - 1:
            input_list.append('\n\n')  # Add two new lines between files
    
    if additional_text:
        input_list.append(additional_text)
    
    return input_list

def generate_study_guide(file_refs):
    """Generate a structured study guide from the files"""
    # Create new model configured for JSON response
    json_response_model = genai.GenerativeModel(
        # model_name='gemini-2.0-pro-exp-02-05',
        model_name = 'gemini-2.5-pro-exp-03-25',
        # system_instruction="Always respond in English and format responses as valid JSON. "
    )
    
    # Prompt for structured study guide
    structured_prompt = create_input_with_files(
        file_refs, 
        "\n\nOrganize all concepts extracted from the files into a structured study guide. The output should be a JSON array of units (the total number of units cannot exceed 3x (the number of provided files)). Each unit must contain a 'unit' (the title of the unit) and an 'overview' that summarizes the key ideas of that unit. Each unit should also have a 'sections' array. Every section within the unit must include a 'section_title', a 'narrative' explanation that details the concepts in that section, and a 'key_points' array that lists the essential takeaways. For each section, generate three quiz questions that test understanding of the material. Each quiz question should be a JSON object with a 'question', an array of four 'choices' (all with roughly equivalent length & complexity), and a 'correct_answer' that matches one of the choices. Additionally, at the end of each unit, generate a unit-level quiz consisting of ten quiz questions in the same format. Ensure that the units progressively build on each other to form a cohesive understanding of the course material. Use information primarily from the course materials, and supplement with additional details as needed."
    )
    
    # Define nested schemas for the JSON response
    quiz_schema = {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "choices": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Array of four choices for the quiz question. All choices should be of roughly equivalent length and complexity."
            },
            "correct_answer": {"type": "string"}
        },
        "required": ["question", "choices", "correct_answer"]
    }
    
    section_schema = {
        "type": "object",
        "properties": {
            "section_title": {"type": "string"},
            "narrative": {"type": "string"},
            "key_points": {
                "type": "array",
                "items": {"type": "string"}
            },
            "quizzes": {
                "type": "array",
                "items": quiz_schema
            }
        },
        "required": ["section_title", "narrative", "key_points", "quizzes"]
    }
    tokens = json_response_model.count_tokens(structured_prompt)
    print(f"Token count for structured prompt: {tokens}")
    
    # Generate structured response with the schema
    structured_response = json_response_model.generate_content(
        structured_prompt,
        generation_config={
            'response_mime_type': 'application/json',
            'response_schema': {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "unit": {"type": "string"},
                        "overview": {"type": "string"},
                        "sections": {
                            "type": "array",
                            "items": section_schema
                        },
                        "unit_quiz": {
                            "type": "array",
                            "items": quiz_schema
                        }
                    },
                    "required": ["unit", "overview", "sections", "unit_quiz"]
                }
            }
        }
    )
    
    # Extract the JSON content from the response
    response_text = structured_response.text
    
    # Check if the response contains Markdown JSON code blocks
    if "```json" in response_text:
        # Extract the content between ```json and ```
        start_idx = response_text.find("```json") + 7  # Move past "```json"
        end_idx = response_text.find("```", start_idx)
        if end_idx != -1:
            response_text = response_text[start_idx:end_idx].strip()
    
    # Save clean JSON response to file
    output_file_path = os.path.join('static', 'output.json')
    with open(output_file_path, 'w') as f:
        f.write(response_text)
    
    # Return the parsed JSON data
    return json.loads(response_text)

# Flask routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
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
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
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
        
        # Clear any existing chat sessions when new files are uploaded
        global active_chats
        active_chats = {}
        
        return jsonify({'success': True, 'message': 'Study guide generated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/study-guide')
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

@app.route('/chat')
def chat():
    # Check if we have uploaded files
    if not os.path.exists('file_uris.json'):
        return render_template('error.html', message="No study materials found. Please upload files first.")
    
    # Create a new chat session ID if one doesn't exist
    if 'chat_id' not in session:
        session['chat_id'] = str(uuid.uuid4())
    
    return render_template('chat.html')

@app.route('/new-chat', methods=['POST'])
def new_chat():
    # Create a new chat session ID
    session['chat_id'] = str(uuid.uuid4())
    
    # Remove the old chat session if it exists
    chat_id = session.get('chat_id')
    if chat_id in active_chats:
        del active_chats[chat_id]
    
    return jsonify({'success': True})

@app.route('/send-chat', methods=['POST', 'GET'])
def send_chat():
    # Get the chat ID from the session
    chat_id = session.get('chat_id')
    if not chat_id:
        chat_id = str(uuid.uuid4())
        session['chat_id'] = chat_id
        logger.debug(f"Created new chat ID: {chat_id}")
    else:
        logger.debug(f"Using existing chat ID: {chat_id}")
    
    # For SSE connection request (GET)
    if request.method == 'GET':
        logger.debug(f"Handling GET request for SSE connection for chat_id: {chat_id}")
        
        # Create a message queue for this chat if it doesn't exist
        if chat_id not in message_queues:
            logger.debug(f"Creating new message queue for chat_id: {chat_id}")
            message_queues[chat_id] = Queue()
        
        def event_stream():
            # Send an initial connection message
            logger.debug(f"Establishing SSE connection for chat_id: {chat_id}")
            yield f"data: {json.dumps({'connection': 'established'})}\n\n"
            
            # Continue streaming from the queue until we get a done message
            queue = message_queues[chat_id]
            done = False
            
            while not done:
                try:
                    # Try to get a message from the queue with a timeout
                    message = queue.get(timeout=60)  # 60 second timeout
                    logger.debug(f"Got message from queue for chat_id {chat_id}: {str(message)[:100]}...")
                    
                    # Check if this is a done message
                    if isinstance(message, dict) and message.get('done'):
                        done = True
                    
                    # Send the message to the client
                    yield f"data: {json.dumps(message)}\n\n"
                    
                except Exception as e:
                    # If we timeout or there's another error, end the stream
                    logger.error(f"Error or timeout in event_stream for chat_id {chat_id}: {str(e)}")
                    # Send an error message
                    yield f"data: {json.dumps({'error': 'Stream timeout or error occurred'})}\n\n"
                    done = True
        
        return Response(
            stream_with_context(event_stream()), 
            content_type='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Content-Type': 'text/event-stream',
                'Connection': 'keep-alive',
                'X-Accel-Buffering': 'no'  # Disable proxy buffering
            }
        )
    
    # For sending a message (POST)
    try:
        logger.debug(f"Handling POST request for chat message for chat_id: {chat_id}")
        
        # Get the user's message from the request
        data = request.json
        logger.debug(f"Request data: {data}")
        
        user_message = data.get('message', '')
        model_name = data.get('model', 'gemini-2.0-flash')
        # Always use streaming regardless of what the client requests
        stream_response = True
        
        logger.debug(f"User message: '{user_message[:30]}...' (truncated), Model: {model_name}, Stream: {stream_response}")
        
        # Make sure we have a message queue for this chat
        if chat_id not in message_queues:
            logger.debug(f"Creating message queue for chat_id: {chat_id}")
            message_queues[chat_id] = Queue()
        else:
            # Clear any existing items in the queue (in case of a previous interrupted request)
            while not message_queues[chat_id].empty():
                try:
                    message_queues[chat_id].get_nowait()
                except:
                    pass
            logger.debug(f"Cleared existing message queue for chat_id: {chat_id}")
        
        # Load file references
        logger.debug("Loading file references")
        file_refs = load_files_from_uris()
        if not file_refs:
            logger.error("No study materials found")
            error_msg = 'No study materials found. Please upload files first.'
            
            # Put the error in the queue
            message_queues[chat_id].put({'error': error_msg})
            message_queues[chat_id].put({'done': True})
            
            return jsonify({'error': error_msg}), 400
        
        # Get or create a chat session
        if chat_id not in active_chats:
            logger.debug(f"Creating new chat session for ID: {chat_id}")
            
            # Create a new chat model with the selected model
            chat_model = genai.GenerativeModel(
                model_name=model_name, 
                system_instruction="""You are a helpful study assistant. 
                Always respond in English, providing clear and concise explanations. 
                Use markdown formatting for better readability.
                Use **bold** for important terms, *italics* for emphasis, and lists when appropriate.
                Format code with ```language code blocks``` when relevant.
                Use examples and analogies when helpful. 
                Focus on answering questions about the content of the uploaded study materials."""
            )
            
            # Start a new chat session (no initial message)
            chat = chat_model.start_chat(history=[])
            
            # Store the chat and the model choice in our dictionary
            active_chats[chat_id] = {
                "chat": chat,
                "model": model_name,
                "first_message": True
            }
        else:
            logger.debug(f"Using existing chat session for ID: {chat_id}")
            # Check if model has changed
            current_model = active_chats[chat_id].get("model", "gemini-2.0-flash")
            
            if current_model != model_name:
                logger.debug(f"Model changed from {current_model} to {model_name}")
                # Model has changed, create a new chat with the new model
                chat_model = genai.GenerativeModel(
                    model_name=model_name, 
                    system_instruction="""You are a helpful study assistant. 
                    Always respond in English, providing clear and concise explanations. 
                    Use markdown formatting for better readability.
                    Use **bold** for important terms, *italics* for emphasis, and lists when appropriate.
                    Format code with ```language code blocks``` when relevant.
                    Use examples and analogies when helpful. 
                    Focus on answering questions about the content of the uploaded study materials."""
                )
                
                # Start a new chat session
                chat = chat_model.start_chat(history=[])
                
                # Get history from the old chat and apply it to the new chat
                logger.debug("Transferring chat history to new model")
                previous_chat_history = active_chats[chat_id]["chat"].history
                
                # Flag to track if we need to add file context to the first message
                needs_context = True
                
                for message in previous_chat_history:
                    if message.role == "user":
                        if needs_context:
                            logger.debug("Adding file context with first user message in history")
                            combined_message = create_input_with_files(file_refs, additional_text=message.parts[0].text)
                            chat.send_message(combined_message)
                            needs_context = False
                        else:
                            chat.send_message(message.parts[0].text)
                
                # Update chat and model in our dictionary
                active_chats[chat_id] = {
                    "chat": chat,
                    "model": model_name,
                    "first_message": False
                }
            else:
                # Use the existing chat session
                chat = active_chats[chat_id]["chat"]
        
        # Always use streaming response
        logger.debug("Using streaming response pattern")
        
        # Define a worker function to process the message in a separate thread
        def process_message_worker():
            try:
                # Get the queue for this chat
                queue = message_queues[chat_id]
                
                # Check if this is the first message for this chat session
                is_first_message = active_chats[chat_id].get("first_message", False)
                
                if is_first_message:
                    # Attach files to the user's message for the first message
                    logger.debug("First message: attaching files to user's message")
                    combined_message = create_input_with_files(file_refs, additional_text=user_message)
                    response_stream = chat.send_message(combined_message, stream=True)
                    active_chats[chat_id]["first_message"] = False
                else:
                    response_stream = chat.send_message(user_message, stream=True)
                
                # Stream each chunk as it comes in
                full_response = ""
                chunk_count = 0
                
                for chunk in response_stream:
                    chunk_count += 1
                    if chunk.text:
                        full_response += chunk.text
                        chunk_data = {'chunk': chunk.text, 'full_response': full_response}
                        logger.debug(f"Adding chunk #{chunk_count}: '{chunk.text[:30]}...' (truncated)")
                        queue.put(chunk_data)
                        time.sleep(0.01)
                
                logger.debug(f"Processed {chunk_count} chunks in total")
                
                # Send a completion message to the queue
                logger.debug("Adding completion message to queue")
                queue.put({'done': True, 'full_response': full_response})
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error in worker thread: {error_msg}")
                logger.error(traceback.format_exc())
                queue = message_queues.get(chat_id)
                if queue:
                    queue.put({'error': error_msg})
                    queue.put({'done': True})
        
        # Start the processing in a separate thread
        logger.debug("Starting worker thread to process message")
        thread = threading.Thread(target=process_message_worker)
        thread.daemon = True
        thread.start()
        
        # Return success immediately - the client is already connected via SSE
        return jsonify({'success': True, 'message': 'Processing started'})
            
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Error in send_chat: {error_msg}")
        logger.error(traceback.format_exc())
        if chat_id in message_queues:
            message_queues[chat_id].put({'error': error_msg})
            message_queues[chat_id].put({'done': True})
        
        return jsonify({'error': error_msg}), 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

# Quiz routes
@app.route('/quiz')
def quiz():
    return render_template('quiz.html')

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    try:
        data = request.get_json()
        model = data.get('model', 'gemini-2.5-pro-exp-03-25')
        # model = data.get('model', 'gemini-2.0-flash')
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

        print(question_count)
        
        # Start the quiz generation in a background thread
        thread = threading.Thread(
            target=generate_quiz_in_background,
            args=(generation_id, model, question_count, file_refs)
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

@app.route('/cancel-quiz/<generation_id>', methods=['POST'])
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

# Store quiz generation results
quiz_results = {}

def generate_quiz_in_background(generation_id, model, question_count, file_refs):
    try:
        if not file_refs:
            quiz_results[generation_id] = {
                'status': 'error',
                'message': 'No study materials found. Please upload documents first.'
            }
            return
        
        print(question_count)
        
        # Prepare the prompt for the AI
        prompt = f"""
        Create a comprehensive exam preparation quiz with {question_count} multiple-choice questions based on the provided study materials.
        
        Each question should:
        1. Test important concepts that might appear on an exam
        2. Have 4 answer choices (A, B, C, D)
        3. Have only one correct answer
        
        Format the output as JSON with this structure:
        {{
            "questions": [
                {{
                    "question": "Question text here",
                    "choices": ["Choice A", "Choice B", "Choice C", "Choice D"],
                    "correct_answer": "The exact text of the correct choice"
                }}
            ]
        }}
        
        Ensure the questions cover all important topics in the material and vary in difficulty.
        """

        print(prompt)
        
        # Create a new model for the quiz generation
        quiz_model = genai.GenerativeModel(model_name=model)
        
        # Use the create_input_with_files function just like in chat functionality
        input_prompt = create_input_with_files(file_refs, additional_text=prompt)
        
        # Generate content with the files
        response = quiz_model.generate_content(input_prompt)
        
        # Extract the quiz JSON from the response
        quiz_json = extract_json_from_response(response)
        
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

@app.route('/quiz-status/<generation_id>')
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

def extract_json_from_response(response):
    try:
        text = response.text
        # Look for JSON content between curly braces
        json_match = re.search(r'({[\s\S]*})', text)
        if json_match:
            json_str = json_match.group(1)
            return json.loads(json_str)
        else:
            # If no JSON pattern found, try to parse the whole response
            return json.loads(text)
    except Exception as e:
        print(f"Error extracting JSON: {e}")
        # As a fallback, return a simple error structure
        return {'error': 'Failed to parse JSON response', 'questions': []}

# We can remove this unused function or keep it for future use
def get_document_uris():
    # This would fetch the cached document URIs stored when files were uploaded
    if 'document_uris' in session:
        return session['document_uris']
    # Try loading from file_uris.json as fallback
    try:
        if os.path.exists('file_uris.json'):
            with open('file_uris.json', 'r') as f:
                return json.load(f)
    except:
        pass
    return []

if __name__ == '__main__':
    # Create static directory if it doesn't exist
    os.makedirs('static', exist_ok=True)
    app.run(debug=True)