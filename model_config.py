"""
Centralized configuration for Gemini AI models used across the application.
This file contains all model definitions to make it easier to manage and update model versions.
It also contains all prompt templates used by the application.
"""

# Study Guide Generation Model
STUDY_GUIDE_MODEL = "gemini-2.5-pro-exp-03-25"
# STUDY_GUIDE_MODEL = "gemini-2.0-flash"

# Quiz Generation Model
QUIZ_MODEL = "gemini-2.5-flash-preview-04-17"

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

# Study Guide Generation Prompt (Quality Focus)
STUDY_GUIDE_PROMPT = """
**TASK:** Analyze the provided files and generate a highly effective, structured study guide JSON focused on accelerating user comprehension and retention. This study guide should be very thorough and cover everything that the student needs to know for an exam on the provided material.

**CORE PRINCIPLES FOR ALL CONTENT:**
1.  **Clarity Above All:** Explain concepts in the simplest terms possible first, then introduce necessary terminology with clear definitions. Use analogies or comparisons to familiar ideas.
2.  **Practical Relevance:** Don't just define concepts; explain *why* they matter and *when* or *how* they are applied in context, based on the materials.
3.  **Engagement:** Write in a clear, direct, and somewhat engaging tone. Avoid dry, purely academic language where possible.
4.  **Depth & Examples:** Provide sufficient detail for understanding, supported by concrete examples drawn from or analogous to the source material.
5.  **Accuracy:** Base all factual content strictly on the provided materials.

**OUTPUT FORMAT:** A JSON array of units (max 3x number of files).
- Each unit object MUST contain:
    - 'unit': (string) A clear, thematic title.
    - 'overview': (string) **Write a concise, engaging overview.** Start with a hook (question, problem, surprising fact) related to the unit. Briefly introduce the main topics and emphasize their connection or overall importance within the subject. Make the user understand *why* this unit is relevant.
    - 'sections': (array) Logically ordered section objects.

- Each section object within 'sections' MUST contain:
    - 'section_title': (string) A descriptive title.
    - 'narrative': (string) **Provide a clear, comprehensive explanation.**
        - *Prioritize Clarity:* Break down complexity. Explain step-by-step if needed. Use analogies. Define terms clearly upon introduction.
        - *Show Relevance:* Explicitly connect the concept to practical applications or consequences mentioned or implied in the source text. Answer the "so what?" question for the user.
        - *Use Concrete Examples:* Include 1-2 specific examples that illustrate the concept effectively.
    - 'key_points': (array of strings) **List 3-5 truly essential takeaways.**
        - *Focus on Action/Insight:* Phrase points as concise, actionable advice, core principles, or crucial distinctions (e.g., "Key factor determining X is Y", "Always check for condition Z before applying technique W", "Distinguish A from B by focusing on C").
        - *High Value:* These should be the absolute must-remember items for understanding or applying the section's content. Avoid redundancy with the narrative.

**INSTRUCTIONS:**
- Adhere strictly to the specified JSON structure.
- Ensure logical flow and progressive building of concepts between sections and units.
- Focus intensely on making the `narrative` and `key_points` genuinely insightful and helpful for learning beyond a simple summary.
- **Ensure everything is returned in markdown format.**
"""

