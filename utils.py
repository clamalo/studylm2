import os
import json
import re
import google.generativeai as genai

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

def extract_json_from_response(response):
    """
    Extract JSON from the Gemini API response.
    Returns a Python dictionary parsed from the JSON in the response.
    """
    try:
        text = response.text
        
        # Check if the response contains Markdown JSON code blocks
        if "```json" in text:
            # Extract the content between ```json and ```
            start_idx = text.find("```json") + 7  # Move past "```json"
            end_idx = text.find("```", start_idx)
            if end_idx != -1:
                text = text[start_idx:end_idx].strip()
        
        # Look for JSON content between curly braces if no code block was found
        if not text.strip() or "```" in text:
            json_match = re.search(r'({[\s\S]*})', text)
            if json_match:
                text = json_match.group(1)
        
        # Parse the text as JSON
        return json.loads(text)
    except Exception as e:
        print(f"Error extracting JSON: {e}")
        # Return an empty list as a fallback
        return []

def generate_quiz_questions(file_refs, num_questions, context_prompt=""):
    """
    Generate quiz questions using the Gemini API based on the provided file references.
    
    Args:
        file_refs (list): List of Gemini file references.
        num_questions (int): Number of quiz questions to generate.
        context_prompt (str, optional): Additional context to include in the prompt.
    
    Returns:
        list: List of dictionaries with the following structure:
              {'question': str, 'choices': List[str], 'correct_answer': str}
    """
    try:
        if not file_refs:
            print("No file references provided for quiz generation")
            return []
        
        # Prepare the context string if provided
        context_str = f" {context_prompt}" if context_prompt else ""
        
        # Prepare the prompt for the AI
        prompt = f"""
        Create a comprehensive exam preparation quiz with {num_questions} multiple-choice questions based on the provided study materials{context_str}.
        
        Each question should:
        1. Test important concepts that might appear on an exam
        2. Have exactly 4 answer choices
        3. Have only one correct answer
        
        Format your entire response as a valid JSON array of objects. Each object should have the following structure:
        [
            {{
                "question": "Question text here",
                "choices": ["Choice A", "Choice B", "Choice C", "Choice D"],
                "correct_answer": "The exact text of the correct choice"
            }}
        ]
        
        Ensure all questions are directly related to the content in the provided materials. 
        Ensure each question has EXACTLY 4 choices.
        Ensure the correct_answer value exactly matches one of the choices.
        """
        
        # Create a new model for the quiz generation
        quiz_model = genai.GenerativeModel(
            # model_name="gemini-2.5-pro-exp-03-25",
            model_name = 'gemini-2.0-flash',
            generation_config={
                'response_mime_type': 'application/json'
            }
        )
        
        # Use the create_input_with_files function to combine files and prompt
        input_prompt = create_input_with_files(file_refs, additional_text=prompt)
        
        # Generate content with the files
        response = quiz_model.generate_content(input_prompt)
        
        # Extract the questions from the response
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
        
        return valid_questions
        
    except Exception as e:
        print(f"Error generating quiz questions: {e}")
        return []