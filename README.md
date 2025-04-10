# StudyLM: Your Personal AI Study Assistant (for Mac)

Hello! Welcome to StudyLM. This is a simple tool designed to help you study more effectively using your Mac.

**What it does:**

1.  You give it your study materials (like notes or documents you have saved as PDF, DOCX, or TXT files).
2.  It uses Artificial Intelligence (AI) to read through them.
3.  It automatically creates a helpful **Study Guide** for you, broken down into units and sections with key points.
4.  It creates **Quizzes** within the study guide so you can test your understanding.
5.  It lets you **Chat** with an AI assistant that knows about *your* specific study materials, so you can ask questions.
6.  It can generate a longer, comprehensive **Quiz** covering everything in your materials.

Think of it as a smart helper that reads your notes and helps you prepare for tests!

**Who is this guide for?**

This guide is for Mac users, especially if you're not very familiar with computers or code. We will walk you through *every single step* to get this working on your Mac. No prior experience needed!

---

## What You Will Need

Before we start, make sure you have these things:

1.  **A Mac Computer:** Running a relatively recent version of macOS.
2.  **Internet Connection:** The AI part of this tool needs the internet to work.
3.  **Your Study Files:** The notes or documents you want to use (saved as PDF, DOCX, or TXT).
4.  **A Web Browser:** Like Safari, Google Chrome, or Firefox.
5.  **A Google Account:** Needed to get the free Gemini API key in the setup steps.

---

## Step-by-Step: Getting Started

Please follow these steps carefully, one by one.

### Step 1: Download the Code

The code for StudyLM lives on a website called GitHub. You need to download it as a ZIP file.

1.  Go to the top of the GitHub page for this project (the page you are likely reading this on right now!).
2.  Look for a green button that says **`< > Code`**. Click on it.
3.  A small menu will appear. Click on **`Download ZIP`**.
4.  Save the ZIP file to your `Downloads` folder (or somewhere else you can easily find it).

### Step 2: Unzip the Files

The downloaded file is a `.zip` file, which is like a compressed folder. You need to "unzip" it.

1.  Go to your `Downloads` folder (or wherever you saved the file).
2.  Find the downloaded ZIP file (it probably ends with `-main.zip`).
3.  **Double-click** the file.
4.  It should automatically create a new folder with the same name (without the `.zip`) containing the code.
NOTE: If the "Download ZIP" automatically downloaded the project as a folder and not a zip file, no need to double-click the file.

You should now have a regular folder (likely named `StudyLM-main` or similar) with files like `app.py` and folders like `static` and `templates` inside it. **Remember where this folder is!**

### Step 3: Install Python (If you don't have it)

StudyLM is written in a computer language called Python. Your Mac might already have it, but we often need a newer version. Let's install the latest official version just in case. It's free and safe.

