import json
import re
from flask import current_app

def extract_json_from_response(response):
    """
    Extract JSON from the Gemini API response.
    Returns a Python dictionary parsed from the JSON in the response.
    
    Args:
        response: The Gemini API response object
        
    Returns:
        dict or list: Parsed JSON data from the response
        
    Raises:
        ValueError: If JSON cannot be extracted from the response
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
        if not text.strip() or (not "{" in text and not "[" in text):
            json_match = re.search(r'({[\s\S]*}|\[[\s\S]*\])', text)
            if json_match:
                text = json_match.group(1)
        
        # Parse the text as JSON
        parsed_data = json.loads(text)
        return parsed_data
    except Exception as e:
        current_app.logger.error(f"Error extracting JSON from response: {e}")
        current_app.logger.error(f"Response text: {response.text[:200]}...")
        raise ValueError(f"Failed to extract valid JSON: {e}")

def save_json_to_file(data, file_path):
    """
    Save JSON data to a file
    
    Args:
        data: The data to save (must be JSON serializable)
        file_path: The path where to save the file
        
    Returns:
        bool: True if successful, raises exception otherwise
    """
    try:
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        current_app.logger.info(f"Saved JSON data to {file_path}")
        return True
    except Exception as e:
        current_app.logger.error(f"Error saving JSON to file {file_path}: {e}")
        raise

def load_json_from_file(file_path):
    """
    Load JSON data from a file
    
    Args:
        file_path: The path to the JSON file
        
    Returns:
        dict or list: The loaded JSON data
        
    Raises:
        FileNotFoundError: If the file doesn't exist
        ValueError: If the file contains invalid JSON
    """
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        return data
    except FileNotFoundError as e:
        current_app.logger.error(f"JSON file not found: {file_path}")
        raise
    except json.JSONDecodeError as e:
        current_app.logger.error(f"Invalid JSON in file {file_path}: {e}")
        raise ValueError(f"File contains invalid JSON: {e}")

# Create an init file to make the helpers directory a package
import os
with open(os.path.join(os.path.dirname(__file__), '__init__.py'), 'w') as f:
    f.write('# This file makes the helpers directory a Python package')