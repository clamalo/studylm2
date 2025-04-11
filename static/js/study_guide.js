document.addEventListener('DOMContentLoaded', function() {
    // Track quiz answer selections
    const quizSelections = {};
    
    // Add the shared QuizUI styles
    QuizUI.addStyles();
    
    // Process markdown content
    renderMarkdownContent();

    // Function to render markdown content
    function renderMarkdownContent() {
        // Configure marked options
        marked.setOptions({
            breaks: true,          // Add <br> on a single line break
            gfm: true,             // GitHub Flavored Markdown
            headerIds: false,      // Don't add IDs to headers
            mangle: false,         // Don't escape HTML
            sanitize: false        // Don't sanitize HTML
        });
        
        // Find all elements with md-content class and render their content as markdown
        document.querySelectorAll('.md-content').forEach(element => {
            const markdownText = element.textContent;
            element.innerHTML = marked.parse(markdownText);
        });
    }
    
    // Handle section quiz radio button selection
    const sectionQuizOptions = document.querySelectorAll('.section-quiz-option');
    QuizUI.attachQuizHandlers(sectionQuizOptions, quizSelections);
    
    // Handle unit quiz radio button selection
    const unitQuizOptions = document.querySelectorAll('.unit-quiz-option');
    QuizUI.attachQuizHandlers(unitQuizOptions, quizSelections);
    
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
    
    // Function to evaluate and show quiz results using shared module
    function evaluateQuiz(quizGroup) {
        if (!quizSelections[quizGroup]) return;
        
        // Find the score container for this quiz group
        const buttonContainer = document.getElementById(`submit-${quizGroup}`).parentNode;
        const scoreContainer = buttonContainer.querySelector('.quiz-score-container');
        const submitButton = document.getElementById(`submit-${quizGroup}`);
        
        // Use the shared QuizUI module to evaluate the quiz
        QuizUI.evaluateQuizUI(quizSelections, null, scoreContainer, submitButton, quizGroup);
    }
    
    // Initialize reading time estimates and other features
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
            if (sectionTitle) {
                sectionTitle.appendChild(badge);
            }
        });
    }
    
    // Add settings menu and other existing functionality
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