# Quiz Generation Prompt (Quality Focus)
QUIZ_GENERATION_PROMPT = """
**TASK:** Generate a high-quality quiz that effectively tests comprehension and ability to apply concepts. The quiz should have {num_questions} multiple-choice questions based *strictly* on the provided study materials{context_str}

**CRITICAL REQUIREMENTS FOR EACH QUESTION:**
1.  **Test Application/Analysis:** Questions MUST go beyond simple fact recall. They should require the user to *apply* rules, *interpret* information, *analyze* scenarios presented in the text, or *solve problems* using methods described in the material. Ask 'how' or 'why' based on the text.
2.  **Material-Grounded:** The correct answer MUST be unambiguously supported by the provided text. All distractors should be definitively incorrect according to the text.
3.  **Plausible & Informative Distractors:** Incorrect choices MUST be plausible and directly related to the topic. Ideally, they should represent common misunderstandings, incorrect applications of concepts from the text, or closely related concepts that are *not* the correct answer in this context. **Avoid vague, irrelevant, or obviously wrong options.**
4.  **Clarity and Precision:** Word the question and all choices clearly and precisely. Ensure there is only *one* best answer among the choices based *only* on the provided materials.
5.  **Focus on Core Concepts:** Target the most important ideas, processes, or implications within the provided context. Do not ask about trivial details or peripheral mentions.

**OUTPUT FORMAT:** A valid JSON array of objects. Each object MUST have EXACTLY the following structure:
[
  {{
    "question": "Question text here...",
    "choices": ["Choice A", "Choice B", "Choice C", "Choice D"], // Exactly 4 choices
    "correct_answer": "The exact text of the correct choice" // Must perfectly match one choice text
  }}
]

**INSTRUCTIONS:**
- **Ensure all answer choices are equal in length and complexity. The correct answer should never be the longest or shortest choice.**
- Adhere strictly to the JSON format and the 4-choice requirement.
- Fulfill *all* critical quality requirements for *every* question generated.
- Generate exactly {num_questions} questions.
- Ensure 'correct_answer' text matches one of the 'choices' exactly.
"""

# Section Quiz Context Prompt Template (Guidance Focus)
SECTION_QUIZ_PROMPT_TEMPLATE = """
**CONTEXT FOR QUIZ GENERATION:** Focus questions on the specific content of section '{section_title}' in unit '{unit_title}'.

**Key Content Summary for this Section:**
Overview/Narrative: {section_overview}
Key Points:
{key_points}

**Instruction:** Generate questions that test the ability to *apply* or *analyze* the specific information and key points listed above. Ensure questions are answerable based *only* on this section's context.
"""

# Unit Quiz Context Prompt Template (Guidance Focus)
UNIT_QUIZ_PROMPT_TEMPLATE = """
**CONTEXT FOR QUIZ GENERATION:** Focus questions on the overarching themes and integrated concepts of the *entire unit* titled '{unit_title}'.

**Summary of Content within this Unit:**
Unit Overview: {unit_overview}
Included Sections Summary:
{sections_content}

**Instruction:** Generate questions requiring synthesis of information *across* the summarized sections. Test understanding of the main concepts presented in the unit overview and how the sections contribute to the whole. Prioritize integration over isolated section facts.
"""

# Chat System Prompt (Quality Focus)
CHAT_SYSTEM_PROMPT = """
You are StudyLM, an AI learning assistant. Your primary function is to help the user understand their uploaded study materials accurately and effectively.

**Interaction Guidelines:**
1.  **Strict Material Adherence:** Base all explanations, definitions, and answers *directly and exclusively* on the content within the provided study materials. If the user's question goes beyond the materials, clearly state "That information isn't covered in the provided materials, but generally..." before offering external knowledge.
2.  **Prioritize Clarity:** Explain concepts using the simplest language possible. Break down complex ideas into logical steps or components. Use analogies or comparisons only if they genuinely clarify the concept without introducing inaccuracies. Define technical terms from the material upon first use.
3.  **Provide Concrete Examples:** When explaining a concept or process described in the materials, illustrate it with specific examples that are consistent with the context of the documents.
4.  **Direct & Focused Answers:** Address the user's specific question directly. Avoid unnecessary background information or tangential discussions unless specifically asked.
5.  **Verify Understanding (Subtly):** After a complex explanation, use gentle checks like "Does that explanation clarify things for you?" or "Would walking through an example based on the text be helpful?".
6.  **Ask for Clarification:** If a user's query is ambiguous, ask for more detail to ensure you provide the most relevant answer based on their materials (e.g., "Which part of the process are you most interested in?", "Could you specify which section you're referring to?").
7.  **Maintain Helpful Tone:** Be patient, accurate, and supportive.
"""