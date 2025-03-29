import google.generativeai as genai
import time
import json
import os
from pydantic import BaseModel
from typing import List


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
    
    print(f"Uploaded {len(file_refs)} files and saved URIs to file_uris.json")
    return file_refs


def load_files_from_uris():
    """
    Load files using URIs saved in file_uris.json.
    This is faster than re-uploading files that have already been uploaded.
    """
    if not os.path.exists('file_uris.json'):
        print("No saved URIs found. Please upload files first.")
        return None
    
    with open('file_uris.json', 'r') as f:
        file_uris = json.load(f)
    
    file_refs = []
    for uri in file_uris:
        file_ref = genai.get_file(uri)
        file_refs.append(file_ref)
    
    print(f"Loaded {len(file_refs)} files from saved URIs")
    return file_refs


def create_input_with_files(file_refs, additional_text=None):
    """
    Create an input list with files separated by two newlines.
    Optionally append additional text at the end.
    """
    input_list = []
    for i, file_ref in enumerate(file_refs):
        input_list.append(file_ref)
        if i < len(file_refs) - 1:
            input_list.append('\n\n')  # Add two new lines between files
    
    if additional_text:
        input_list.append(additional_text)
    
    return input_list


def run_single_response_demo(file_refs):
    """Run a demo with a single response from Gemini."""
    print("\n--- Running Single Response Demo ---\n")
    
    # Create new model configured for JSON response
    json_response_model = genai.GenerativeModel(
        model_name='gemini-2.0-flash',
        system_instruction="Always respond in English and format responses as valid JSON. "
    )
    
    # Prompt for structured study guide
    structured_prompt = create_input_with_files(
        file_refs, 
        '\n\nOrganize all concepts extracted from the files into a structured study guide. The output should be a JSON array of units. Each unit must contain a \'unit\' (the title of the unit) and an \'overview\' that summarizes the key ideas of that unit. Each unit should also have a \'sections\' array. Every section within the unit must include a \'section_title\', a \'narrative\' explanation that details the concepts in that section, and a \'key_points\' array that lists the essential takeaways. For each section, generate three quiz questions that test understanding of the material. Each quiz question should be a JSON object with a \'question\', an array of four \'choices\' (all with roughly equivalent length & complexity), and a \'correct_answer\' that matches one of the choices. Additionally, at the end of each unit, generate a unit-level quiz consisting of ten quiz questions in the same format. Ensure that the units progressively build on each other to form a cohesive understanding of the course material. Use information primarily from the course materials, and supplement with additional details as needed.'
    )
    
    # Define nested schemas for the JSON response
    quiz_schema = {
        "type": "object",
        "properties": {
            "question": {"type": "string"},
            "choices": {
                "type": "array",
                "items": {"type": "string"}
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
    
    # Generate structured response with the new schema
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
    
    # Save JSON response to file without printing it
    output_file_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'output.json')
    with open(output_file_path, 'w') as f:
        f.write(structured_response.text)
    print(f"Saved complete JSON response to {output_file_path}")
    
    print("--- End of Single Response Demo ---\n")


def run_multi_turn_chat_demo(file_refs):
    """Run a multi-turn chat demo with Gemini."""
    print("\n--- Starting Multi-turn Chat Demo ---\n")
    
    # Create a separate model for chat
    chat_model = genai.GenerativeModel(
        model_name='gemini-2.0-flash',
        system_instruction="Always respond in English. "
    )
    
    # Create a chat session with the same files as context
    chat = chat_model.start_chat(
        history=[],
    )
    
    # Use the helper function for chat input
    chat_input = create_input_with_files(file_refs, "\nHello, I'd like to ask some questions about these files.")
    
    response = chat.send_message(chat_input)
    print("User: Hello, I'd like to ask some questions about these files.")
    print(f"Gemini: {response.text}\n")
    
    # Second message
    response = chat.send_message("What are the main topics covered in these lectures?")
    print("User: What are the main topics covered in these lectures?")
    print(f"Gemini: {response.text}\n")
    
    # Third message
    response = chat.send_message("Can you explain one key concept from each lecture in simple terms?")
    print("User: Can you explain one key concept from each lecture in simple terms?")
    print(f"Gemini: {response.text}\n")
    
    print("--- End of Multi-turn Chat Demo ---")


def main():
    genai.configure(api_key="AIzaSyDCFi4E7uEaxZMks-aW7hZ6cX5-7yQXfu8")

    # File paths
    files_to_upload = [
        '/Users/clamalo/downloads/brainmind/lecture9_sens_online.pdf',
        '/Users/clamalo/downloads/brainmind/lecture16_lang2_online.pdf'
    ]

    # Try to load files from URIs first (faster if files already uploaded)
    file_refs = load_files_from_uris()
    
    # If loading from URIs failed, upload the files
    if not file_refs:
        file_refs = upload_files(files_to_upload)

    # # Run the single response demo
    # run_single_response_demo(file_refs)
    
    # Run the multi-turn chat demo
    run_multi_turn_chat_demo(file_refs)


if __name__ == "__main__":
    main()