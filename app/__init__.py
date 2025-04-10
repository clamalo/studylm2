import os
import logging
from flask import Flask
from dotenv import load_dotenv
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def create_app():
    # Load environment variables from .env file
    load_dotenv()
    
    # Initialize Flask app
    app = Flask(__name__, 
                static_folder='../static',
                template_folder='../templates')
    
    # Configure the app
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max upload
    app.config['SECRET_KEY'] = 'your_secret_key_here'
    
    # Create upload folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Create static directory if it doesn't exist
    os.makedirs('static', exist_ok=True)
    
    # Configure Gemini API
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        print("Warning: GEMINI_API_KEY environment variable not found. Please refer to the documentation to see how to set it up.")
    else:
        genai.configure(api_key=gemini_api_key)
    
    # Register blueprints
    from .routes.main import main_bp
    from .routes.chat import chat_bp
    from .routes.quiz import quiz_bp
    
    app.register_blueprint(main_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(quiz_bp)
    
    return app