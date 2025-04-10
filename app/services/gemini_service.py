import os
import google.generativeai as genai
from flask import current_app
import model_config

class GeminiService:
    """Service class for interactions with the Gemini API"""
    
    @staticmethod
    def configure():
        """Configure the Gemini API with the API key"""
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            current_app.logger.warning("GEMINI_API_KEY environment variable not found.")
        else:
            genai.configure(api_key=gemini_api_key)
    
    @staticmethod
    def upload_file(file_path):
        """Upload a file to the Gemini API"""
        try:
            return genai.upload_file(file_path)
        except Exception as e:
            current_app.logger.error(f"Error uploading file to Gemini: {e}")
            raise
    
    @staticmethod
    def get_file(file_uri):
        """Get a file reference from Gemini by URI"""
        try:
            return genai.get_file(file_uri)
        except Exception as e:
            current_app.logger.error(f"Error retrieving file from Gemini: {e}")
            raise
    
    @staticmethod
    def create_model(model_name, **kwargs):
        """Create a new generative model instance"""
        try:
            return genai.GenerativeModel(model_name=model_name, **kwargs)
        except Exception as e:
            current_app.logger.error(f"Error creating Gemini model: {e}")
            raise
    
    @staticmethod
    def create_json_model(model_name, schema=None):
        """Create a model specifically configured for JSON responses"""
        config = {'response_mime_type': 'application/json'}
        
        if schema:
            config['response_schema'] = schema
        
        return GeminiService.create_model(
            model_name=model_name,
            generation_config=config
        )
    
    @staticmethod
    def start_chat_session(model_name, system_instruction=None):
        """Start a new chat session with the given model and system instruction"""
        try:
            chat_model = GeminiService.create_model(
                model_name=model_name,
                system_instruction=system_instruction
            )
            return chat_model.start_chat(history=[])
        except Exception as e:
            current_app.logger.error(f"Error starting chat session: {e}")
            raise

    @staticmethod
    def count_tokens(content):
        """Count the tokens in the given content"""
        temp_model = GeminiService.create_model(model_config.DEFAULT_STUDY_GUIDE_MODEL)
        return temp_model.count_tokens(content)

    @staticmethod
    def generate_content(model, content, schema=None):
        """Generate content using the specified model"""
        try:
            config = {}
            if schema:
                config = {
                    'response_mime_type': 'application/json',
                    'response_schema': schema
                }
                
            return model.generate_content(content, generation_config=config)
        except Exception as e:
            current_app.logger.error(f"Error generating content: {e}")
            raise

# Create an init file to make the services directory a package
with open(os.path.join(os.path.dirname(__file__), '__init__.py'), 'w') as f:
    f.write('# This file makes the services directory a Python package')