from flask import current_app
import model_config
from app.services.gemini_service import GeminiService
from app.services.file_service import FileService
from app.helpers.json_utils import extract_json_from_response

class QuizGenerator:
    """Class for generating quiz questions from study materials"""
    
    @staticmethod
    def generate_quiz_questions(file_refs, num_questions, context_prompt="", model_name=None, progress_callback=None):
        """
        Generate quiz questions using the Gemini API.
        
        Args:
            file_refs (list): List of Gemini file references.
            num_questions (int): Number of quiz questions to generate.
            context_prompt (str, optional): Additional context to include in the prompt.
            model_name (str, optional): Override the default quiz model.
            progress_callback (callable, optional): Function to call with progress updates
            
        Returns:
            list: List of dictionaries with the following structure:
                  {'question': str, 'choices': List[str], 'correct_answer': str}
        """
        try:
            # Helper function to log to both app logger and progress callback
            def log_progress(message, level="info"):
                if level == "info":
                    current_app.logger.info(message)
                elif level == "warning":
                    current_app.logger.warning(message)
                elif level == "error":
                    current_app.logger.error(message)
                    
                # Also send to progress callback if provided
                if progress_callback:
                    progress_callback(message)
            
            if not file_refs:
                log_progress("No file references provided for quiz generation", "warning")
                return []
            
            # Use provided model name or fall back to default
            if not model_name:
                model_name = model_config.DEFAULT_QUIZ_MODEL
            
            # Prepare the context string if provided
            context_str = f":\n{context_prompt}" if context_prompt else "."
            
            # Get the quiz generation prompt from model_config
            prompt = model_config.QUIZ_GENERATION_PROMPT.format(
                num_questions=num_questions,
                context_str=context_str
            )
            
            # Create a new model for the quiz generation
            quiz_model = GeminiService.create_json_model(model_name)
            
            # Use the create_input_with_files function to combine files and prompt
            input_prompt = FileService.create_input_with_files(file_refs, additional_text=prompt)

            print(input_prompt)
            
            # Generate content with the files
            response = GeminiService.generate_content(quiz_model, input_prompt)
            
            # Extract the questions from the respons
            questions = extract_json_from_response(response)
            
            # If we get a dict with 'questions' key, extract the questions
            if isinstance(questions, dict) and 'questions' in questions:
                questions = questions['questions']
            
            # Validate the structure of each question
            valid_questions = []
            for q in questions:
                if (isinstance(q, dict) and 
                    'question' in q and 
                    'choices' in q and 
                    'correct_answer' in q and 
                    isinstance(q['choices'], list) and 
                    len(q['choices']) == 4 and 
                    q['correct_answer'] in q['choices']):
                    valid_questions.append(q)
                else:
                    log_progress(f"Skipping invalid question structure: {q}", "warning")
            
            return valid_questions
            
        except Exception as e:
            error_msg = f"Error generating quiz questions: {e}"
            current_app.logger.error(error_msg)
            if progress_callback:
                progress_callback(error_msg)
            raise

# Create an init file to make the core directory a package
import os
with open(os.path.join(os.path.dirname(__file__), '__init__.py'), 'w') as f:
    f.write('# This file makes the core directory a Python package')