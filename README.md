# StudyLM: Your Personal AI Study Assistant

Hello! Welcome to StudyLM. This is a simple tool designed to help you study more effectively.

**What it does:**

1.  You give it your study materials (like notes or documents you have saved as PDF, DOCX, or TXT files).
2.  It uses Artificial Intelligence (AI) to read through them.
3.  It automatically creates a helpful **Study Guide** for you, broken down into units and sections with key points.
4.  It creates **Quizzes** within the study guide so you can test your understanding.
5.  It lets you **Chat** with an AI assistant that knows about *your* specific study materials, so you can ask questions.
6.  It can generate a longer, comprehensive **Quiz** covering everything in your materials.

Think of it as a smart helper that reads your notes and helps you prepare for tests!

**Who is this guide for?**

This guide is for **everyone**, especially if you're not very familiar with computers or code. We will walk you through *every single step* to get this working on your computer. No prior experience needed!

---

## What You Will Need

Before we start, make sure you have these things:

1.  **A Computer:** Running either Windows or macOS.
2.  **Internet Connection:** The AI part of this tool needs the internet to work.
3.  **Your Study Files:** The notes or documents you want to use (saved as PDF, DOCX, or TXT).
4.  **A Web Browser:** Like Google Chrome, Firefox, Microsoft Edge, or Safari.

---

## Step-by-Step: Getting Started

Please follow these steps carefully, one by one.

### Step 1: Download the Code

The code for StudyLM lives on a website called GitHub. You need to download it as a ZIP file.

1.  Go to the GitHub page for this project (the page you are likely reading this on right now!).
2.  Look for a green button that says **`< > Code`**. Click on it.
3.  A small menu will appear. Click on **`Download ZIP`**.
4.  Save the ZIP file somewhere you can easily find it, like your `Downloads` folder or your Desktop.