1.  **Check if you have a good version:** We'll do this in the next step using the "Terminal".
2.  **Install the latest Python:**
    * Go to the official Python website: [python.org/downloads/](https://www.python.org/downloads/)
    * The website should automatically detect you're on macOS and show you the latest version.
    * Click the button to download the installer (e.g., "Download Python 3.x.x"). It will download a `.pkg` file.
    * Once downloaded, go to your `Downloads` folder and double-click the `.pkg` file.
    * Follow the installation steps (usually just clicking `Continue`, `Agree`, and `Install`). You might need to enter your Mac's password to allow the installation.
    * Follow the instructions in the installer until it's finished.

### Step 4: Open the "Terminal" Application

This might sound scary, but it's just a way to type commands directly to your Mac.

1.  Open the **Finder** (the smiling face icon in your Dock).
2.  Click on **Applications** in the sidebar.
3.  Scroll down and open the **Utilities** folder.
4.  Double-click on the **Terminal** application (it looks like a little black screen).
NOTE: Alternatively, you can hit **command + space** to open spotlight search and search for **Terminal** directly.

You should now see a window, probably with a white or black background and some text, waiting for you to type. This is your command line interface.

*Now, let's check Python again using this Terminal window:*

1.  Type the following command exactly and press the **Return** key (this is the Enter key on Mac):
    ```bash
    python3 --version
    ```
2.  You should see a version number starting with "3" (like `Python 3.11.5`). If you see this, Python is installed correctly! If you get an error or it shows a version starting with "2", go back to Step 3 and make sure the installation finished correctly.

### Step 5: Go to the Code Folder (Using the Terminal)

Now you need to tell the Terminal to look inside the folder where you put the StudyLM code. This uses a drag-and-drop trick!

1.  Go to your **Terminal** window (that you opened in Step 4).
2.  Type `cd ` (that's the letters 'c' and 'd' followed by **a single space**). **Do not press Return yet!**
3.  Now, open **Finder** and navigate to where you have the unzipped StudyLM folder (the one likely named `StudyLM-main`, perhaps in your `Downloads` folder).
4.  Click and **drag the folder icon** (the `StudyLM-main` folder itself) directly from the Finder window onto the **Terminal window**.
5.  Let go of the mouse button (drop the folder onto the Terminal window). The correct path to the folder should automatically appear in the Terminal window right after the `cd ` you typed.
6.  Now, click back into the Terminal window (make sure your cursor is at the end of the line) and press the **Return** key.

Your Terminal prompt might change slightly to show the folder name. If you didn't get an error, you are now "inside" the code folder!

*(Example: After typing `cd ` and dragging the folder, your Terminal line might look something like `cd /Users/yourname/Downloads/StudyLM-main` before you press Return)*

### Step 6: Install Required Software Pieces

StudyLM needs a few extra software pieces (called "dependencies") to work. Python comes with a tool called `pip` (or `pip3`) to install these easily.

1.  Make sure you are still in the Terminal window, inside the StudyLM folder (from Step 5).
2.  Type the following command *exactly* and press **Return**:
    ```bash
    pip3 install Flask google-generativeai werkzeug python-dotenv
    ```
    *(Note: We install `python-dotenv` even though we use `export` here, as the code still includes it for flexibility).*
3.  You should see text appear in the window, showing that software is being downloaded and installed. Wait until it finishes and you see the Terminal prompt again. If you see any warnings (yellow text), you can usually ignore them for now.

**IMPORTANT: If you see errors** when trying to install these packages, you might need to install Apple's command line developer tools first:

1. If you see an error, type the following command in Terminal and press **Return**:
   ```bash
   xcode-select --install
   ```
2. A popup window will appear asking if you want to install the developer tools. Click **Install**.
3. Wait for the installation to complete (it may take several minutes).
4. Once finished, try running the original pip install command again:
   ```bash
   pip3 install Flask google-generativeai werkzeug python-dotenv
   ```

This should resolve most common installation errors on Mac. If you're still having issues after installing the developer tools, double-check that Python was installed correctly (Step 3 & 4) and that you are in the correct folder (Step 5).

---

## Step 7: Set Up Your Gemini API Key

StudyLM uses Google's Gemini AI. To use it, you need a special code called an "API Key". Getting one is free for basic use.

### 7a. Get Your API Key from Google AI Studio

1.  **Sign in to Google AI Studio:** Visit [Google AI Studio](https://aistudio.google.com/) and log in with your Google account. You won't be able to use your school account to do this step.
2.  **Access the API Key Section:** Once logged in, look for an option like "Get API key" or navigate to the API Key section (the interface might change slightly over time). You might find this in the top left menu or on the main dashboard.
3.  **Create a New API Key:** Click on "Create API Key".
4.  **Copy Your API Key:** After creation, your unique API key will be displayed. It will be a long string of letters and numbers. **Copy this key carefully.** You will need it in the next step.

**NOTE ABOUT RATE LIMITS**: Your free account will give you access to 15 Google API calls per day, free of charge. An API call is used every time you generate a new study guide or practice exam in quiz mode. These do not apply to chats: you have essentially unlimited chat mode. If you run out, you can wait until the next day, or you can investigate setting up a paid Google API plan by pressing "Set up Billing" next to your API key in AI Studio.

### 7b. Set the API Key in Your Terminal

You need to tell the StudyLM application what your API key is *before* you run it. We will do this using the Terminal.

1.  Make sure you are still in the **Terminal** window, and you are "inside" the StudyLM code folder (you should have done the `cd` command in Step 5).
2.  Type the following command, but **replace `"YOUR_API_KEY_HERE"`** with the actual API key you copied from Google AI Studio. Make sure the key stays inside the quotation marks.
    ```bash
    export GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```
    *(Example: If your key was `ABC123XYZ`, you would type: `export GEMINI_API_KEY="ABC123XYZ"`)*
3.  Press the **Return** key. It might look like nothing happened, but you have now set the key for this *specific* Terminal session.

**VERY IMPORTANT:**
* You need to run this `export` command **every time** you open a **new** Terminal window and want to run StudyLM. The key is only set for the current session.
* Make sure you run the `export` command in the **same** Terminal window *before* you run the `python3 app.py` command in the next section.

---

## How to Run the Application

You've done all the setup! Now let's start the StudyLM application.

1.  Go back to the **Terminal** window. (If you closed it, open it again, use the `cd` command from Step 5 to get back into the StudyLM folder, and **repeat Step 7b** to set your API key using `export`).
2.  Make sure you are inside the StudyLM folder and have just run the `export` command for your API key in this window.
3.  Type the following command *exactly* and press **Return**:
    ```bash
    python3 app.py
    ```
4.  You should see some text appear, including lines like:
    * `* Serving Flask app 'app'`
    * `* Debug mode: on` (or off)
    * `* Running on http://127.0.0.1:5000` (This address might be slightly different, but look for `http://...`)
    * *You should NOT see a warning about the GEMINI_API_KEY being missing if you ran the `export` command correctly in this window.*
5.  This means the application is running on your Mac! It hasn't opened anything automatically, though.
6.  Open your **web browser** (Safari, Chrome, etc.).
7.  In the address bar at the top, type the address shown in the Terminal (usually `http://127.0.0.1:5000` or `http://localhost:5000`).
8.  Press **Return**.

You should now see the StudyLM home page in your browser!

**Important:** The StudyLM application only runs as long as the Terminal window where you typed `python3 app.py` is **open** and running the command.

**How to Stop the Application:**

* Go back to the Terminal window that is running the app (it will have text output from the program).
* Press and hold the `Control` key on your keyboard, and then press the `C` key (`Control + C`).
* You might have to press it once or twice. The program should stop, and you'll see your normal Terminal prompt again.
* The StudyLM website in your browser will no longer work until you run `python3 app.py` again (remembering to `export` the API key first if it's a new Terminal window).

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
    * You can choose different AI models ("Basic" is fastest, "Pro" is more intelligent but slower, and "Reasoning" is slowest but might be better for complex questions).
    * Click "New Chat" to clear the conversation and start fresh.
5.  **Quiz Mode:** Click the "Quiz Mode" button at the top.
    * Select the number of questions you want.
    * Click "Generate Quiz". This uses the AI to create a longer quiz covering all your uploaded materials. It might take a minute.
    * Answer the questions and click "Check Answers" at the bottom when you're done to see your score.
    * You can use the "New Chat" button along with the question quantity dropdown menu to re-generate practice exams.

---

## Important Notes & Simple Troubleshooting

* **API Key Required:** The app needs the `GEMINI_API_KEY` set via the `export` command before running `python3 app.py`. If you forget, the AI features won't work, and you might see errors in the Terminal. Remember to set it in *every new* Terminal session you use to run the app.
* **Internet Needed:** StudyLM needs an active internet connection for the AI parts (generating the guide, quizzes, and chat) to work.
* **File Size:** There's a 50MB limit per file upload. Very large or complex files might take longer to process or cause errors.
* **`uploads` folder:** When you upload files, they are temporarily saved in a folder named `uploads` inside your StudyLM code folder.
* **`output.json` / `file_uris.json`:** These files are created inside the StudyLM folder to store the generated guide data and file references. You don't normally need to touch them. If you upload new files, `output.json` will be overwritten.
* **Something Went Wrong?**
    * Did you remember to `export` your API key in the Terminal window *before* running `python3 app.py`? Stop the app (`Control + C`), run the `export` command again, then run `python3 app.py` again.
    * Try stopping the application (`Control + C` in the Terminal) and running it again (`python3 app.py`, after exporting the key).
    * Refresh the page in your web browser (`Command + R`).
    * Look at the Terminal window for any messages, especially red text indicating an error. That might give a clue about the problem.
    * Ensure your internet connection is working.

---

That's it! We hope StudyLM helps you with your studies. If you have suggestions, please let the project owner know.