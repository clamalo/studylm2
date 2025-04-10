import os
import json
import uuid
import threading
import time
import traceback
from queue import Queue
from flask import Blueprint, render_template, request, jsonify, session, Response, stream_with_context, current_app
import google.generativeai as genai
from utils import load_files_from_uris, create_input_with_files
import model_config

# Create the blueprint
chat_bp = Blueprint('chat', __name__)

# Dictionary to store active chat sessions
active_chats = {}

# Dictionary to store message queues for streaming (maps chat_id to a queue)
message_queues = {}

@chat_bp.route('/chat')
def chat():
    # Check if we have uploaded files
    if not os.path.exists('file_uris.json'):
        return render_template('error.html', message="No study materials found. Please upload files first.")
    
    # Create a new chat session ID if one doesn't exist
    if 'chat_id' not in session:
        session['chat_id'] = str(uuid.uuid4())
    
    return render_template('chat.html', 
                          chat_models=model_config.CHAT_MODELS,
                          default_chat_model=model_config.DEFAULT_CHAT_MODEL)

@chat_bp.route('/new-chat', methods=['POST'])
def new_chat():
    # Create a new chat session ID
    session['chat_id'] = str(uuid.uuid4())
    
    # Remove the old chat session if it exists
    chat_id = session.get('chat_id')
    if chat_id in active_chats:
        del active_chats[chat_id]
    
    return jsonify({'success': True})

@chat_bp.route('/send-chat', methods=['POST', 'GET'])
def send_chat():
    # Access logger from the current application
    logger = current_app.logger
    
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
        model_name = data.get('model', model_config.DEFAULT_CHAT_MODEL)
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
                Provide clear and concise explanations. 
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
            current_model = active_chats[chat_id].get("model", model_config.DEFAULT_CHAT_MODEL)
            
            if current_model != model_name:
                logger.debug(f"Model changed from {current_model} to {model_name}")
                # Model has changed, create a new chat with the new model
                chat_model = genai.GenerativeModel(
                    model_name=model_name, 
                    system_instruction="""You are a helpful study assistant. 
                    Provide clear and concise explanations. 
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