# StudyLM - Your AI Study Assistant

StudyLM is a personal study tool that uses AI to create structured study guides from your learning materials. Upload your documents, and StudyLM will generate interactive study guides with key points, narratives, and quizzes to help you learn efficiently.

![StudyLM Logo](https://cdn-icons-png.flaticon.com/512/1157/1157109.png)

## Features

- **AI-Generated Study Guides**: Upload your lecture notes, PDFs, or text documents and get organized study materials
- **Interactive Quizzes**: Test your knowledge with automatically generated quizzes
- **Chat Mode**: Ask questions about your study materials
- **User-Friendly Interface**: Clean design focused on distraction-free learning
- **Customization Options**: Adjust font size and toggle dark mode for comfortable reading

## Installation Guide for Mac Users (No Technical Experience Required)

This guide will walk you through installing and running StudyLM on your Mac computer, even if you've never used the command line before.

### Step 1: Install Python

1. Open your web browser and go to the official Python website: https://www.python.org/downloads/
2. Click the big "Download Python" button (it should show the latest version, e.g., "Download Python 3.10.x")
3. Once the installer is downloaded, click on it to open
4. Follow the installation wizard:
   - Make sure "Install launcher for all users" and "Add Python to PATH" are checked
   - Click "Install Now"
5. When the installation is complete, click "Close"

### Step 2: Download StudyLM from GitHub

1. Go to the GitHub page for StudyLM (the URL you were given)
2. Look for a green button labeled "Code" and click on it
3. From the dropdown menu, click "Download ZIP"
4. Find the downloaded ZIP file in your Downloads folder
5. Double-click the ZIP file to extract it
6. Move the extracted folder (named "studylm2" or similar) to a location you can easily find, like your Documents folder

### Step 3: Open Terminal

1. Press **Command (⌘) + Space** to open Spotlight Search
2. Type "Terminal" and press Enter
3. A new Terminal window will open with a command prompt

### Step 4: Navigate to the StudyLM Folder

1. In the Terminal, type the following command and press Enter:
   ```
   cd ~/Documents/studylm2
   ```
   (If you placed the folder somewhere else, replace "Documents/studylm2" with the correct path)

### Step 5: Create a Virtual Environment

1. In the Terminal, type the following command and press Enter:
   ```
   python -m venv venv
   ```
2. Then, activate the virtual environment by typing:
   ```
   source venv/bin/activate
   ```
3. You'll notice the command prompt now starts with `(venv)`, indicating the virtual environment is active

### Step 6: Install Required Packages

1. In the Terminal (with the virtual environment activated), type:
   ```
   pip install -r requirements.txt
   ```
   If no requirements.txt file exists, run these commands instead:
   ```
   pip install flask google-generativeai
   ```

### Step 7: Set Up Google API Key

To use the AI features, you'll need a Google API key:

1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key" and copy the key
4. In the Terminal, type (replace YOUR_API_KEY with the key you copied):
   ```
   export GOOGLE_API_KEY=YOUR_API_KEY
   ```

### Step 8: Run the Application

1. In the Terminal, type:
   ```
   python app.py
   ```
2. You should see a message like "Running on http://127.0.0.1:5000"
3. Open your web browser and go to: http://127.0.0.1:5000
4. The StudyLM web application should now be running in your browser!

## Using StudyLM

### Uploading Study Materials

1. Click "Browse Files" or drag and drop your files onto the upload area
2. Select your learning materials (PDF, DOCX, or TXT files work best)
3. Click "Generate Study Guide"
4. Wait while the AI processes your documents (this may take a few minutes depending on the size of your files)

### Navigating the Study Guide

1. Use the unit navigation buttons at the top to move between different units
2. The sidebar table of contents helps you jump to specific sections
3. Each section includes:
   - A narrative explanation of the concepts
   - Key points to remember
   - Interactive quizzes to test your understanding

### Using the Settings

Click the gear icon (⚙️) in the bottom left corner to access settings:
- Change font size for better readability
- Toggle dark mode for nighttime studying
- Enable/disable sound effects

### Taking Quizzes

1. Read through the study material
2. Answer the quiz questions at the end of each section
3. Click "Submit" to check your answers
4. Review your results and correct answers

### Using Chat Mode

1. Click the "Chat Mode" button in the top navigation
2. Type your questions about the study material
3. The AI will provide answers based on your uploaded documents

## Troubleshooting

**Application won't start:**
- Make sure you're in the correct folder
- Verify that Python is installed correctly
- Ensure the virtual environment is activated (you should see `(venv)` at the beginning of the command line)

**Uploading files fails:**
- Check that your files are in supported formats (PDF, DOCX, TXT)
- Ensure files are not larger than 50MB

**Study guide generation is slow:**
- Generation time depends on the size and complexity of your documents
- Larger files take longer to process

**API Key issues:**
- Make sure you've correctly set the GOOGLE_API_KEY environment variable
- Check that your API key is valid and has the necessary permissions

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository or contact the maintainer.

---

Happy studying with StudyLM!