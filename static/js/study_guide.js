document.addEventListener('DOMContentLoaded', function() {
    // Track quiz answer selections
    const quizSelections = {};
    
    // Handle section quiz radio button selection
    const sectionQuizOptions = document.querySelectorAll('.section-quiz-option');
    sectionQuizOptions.forEach(option => {
        option.addEventListener('change', function() {
            const quizGroup = this.dataset.quizGroup;
            
            if (!quizSelections[quizGroup]) {
                quizSelections[quizGroup] = {};
            }
            
            // Store the selected answer for this question
            const questionName = this.getAttribute('name');
            quizSelections[quizGroup][questionName] = {
                selected: this.value,
                correct: this.dataset.correct
            };
            
            // Highlight the selected answer
            const formCheck = this.closest('.form-check');
            const cardBody = formCheck.closest('.card-body');
            
            // Remove any previous selection highlight in this question
            cardBody.querySelectorAll('.form-check').forEach(fc => {
                fc.classList.remove('selected-answer');
            });
            
            // Add highlight to the selected answer
            formCheck.classList.add('selected-answer');
            
            // Enable the submit button if at least one answer is selected
            const submitButton = document.getElementById(`submit-${quizGroup}`);
            if (submitButton && Object.keys(quizSelections[quizGroup]).length > 0) {
                submitButton.disabled = false;
            }
        });
    });
    
    // Handle unit quiz radio button selection
    const unitQuizOptions = document.querySelectorAll('.unit-quiz-option');
    unitQuizOptions.forEach(option => {
        option.addEventListener('change', function() {
            const quizGroup = this.dataset.quizGroup;
            
            if (!quizSelections[quizGroup]) {
                quizSelections[quizGroup] = {};
            }
            
            // Store the selected answer for this question
            const questionName = this.getAttribute('name');
            quizSelections[quizGroup][questionName] = {
                selected: this.value,
                correct: this.dataset.correct
            };
            
            // Highlight the selected answer
            const formCheck = this.closest('.form-check');
            const cardBody = formCheck.closest('.card-body');
            
            // Remove any previous selection highlight in this question
            cardBody.querySelectorAll('.form-check').forEach(fc => {
                fc.classList.remove('selected-answer');
            });
            
            // Add highlight to the selected answer
            formCheck.classList.add('selected-answer');
            
            // Enable the submit button if at least one answer is selected
            const submitButton = document.getElementById(`submit-${quizGroup}`);
            if (submitButton && Object.keys(quizSelections[quizGroup]).length > 0) {
                submitButton.disabled = false;
            }
        });
    });
    
    // Handle section quiz submissions
    document.querySelectorAll('[id^="submit-section-quiz-"]').forEach(button => {
        button.addEventListener('click', function() {
            const quizGroup = this.id.replace('submit-', '');
            evaluateQuiz(quizGroup);
        });
    });
    
    // Handle unit quiz submissions
    document.querySelectorAll('[id^="submit-unit-quiz-"]').forEach(button => {
        button.addEventListener('click', function() {
            const quizGroup = this.id.replace('submit-', '');
            evaluateQuiz(quizGroup);
        });
    });
    
    // Function to evaluate and show quiz results
    function evaluateQuiz(quizGroup) {
        if (!quizSelections[quizGroup]) return;
        
        let correctCount = 0;
        let totalQuestions = 0;
        
        // Process each answer in the quiz group
        for (const questionName in quizSelections[quizGroup]) {
            const question = quizSelections[quizGroup][questionName];
            totalQuestions++;
            
            // Find the question element
            const radioInput = document.querySelector(`input[name="${questionName}"][value="${question.selected}"]`);
            if (!radioInput) continue;
            
            const cardBody = radioInput.closest('.card-body');
            const feedbackDiv = cardBody.querySelector('.answer-feedback');
            const correctFeedback = feedbackDiv.querySelector('.correct-answer');
            const wrongFeedback = feedbackDiv.querySelector('.wrong-answer');
            
            // Show the feedback div
            feedbackDiv.classList.remove('d-none');
            
            if (question.selected === question.correct) {
                // Show correct feedback
                correctFeedback.classList.remove('d-none');
                wrongFeedback.classList.add('d-none');
                
                // Clear existing classes and highlight only the correct answer
                cardBody.querySelectorAll('.form-check').forEach(fc => {
                    fc.classList.remove('correct-answer', 'wrong-answer');
                });
                
                // Highlight the correct answer in green
                radioInput.closest('.form-check').classList.add('correct-answer');
                
                correctCount++;
                
                // Play a success sound
                playSound('success');
            } else {
                // Show wrong feedback
                correctFeedback.classList.add('d-none');
                wrongFeedback.classList.remove('d-none');
                
                // Clear existing classes
                cardBody.querySelectorAll('.form-check').forEach(fc => {
                    fc.classList.remove('correct-answer', 'wrong-answer');
                });
                
                // Highlight the wrong answer in red
                radioInput.closest('.form-check').classList.add('wrong-answer');
                
                // Find and highlight the correct answer option ONLY
                const correctOption = cardBody.querySelector(`input[value="${question.correct}"]`);
                if (correctOption) {
                    correctOption.closest('.form-check').classList.add('correct-answer');
                }
                
                // Play an error sound
                playSound('error');
            }
            
            // Disable all options in this question
            const relatedOptions = document.querySelectorAll(`input[name="${questionName}"]`);
            relatedOptions.forEach(opt => {
                opt.disabled = true;
            });
        }
        
        // Add score summary at the bottom near the submit button
        const buttonContainer = document.getElementById(`submit-${quizGroup}`).parentNode;
        const scoreContainer = buttonContainer.querySelector('.quiz-score-container');
        
        if (scoreContainer) {
            // Disable submit button
            document.getElementById(`submit-${quizGroup}`).disabled = true;
            
            // Add score to the score container
            scoreContainer.innerHTML = '';
            const scoreElement = document.createElement('div');
            scoreElement.className = 'alert alert-info mt-3';
            const percentage = Math.round(correctCount/totalQuestions*100);
            let feedbackClass = 'alert-info';
            let feedbackIcon = 'info-circle-fill';
            
            if (percentage >= 80) {
                feedbackClass = 'alert-success';
                feedbackIcon = 'trophy-fill';
            } else if (percentage < 60) {
                feedbackClass = 'alert-warning';
                feedbackIcon = 'exclamation-triangle-fill';
            }
            
            scoreElement.className = `alert ${feedbackClass}`;
            scoreElement.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bi bi-${feedbackIcon} fs-4 me-3"></i>
                    <div>
                        <h5 class="mb-1">Quiz Results</h5>
                        <p class="mb-0">Your score: <strong>${correctCount}/${totalQuestions}</strong> (${percentage}%)</p>
                    </div>
                </div>
            `;
            scoreContainer.appendChild(scoreElement);
        }
    }
    
    // Make entire answer choice container clickable
    const quizLabels = document.querySelectorAll('.form-check-label');
    quizLabels.forEach(label => {
        label.addEventListener('click', function() {
            // Find the associated radio button and check it
            const radioButton = this.closest('.form-check').querySelector('.form-check-input');
            if (!radioButton.disabled) {
                radioButton.checked = true;
                // Trigger the change event on the radio button
                const event = new Event('change', { bubbles: true });
                radioButton.dispatchEvent(event);
            }
        });
    });
    
    // Make the entire form-check div clickable
    document.querySelectorAll('.form-check').forEach(check => {
        check.addEventListener('click', function(e) {
            // Only proceed if we didn't click on the radio button itself (it handles its own events)
            if (!e.target.classList.contains('form-check-input')) {
                const radioButton = this.querySelector('.form-check-input');
                if (radioButton && !radioButton.disabled) {
                    radioButton.checked = true;
                    // Trigger the change event on the radio button
                    const event = new Event('change', { bubbles: true });
                    radioButton.dispatchEvent(event);
                }
            }
        });
    });
    
    // Function to play sounds
    function playSound(type) {
        // Only play sounds if user preference is set
        if (localStorage.getItem('enableSounds') !== 'false') {
            const audio = new Audio();
            if (type === 'success') {
                audio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3';
            } else {
                audio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-interface-click-1126.mp3';
            }
            audio.volume = 0.2;
            audio.play();
        }
    }
    
    // Add styles for quiz elements
    const quizStyle = document.createElement('style');
    quizStyle.innerHTML = `
        .selected-answer {
            background-color: rgba(13, 110, 253, 0.15);
            border-left: 3px solid var(--primary);
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
            transform: translateX(5px);
        }
        
        .form-check {
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            border-radius: 6px;
            padding: 12px 15px;
            margin-bottom: 8px;
        }
        
        .form-check:hover {
            background-color: rgba(0, 123, 255, 0.08);
            transform: translateX(3px);
        }
        
        .form-check-input {
            cursor: pointer;
        }
        
        .form-check-label {
            cursor: pointer;
            display: block;
            width: 100%;
            padding-left: 8px;
        }
        
        .correct-answer {
            background-color: rgba(25, 135, 84, 0.12);
            border-left: 4px solid var(--success);
        }
        
        .wrong-answer {
            background-color: rgba(220, 53, 69, 0.12);
            border-left: 4px solid var(--danger);
        }
        
        .quiz-container {
            border-radius: 10px;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
            margin-bottom: 2rem;
            padding: 1.5rem;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
        }
        
        .quiz-card {
            margin-bottom: 1.5rem;
        }
    `;
    document.head.appendChild(quizStyle);
    
    // Handle smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Smooth scroll to the element
                targetElement.scrollIntoView({ behavior: 'smooth' });
                
                // Highlight the element briefly
                setTimeout(() => {
                    targetElement.classList.add('highlight-section');
                    setTimeout(() => {
                        targetElement.classList.remove('highlight-section');
                    }, 2000);
                }, 500);
            }
        });
    });
    
    // Make section headers sticky on scroll for better navigation
    const sectionHeaders = document.querySelectorAll('.section-title');
    
    sectionHeaders.forEach(header => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    // When the header comes into view
                    header.classList.remove('sticky-header');
                } else {
                    // When the header scrolls out of view
                    const rect = header.getBoundingClientRect();
                    if (rect.top < 0) {
                        header.classList.add('sticky-header');
                    }
                }
            },
            { threshold: 1.0 }
        );
        
        observer.observe(header);
    });
    
    // Add styles for section highlight and sticky headers
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
        .highlight-section {
            animation: highlight 2s ease;
        }
        
        @keyframes highlight {
            0%, 100% { background-color: transparent; }
            50% { background-color: var(--highlight); }
        }
        
        .sticky-header {
            position: sticky;
            top: 60px;
            z-index: 100;
            background-color: var(--white);
            padding: 10px;
            margin: -10px;
            box-shadow: var(--shadow-md);
            border-radius: var(--radius-md);
        }
        
        /* Quiz styles */
        .correct-answer {
            background-color: rgba(25, 135, 84, 0.1);
            border-left: 3px solid var(--success);
            padding-left: 10px;
        }
        
        .wrong-answer {
            background-color: rgba(220, 53, 69, 0.1);
            border-left: 3px solid var(--danger);
            padding-left: 10px;
        }
    `;
    document.head.appendChild(styleElement);
    
    // Initialize reading time estimates
    updateReadingTimeEstimates();
    
    function updateReadingTimeEstimates() {
        // Average reading speed (words per minute)
        const wordsPerMinute = 200;
        
        // Get all narrative sections
        const narratives = document.querySelectorAll('.narrative');
        
        narratives.forEach(narrative => {
            // Count words in the narrative
            const text = narrative.textContent;
            const wordCount = text.trim().split(/\s+/).length;
            
            // Calculate reading time in minutes
            const readingTime = Math.ceil(wordCount / wordsPerMinute);
            
            // Create reading time badge
            const badge = document.createElement('span');
            badge.className = 'badge bg-light text-dark ms-2';
            badge.innerHTML = `<i class="bi bi-clock"></i> ${readingTime} min read`;
            
            // Find the section title to append to
            const sectionTitle = narrative.closest('.section').querySelector('.section-title');
            sectionTitle.appendChild(badge);
        });
    }
    
    // Add settings menu
    addSettingsMenu();
    
    function addSettingsMenu() {
        // Create settings button
        const settingsButton = document.createElement('button');
        settingsButton.className = 'btn btn-floating settings-button';
        settingsButton.innerHTML = '<i class="bi bi-gear"></i>';
        settingsButton.style.left = '30px';
        document.body.appendChild(settingsButton);
        
        // Create settings menu
        const settingsMenu = document.createElement('div');
        settingsMenu.className = 'settings-menu card shadow-lg';
        settingsMenu.innerHTML = `
            <div class="card-header bg-primary text-white">
                <h5 class="mb-0">Study Settings</h5>
            </div>
            <div class="card-body">
                <div class="mb-3">
                    <label class="form-label">Font Size</label>
                    <div class="btn-group w-100" role="group">
                        <button type="button" class="btn btn-outline-secondary font-size-btn" data-size="small">Small</button>
                        <button type="button" class="btn btn-outline-secondary font-size-btn active" data-size="medium">Medium</button>
                        <button type="button" class="btn btn-outline-secondary font-size-btn" data-size="large">Large</button>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="darkModeSwitch">
                        <label class="form-check-label" for="darkModeSwitch">Dark Mode</label>
                    </div>
                </div>
                <div class="mb-3">
                    <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" id="soundsSwitch" checked>
                        <label class="form-check-label" for="soundsSwitch">Sound Effects</label>
                    </div>
                </div>
            </div>
        `;
        settingsMenu.style.display = 'none';
        document.body.appendChild(settingsMenu);
        
        // Add styles for settings menu
        const styleElement = document.createElement('style');
        styleElement.innerHTML = `
            .settings-button {
                position: fixed;
                bottom: 30px;
                left: 30px;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                text-align: center;
                line-height: 50px;
                z-index: 99;
                background-color: var(--secondary);
                color: white;
                box-shadow: var(--shadow-lg);
            }
            
            .settings-menu {
                position: fixed;
                bottom: 90px;
                left: 30px;
                width: 280px;
                z-index: 100;
                transition: transform 0.3s ease, opacity 0.3s ease;
            }
            
            .settings-menu.show {
                display: block !important;
                animation: fadeInUp 0.3s ease;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            body.dark-mode {
                background-color: #1a1a1a;
                color: #f8f9fa;
            }
            
            body.dark-mode .card {
                background-color: #2d2d2d;
                color: #f8f9fa;
            }
            
            body.dark-mode .list-group-item {
                background-color: #3a3a3a;
                color: #f8f9fa;
                border-color: #444;
            }
            
            body.font-size-small {
                font-size: 0.9rem;
            }
            
            body.font-size-large {
                font-size: 1.1rem;
            }
        `;
        document.head.appendChild(styleElement);
        
        // Toggle settings menu
        settingsButton.addEventListener('click', function() {
            settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'block' : 'none';
            if (settingsMenu.style.display === 'block') {
                settingsMenu.classList.add('show');
            } else {
                settingsMenu.classList.remove('show');
            }
        });
        
        // Close settings when clicking outside
        document.addEventListener('click', function(event) {
            if (!settingsMenu.contains(event.target) && event.target !== settingsButton) {
                settingsMenu.style.display = 'none';
                settingsMenu.classList.remove('show');
            }
        });
        
        // Handle font size buttons
        const fontSizeButtons = document.querySelectorAll('.font-size-btn');
        fontSizeButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove active class from all buttons
                fontSizeButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get selected size
                const size = this.dataset.size;
                
                // Remove existing font size classes
                document.body.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
                
                // Add new font size class if not medium (default)
                if (size !== 'medium') {
                    document.body.classList.add(`font-size-${size}`);
                }
                
                // Save preference
                localStorage.setItem('fontSize', size);
            });
        });
        
        // Handle dark mode toggle
        const darkModeSwitch = document.getElementById('darkModeSwitch');
        darkModeSwitch.checked = localStorage.getItem('darkMode') === 'true';
        if (darkModeSwitch.checked) {
            document.body.classList.add('dark-mode');
        }
        
        darkModeSwitch.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
            }
        });
        
        // Handle sounds toggle
        const soundsSwitch = document.getElementById('soundsSwitch');
        soundsSwitch.checked = localStorage.getItem('enableSounds') !== 'false';
        
        soundsSwitch.addEventListener('change', function() {
            localStorage.setItem('enableSounds', this.checked);
        });
        
        // Apply saved preferences
        const savedFontSize = localStorage.getItem('fontSize');
        if (savedFontSize) {
            // Find and click the corresponding button
            const button = document.querySelector(`.font-size-btn[data-size="${savedFontSize}"]`);
            if (button) {
                button.click();
            }
        }
    }
});