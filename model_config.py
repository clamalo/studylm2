"""
Centralized configuration for Gemini AI models used across the application.
This file contains all model definitions to make it easier to manage and update model versions.
"""

# Study Guide Generation Model
STUDY_GUIDE_MODEL = "gemini-2.5-pro-exp-03-25"

# Quiz Generation Model
QUIZ_MODEL = "gemini-2.5-pro-exp-03-25"

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