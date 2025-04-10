"""
Centralized configuration for Gemini AI models used across the application.
This file contains all model definitions to make it easier to manage and update model versions.
It also contains all prompt templates used by the application.
"""

# Study Guide Generation Model
STUDY_GUIDE_MODEL = "gemini-2.5-pro-exp-03-25"

# Quiz Generation Model
QUIZ_MODEL = "gemini-2.0-flash"

# Chat Models
CHAT_BASIC_MODEL = "gemini-2.0-flash"
CHAT_PRO_MODEL = "gemini-2.0-pro-exp-02-05"
CHAT_REASONING_MODEL = "gemini-2.0-flash-thinking-exp-01-21"

# Dictionary of all chat models with their display names for the UI
CHAT_MODELS = {
    CHAT_BASIC_MODEL: "Basic - Fast & Intelligent",
    CHAT_PRO_MODEL: "Pro - More Intelligent",
    CHAT_REASONING_MODEL: "Reasoning - Slow, Best for Complex Questions"
}

# Default model for each function
DEFAULT_STUDY_GUIDE_MODEL = STUDY_GUIDE_MODEL
DEFAULT_QUIZ_MODEL = QUIZ_MODEL
DEFAULT_CHAT_MODEL = CHAT_BASIC_MODEL

#######################
# PROMPT TEMPLATES
#######################

# Study Guide Generation Prompt
STUDY_GUIDE_PROMPT = """
Organize all concepts extracted from the files into a structured study guide. 
The output should be a JSON array of units (the total number of units cannot exceed 3x (the number of provided files)). 
Each unit must contain a 'unit' (the title of the unit) and an 'overview' that summarizes the key ideas of that unit. 
Each unit should also have a 'sections' array. Every section within the unit must include a 'section_title', 
a 'narrative' explanation that details the concepts in that section, and a 'key_points' array that lists the essential takeaways. 
Ensure the units progressively build on each other to form a cohesive understanding of the course material. 
Use information primarily from the course materials, and supplement with additional details as needed.
"""

# Quiz Generation Prompt
QUIZ_GENERATION_PROMPT = """
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

# Section Quiz Context Prompt Template
SECTION_QUIZ_PROMPT_TEMPLATE = """
Generate questions for section titled '{section_title}' in unit '{unit_title}'.

SECTION CONTENT:
Overview: {section_overview}

Key Points:
{key_points}
"""

# Unit Quiz Context Prompt Template
UNIT_QUIZ_PROMPT_TEMPLATE = """
Generate comprehensive assessment questions for the entire unit titled '{unit_title}'.

UNIT CONTENT:
Unit Overview: {unit_overview}

SECTIONS:
{sections_content}
"""

# Chat System Prompt
CHAT_SYSTEM_PROMPT = """
You are an AI learning assistant for the study materials that have been uploaded. 
Your role is to help the user understand the concepts, answer their questions about the material,
explain difficult topics in simple terms, and assist with exam preparation.
Base your answers on the specific content in the uploaded materials.
If the answer isn't in the materials, you can provide general educational guidance,
but make it clear when you're going beyond the specific uploaded content.
"""