![GitHub Download ZIP illustration](https://docs.github.com/assets/cb-13738/images/help/repository/download-zip.png)
*(Image shows where to find the Download ZIP button)*

### Step 2: Unzip the Files

The downloaded file is a `.zip` file, which is like a compressed folder. You need to "unzip" or "extract" it.

* **On Windows:**
    * Find the downloaded ZIP file (it probably ends with `-main.zip`).
    * Right-click on the file.
    * Choose **`Extract All...`**.
    * A window will pop up asking where to put the extracted files. The suggested location is usually fine. Make sure the box "Show extracted files when complete" is checked.
    * Click **`Extract`**. A new folder will open containing the code.
* **On Mac:**
    * Find the downloaded ZIP file (it probably ends with `-main.zip`).
    * Double-click the file.
    * It should automatically create a new folder with the same name (without the `.zip`) containing the code.

You should now have a regular folder (likely named `StudyLM-main` or similar) with files like `app.py` and folders like `static` and `templates` inside it. **Remember where this folder is!**

### Step 3: Install Python (If you don't have it)

StudyLM is written in a computer language called Python. Your computer might already have it, but if not, you need to install it. It's free and safe.

1.  **Check if you have Python:** We'll do this in the next step using the "Terminal" or "Command Prompt".
2.  **If you need to install it:**
    * Go to the official Python website: [python.org/downloads/](https://www.python.org/downloads/)
    * The website should automatically detect if you're on Windows or Mac and show you the latest version.
    * Click the button to download the installer (e.g., "Download Python 3.x.x").
    * Once downloaded, run the installer:
        * **On Windows:** Double-click the `.exe` file. **IMPORTANT:** On the very first screen of the installer, make sure to check the box that says **`Add Python 3.x to PATH`** or **`Add python.exe to Path`** at the bottom! Then click `Install Now`.
        * **On Mac:** Double-click the `.pkg` file and follow the installation steps (usually just clicking `Continue`, `Agree`, and `Install`).
    * Follow the instructions in the installer until it's finished.

### Step 4: Open the "Terminal" or "Command Prompt"

This might sound scary, but it's just a way to type commands directly to your computer.

* **On Windows:**
    * Click the Start menu (or press the Windows key on your keyboard).
    * Type `cmd` or `Command Prompt`.
    * Click on the "Command Prompt" application that appears.
* **On Mac:**
    * Open the "Finder".
    * Go to the "Applications" folder.
    * Open the "Utilities" folder.
    * Double-click on the "Terminal" application.

You should now see a window with a black or white background and some text, waiting for you to type. This is your command line interface.

*Now, let's check Python again using this window:*

1.  Type the following command exactly and press Enter:
    ```bash
    python --version
    ```
2.  If that gives an error or doesn't show a version number starting with "3" (like "Python 3.10.4"), try this command instead and press Enter:
    ```bash
    python3 --version
    ```
3.  If one of those commands shows a version like `Python 3.x.x`, then Python is installed correctly! If neither command works, go back to Step 3 and make sure you installed Python, paying special attention to the "Add to PATH" option on Windows.

### Step 5: Go to the Code Folder (Using the Terminal/Command Prompt)

Now you need to tell the Terminal/Command Prompt to look inside the folder where you unzipped the StudyLM code.

1.  You use the `cd` command (which stands for "Change Directory").
2.  You need to type `cd` followed by a space, and then the path to the folder you unzipped in Step 2.
    * *Finding the path:*
        * **Windows:** Open File Explorer, navigate *into* the unzipped folder (e.g., `StudyLM-main`). Click in the address bar at the top – it should show the path (like `C:\Users\YourName\Downloads\StudyLM-main`). Right-click and copy this path.
        * **Mac:** Open Finder, navigate *into* the unzipped folder (e.g., `StudyLM-main`). Right-click (or Ctrl+click) on the folder name in the path bar at the bottom of the Finder window (if you don't see it, go to Finder's "View" menu and select "Show Path Bar"). Choose "Copy 'StudyLM-main' as Pathname".
3.  Go back to your Terminal or Command Prompt window.
4.  Type `cd ` (make sure there's a space after `cd`).
5.  Paste the path you copied.
    * **Windows (Command Prompt):** Right-click in the window to paste.
    * **Mac (Terminal):** Press `Cmd + V` to paste.
6.  Press Enter.

Your command line prompt might change slightly to show the folder name. If you didn't get an error, you are now "inside" the code folder!

*(Example: If your folder is in Downloads and named StudyLM-main, the command might look like `cd C:\Users\YourName\Downloads\StudyLM-main` on Windows or `cd /Users/yourname/Downloads/StudyLM-main` on Mac)*

### Step 6: Install Required Software Pieces

StudyLM needs a few extra software pieces (called "dependencies") to work. Python comes with a tool called `pip` to install these easily.

1.  Make sure you are still in the Terminal/Command Prompt, inside the StudyLM folder (from Step 5).
2.  Type the following command *exactly* and press Enter:
    ```bash
    pip install Flask google-generativeai werkzeug
    ```
3.  *If that command gives an error like "pip is not recognized" or similar, try this command instead:*
    ```bash
    pip3 install Flask google-generativeai werkzeug
    ```
4.  You should see text appear in the window, showing that software is being downloaded and installed. Wait until it finishes and you see the command prompt again. If you see any warnings (yellow text), you can usually ignore them for now. If you see errors (red text), something went wrong – double-check that Python was installed correctly (Step 3) and that you are in the correct folder (Step 5).

---

## How to Run the Application

You've done all the setup! Now let's start the StudyLM application.

1.  Go back to the **Terminal** or **Command Prompt** window. (If you closed it, open it again and use the `cd` command from Step 5 to get back into the StudyLM folder).
2.  Make sure you are inside the StudyLM folder (your command prompt might show the folder name).
3.  Type the following command *exactly* and press Enter:
    ```bash
    python app.py
    ```
    *(If that gives an error, try `python3 app.py` instead)*
4.  You should see some text appear, including lines like:
    * `* Serving Flask app 'app'`
    * `* Debug mode: on` (or off)
    * `* Running on http://127.0.0.1:5000` (This address might be slightly different, but look for `http://...`)
5.  This means the application is running on your computer! It hasn't opened anything automatically, though.
6.  Open your **web browser** (Chrome, Firefox, etc.).
7.  In the address bar at the top, type the address shown in the Terminal/Command Prompt (usually `http://127.0.0.1:5000` or `http://localhost:5000`).
8.  Press Enter.

You should now see the StudyLM home page in your browser!

**Important:** The StudyLM application only runs as long as the Terminal/Command Prompt window where you typed `python app.py` is **open** and running the command.

**How to Stop the Application:**

* Go back to the Terminal/Command Prompt window that is running the app (it will have text output from the program).
* Press and hold the `Ctrl` key on your keyboard, and then press the `C` key (`Ctrl + C`).
* You might have to press it once or twice. The program should stop, and you'll see your normal command prompt again.
* The StudyLM website in your browser will no longer work until you run `python app.py` again.

---

## How to Use StudyLM

Now that it's running in your browser:

1.  **Upload Files:** On the home page, drag and drop your study files (PDF, DOCX, TXT) onto the upload area, or click "Browse Files" to select them. You'll see a list of the files you've chosen.
2.  **Generate Guide:** Click the "Generate Study Guide" button. This might take a few minutes, especially for large files, as the AI needs time to read and process them. You'll see a loading screen.
3.  **Learn Mode:** Once finished, you'll be taken to the "Learn Mode".
    * Use the **Unit Selector** at the top (buttons or dropdown) to switch between different units the AI created.
    * Read the **Overview**, **Narrative**, and **Key Points** for each section.
    * Take the short **Practice Quizzes** within each section and the **Unit Assessment** at the end of each unit. Click "Submit Answers" to see how you did.
    * Use the **Table of Contents** on the left (or the dropdown on smaller screens) to jump between sections.
4.  **Chat Mode:** Click the "Chat Mode" button at the top.
    * Type questions about the materials you uploaded into the chat box at the bottom.
    * The AI assistant will answer based on the content it read from your files.
    * You can choose different AI models (Basic is fastest, Reasoning is slowest but might be better for complex questions). Changing the model during a chat will start a new conversation history with that model.
    * Click "New Chat" to clear the conversation and start fresh.
5.  **Quiz Mode:** Click the "Quiz Mode" button at the top.
    * Select the number of questions you want.
    * Click "Generate Quiz". This uses the AI to create a longer quiz covering all your uploaded materials. It might take a minute.
    * Answer the questions and click "Check Answers" at the bottom when you're done to see your score.

---

## Important Notes & Simple Troubleshooting

* **Internet Needed:** StudyLM needs an active internet connection for the AI parts (generating the guide, quizzes, and chat) to work.
* **File Size:** There's a 50MB limit per file upload. Very large or complex files might take longer to process or cause errors.
* **`uploads` folder:** When you upload files, they are temporarily saved in a folder named `uploads` inside your StudyLM code folder.
* **`output.json` / `file_uris.json`:** These files are created inside the StudyLM folder to store the generated guide data and file references. You don't normally need to touch them. If you upload new files, `output.json` will be overwritten.
* **Something Went Wrong?**
    * Try stopping the application (`Ctrl + C` in the Terminal/Command Prompt) and running it again (`python app.py`).
    * Refresh the page in your web browser (`Ctrl+R` or `Cmd+R`).
    * Look at the Terminal/Command Prompt window for any messages, especially red text indicating an error. That might give a clue about the problem.
    * Ensure your internet connection is working.

---

That's it! We hope StudyLM helps you with your studies. If you have suggestions, please let the project owner know.