import os
import json
from flask import current_app
from app.services.gemini_service import GeminiService

class FileService:
    """Service class for file operations and storage"""
    
    @staticmethod
    def get_upload_folder():
        """Get the configured upload folder path"""
        return current_app.config['UPLOAD_FOLDER']
    
    @staticmethod
    def save_uploaded_file(file, filename=None):
        """Save an uploaded file to the upload folder"""
        try:
            upload_folder = FileService.get_upload_folder()
            os.makedirs(upload_folder, exist_ok=True)
            
            if filename is None:
                from werkzeug.utils import secure_filename
                filename = secure_filename(file.filename)
                
            file_path = os.path.join(upload_folder, filename)
            file.save(file_path)
            current_app.logger.info(f"Saved file to {file_path}")
            return file_path
        except Exception as e:
            current_app.logger.error(f"Error saving uploaded file: {e}")
            raise
    
    @staticmethod
    def save_file_uris(file_uris):
        """Save file URIs to file_uris.json"""
        try:
            with open('file_uris.json', 'w') as f:
                json.dump(file_uris, f)
            current_app.logger.info(f"Saved {len(file_uris)} file URIs to file_uris.json")
            return True
        except Exception as e:
            current_app.logger.error(f"Error saving file URIs: {e}")
            raise
    
    @staticmethod
    def load_file_uris():
        """Load file URIs from file_uris.json"""
        try:
            if not os.path.exists('file_uris.json'):
                current_app.logger.warning("file_uris.json not found")
                return None
            
            with open('file_uris.json', 'r') as f:
                file_uris = json.load(f)
            current_app.logger.info(f"Loaded {len(file_uris)} file URIs from file_uris.json")
            return file_uris
        except Exception as e:
            current_app.logger.error(f"Error loading file URIs: {e}")
            raise
    
    @staticmethod
    def upload_files_to_gemini(file_paths):
        """Upload files to Gemini and save their URIs"""
        try:
            # Upload files and get references
            file_refs = []
            file_uris = []
            
            for file_path in file_paths:
                file_ref = GeminiService.upload_file(file_path)
                file_refs.append(file_ref)
                file_uris.append(file_ref.uri.split('/')[-1])
            
            # Save URIs for later use
            FileService.save_file_uris(file_uris)
            
            return file_refs
        except Exception as e:
            current_app.logger.error(f"Error uploading files to Gemini: {e}")
            raise
    
    @staticmethod
    def load_files_from_gemini():
        """Load file references using saved URIs"""
        try:
            file_uris = FileService.load_file_uris()
            if not file_uris:
                return None
            
            file_refs = []
            for uri in file_uris:
                file_ref = GeminiService.get_file(uri)
                file_refs.append(file_ref)
            
            current_app.logger.info(f"Loaded {len(file_refs)} file references from Gemini")
            return file_refs
        except Exception as e:
            current_app.logger.error(f"Error loading files from Gemini: {e}")
            raise
    
    @staticmethod
    def create_input_with_files(file_refs, additional_text=None):
        """Create an input list with files separated by two newlines"""
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