import os
from flask import current_app
import model_config
from app.services.gemini_service import GeminiService
from app.services.file_service import FileService
from app.helpers.json_utils import extract_json_from_response, save_json_to_file
from app.core.quiz_generator import QuizGenerator

class StudyGuideGenerator:
    """Class for generating structured study guides from study materials"""
    
    @staticmethod
    def generate_study_guide(file_refs, model_name=None, progress_callback=None):
        """
        Generate a structured study guide from the study materials.
        
        Args:
            file_refs (list): List of Gemini file references
            model_name (str, optional): Override the default study guide model
            progress_callback (callable, optional): Function to call with progress updates
            
        Returns:
            dict: The generated study guide data structure
        """
        try:
            # Helper function to log and report progress
            def log_progress(message, progress=None):
                current_app.logger.info(message)
                if progress_callback:
                    progress_callback(message, progress=progress)
            
            if not file_refs:
                log_progress("No file references provided for study guide generation")
                return None
                
            # Use provided model name or fall back to default
            if not model_name:
                model_name = model_config.DEFAULT_STUDY_GUIDE_MODEL
            
            # Create new model for JSON response
            json_response_model = GeminiService.create_model(model_name)
            
            # Define schema for the response
            section_schema = {
                "type": "object",
                "properties": {
                    "section_title": {"type": "string"},
                    "narrative": {"type": "string"},
                    "key_points": {
                        "type": "array",
                        "items": {"type": "string"}
                    }
                },
                "required": ["section_title", "narrative", "key_points"]
            }
            
            response_schema = {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "unit": {"type": "string"},
                        "overview": {"type": "string"},
                        "sections": {
                            "type": "array",
                            "items": section_schema
                        }
                    },
                    "required": ["unit", "overview", "sections"]
                }
            }
            
            # Get the structured study guide prompt from model_config
            structured_prompt = model_config.STUDY_GUIDE_PROMPT
            
            # Create input with files and prompt
            input_prompt = FileService.create_input_with_files(file_refs, additional_text=structured_prompt)
            
            # Log token count for the structured prompt
            tokens = GeminiService.count_tokens(input_prompt)
            log_progress(f"Token count: {tokens}", progress=0)
            
            # Generate structured response with the schema
            log_progress("Generating initial study guide structure...", progress=0)
            structured_response = GeminiService.generate_content(
                json_response_model,
                input_prompt,
                schema=response_schema
            )
            
            # Extract the JSON content from the response
            study_guide_data = extract_json_from_response(structured_response)
            
            total_units = len(study_guide_data)
            # Report that base structure is generated, but keep progress at 0%
            log_progress(f"Generated base structure with {total_units} units", progress=0)
            
            # Initialize progress tracking variables - we're starting at 0% after base structure
            cumulative_progress = 0
            
            # Avoid division by zero if there are no units
            if total_units == 0:
                log_progress("No units were generated in the study guide", progress=100)
                return study_guide_data
            
            # Calculate points per unit (distribute 100% equally among units)
            points_per_unit = 100 / total_units
            
            # Now add the quizzes to each section and unit
            for unit_index, unit in enumerate(study_guide_data):
                unit_title = unit['unit']
                unit_number = unit_index + 1
                log_progress(f"Processing unit {unit_number}/{total_units}: {unit_title}...")
                
                # Calculate total questions to be generated for this unit
                num_sections = len(unit['sections'])
                total_questions_in_unit = (num_sections * 3) + 10  # 3 per section + 10 for unit assessment
                
                # Calculate progress increment per question for this unit
                # Handle division by zero if there are no questions to generate
                progress_per_question_in_unit = points_per_unit / total_questions_in_unit if total_questions_in_unit > 0 else 0
                
                total_sections = len(unit['sections'])
                # Add quiz questions to each section
                for section_index, section in enumerate(unit['sections']):
                    section_title = section['section_title']
                    section_number = section_index + 1
                    log_progress(f"Processing section {section_number}/{total_sections} for unit {unit_number}: {section_title}...")
                    
                    # Create a structured context with section information for better quiz generation
                    section_context = {
                        "unit_title": unit_title,
                        "section_title": section_title,
                        "section_overview": section.get('narrative', ''),
                        "key_points": section.get('key_points', [])
                    }
                    
                    # Use the section quiz prompt template from model_config
                    key_points_formatted = chr(10).join('- ' + point for point in section_context['key_points'])
                    context_prompt = model_config.SECTION_QUIZ_PROMPT_TEMPLATE.format(
                        section_title=section_title,
                        unit_title=unit_title,
                        section_overview=section_context['section_overview'],
                        key_points=key_points_formatted
                    )
                    
                    # Generate 3 questions for this section
                    log_progress(f"Generating 3 quiz questions for section '{section_title}'...")
                    section_quizzes = QuizGenerator.generate_quiz_questions(
                        file_refs, 
                        3, 
                        context_prompt=context_prompt,
                        progress_callback=progress_callback  # Pass the progress callback here
                    )
                    
                    # Add the quizzes to the section data
                    section['quizzes'] = section_quizzes
                    
                    # Update progress based on number of questions actually generated
                    questions_generated = len(section_quizzes)
                    increment = questions_generated * progress_per_question_in_unit
                    cumulative_progress += increment
                    
                    # Report progress (rounded and capped at 100)
                    progress_value = min(round(cumulative_progress), 100)
                    log_progress(
                        f"Added {questions_generated} questions to section '{section_title}'",
                        progress=progress_value
                    )
                
                # Generate 10 questions for the unit assessment
                log_progress(f"Generating unit assessment quiz for '{unit_title}'...")
                
                # Create a comprehensive context with the unit overview and all sections
                unit_context = {
                    "unit_title": unit_title,
                    "unit_overview": unit.get('overview', ''),
                    "sections": []
                }
                
                # Add all section information to the context
                for section in unit['sections']:
                    unit_context['sections'].append({
                        "title": section['section_title'],
                        "overview": section.get('narrative', ''),
                        "key_points": section.get('key_points', [])
                    })
                
                # Build sections content for the unit quiz prompt
                sections_content = ""
                for i, section in enumerate(unit_context['sections']):
                    section_content = f"""
                    Section {i+1}: {section['title']}
                    Overview: {section['overview'][:300]}...
                    Key Points:
                    {chr(10).join('- ' + point for point in section['key_points'])}
                    """
                    sections_content += section_content
                
                # Use the unit quiz prompt template from model_config
                context_prompt = model_config.UNIT_QUIZ_PROMPT_TEMPLATE.format(
                    unit_title=unit_title,
                    unit_overview=unit_context['unit_overview'],
                    sections_content=sections_content
                )
                
                unit_quiz_list = QuizGenerator.generate_quiz_questions(
                    file_refs, 
                    10, 
                    context_prompt=context_prompt,
                    progress_callback=progress_callback  # Pass the progress callback here
                )
                
                # Add the unit quiz to the unit data
                unit['unit_quiz'] = unit_quiz_list
                
                # Update progress based on number of questions actually generated for unit assessment
                unit_questions_generated = len(unit_quiz_list)
                unit_increment = unit_questions_generated * progress_per_question_in_unit
                cumulative_progress += unit_increment
                
                # Report progress (rounded and capped at 100)
                progress_value = min(round(cumulative_progress), 100)
                log_progress(
                    f"Added {unit_questions_generated} questions to unit assessment for '{unit_title}'",
                    progress=progress_value
                )
            
            # Save clean JSON response to file
            output_file_path = os.path.join('static', 'output.json')
            save_json_to_file(study_guide_data, output_file_path)
            
            # Ensure final progress is exactly 100%
            log_progress(f"Study guide generated successfully with {len(study_guide_data)} units", progress=100)
            return study_guide_data
            
        except Exception as e:
            error_msg = f"Error generating study guide: {e}"
            current_app.logger.error(error_msg)
            if progress_callback:
                progress_callback(error_msg)
            raise