document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const generateQuizBtn = document.getElementById('generate-quiz-btn');
    const generateNewQuizBtn = document.getElementById('generate-new-quiz-btn');
    const submitQuizBtn = document.getElementById('submit-quiz-btn');
    const cancelQuizBtn = document.getElementById('cancel-quiz-btn');
    const quizContainer = document.getElementById('quiz-container');
    const quizContent = document.getElementById('quiz-content');
    const quizInitialState = document.getElementById('quiz-initial-state');
    const quizLoadingState = document.getElementById('quiz-loading-state');
    const quizFooter = document.getElementById('quiz-footer');
    const quizControls = document.getElementById('quiz-controls');
    const quizStatusContainer = document.getElementById('quiz-status-container');
    const printQuizBtn = document.getElementById('print-quiz');
    const questionCountSelect = document.getElementById('question-count');
    const headerQuestionCountSelect = document.getElementById('header-question-count');
    const quizScoreContainer = document.querySelector('.quiz-score-container');
    
    // Quiz state
    let quizData = null;
    let quizSelections = {};
    let quizGenerationId = null;
    let quizGenerationStatus = 'idle'; // 'idle', 'generating', 'complete'
    let totalQuestions = 0; // Track total questions for validation
    let quizSubmitted = false; // Track if quiz has been submitted
    
    // Add the shared QuizUI styles
    QuizUI.addStyles();
    
    // Check for existing quiz in localStorage when page loads
    checkExistingQuiz();
    
    // Check status of quiz generation if there's an ongoing process
    checkQuizGenerationStatus();
    
    // Event listeners
    if (generateQuizBtn) {
        generateQuizBtn.addEventListener('click', startQuizGeneration);
    }
    
    if (generateNewQuizBtn) {
        generateNewQuizBtn.addEventListener('click', confirmNewQuiz);
    }
    
    if (submitQuizBtn) {
        submitQuizBtn.addEventListener('click', evaluateQuiz);
    }
    
    if (printQuizBtn) {
        printQuizBtn.addEventListener('click', printQuiz);
    }
    
    // Add event listener for cancel button
    if (cancelQuizBtn) {
        cancelQuizBtn.addEventListener('click', handleCancelQuizGeneration);
    }

    // Use event delegation to handle quiz option changes
    // This ensures ALL quiz options are captured, even if they're added after initial page load
    if (quizContent) {
        quizContent.addEventListener('change', function(e) {
            // Check if the changed element is a quiz option
            if (e.target && e.target.classList.contains('quiz-option')) {
                // Important: We need to ensure quizSelections gets properly updated
                const questionIndex = parseInt(e.target.dataset.questionIndex);
                const choiceIndex = parseInt(e.target.dataset.choiceIndex);
                const selectedChoiceText = e.target.closest('.card-body').querySelector(`label[for="${e.target.id}"]`).textContent.trim();
                const correctAnswerText = e.target.dataset.correct;
                const correctIndex = e.target.dataset.correctIndex !== undefined ? 
                    parseInt(e.target.dataset.correctIndex) : null;
                
                // Update quizSelections with the new selection
                quizSelections[questionIndex] = {
                    selectedIndex: choiceIndex,
                    correctIndex: correctIndex,
                    selected: selectedChoiceText,
                    correct: correctAnswerText
                };
                
                // Save the updated quizSelections to localStorage
                localStorage.setItem('quizSelections', JSON.stringify(quizSelections));
                console.log('Updated and saved quiz selections:', Object.keys(quizSelections).length, 'selections');
                
                // Update button state
                updateAnswerCount();
            }
        });
    }
    
    // Sync the question count dropdowns
    if (questionCountSelect && headerQuestionCountSelect) {
        // Sync initial value
        headerQuestionCountSelect.value = questionCountSelect.value;
        
        // Add event listeners to keep them in sync
        questionCountSelect.addEventListener('change', function() {
            headerQuestionCountSelect.value = this.value;
        });
        
        headerQuestionCountSelect.addEventListener('change', function() {
            questionCountSelect.value = this.value;
            localStorage.setItem('questionCount', this.value);
        });
    }

    // Function to handle quiz cancellation
    function handleCancelQuizGeneration() {
        if (quizGenerationStatus === 'generating' && quizGenerationId) {
            // Disable the button and update text to prevent multiple clicks
            if (cancelQuizBtn) {
                cancelQuizBtn.disabled = true;
                cancelQuizBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Canceling...';
            }
            
            // Send cancellation request to the backend
            fetch(`/cancel-quiz/${quizGenerationId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                // Always reset the quiz state on any response - even if backend says "not found"
                // This will handle cases where the quiz was already completed or not found
                console.log('Quiz cancellation response:', data.message || 'No message provided');
                resetQuizState();
            })
            .catch(error => {
                console.error('Error canceling quiz generation:', error);
                
                // Just reset the quiz state instead of showing an error
                resetQuizState();
            });
        } else {
            console.warn('Attempted to cancel quiz but no active generation found or invalid state');
            // Reset state anyway to fix potential inconsistencies
            resetQuizState();
        }
    }
    
    // Helper function to reset quiz state
    function resetQuizState() {
        quizGenerationStatus = 'idle';
        quizGenerationId = null;
        quizSubmitted = false;
        localStorage.removeItem('quizGenerationStatus');
        localStorage.removeItem('quizGenerationId');
        localStorage.removeItem('quizSubmitted');
        showQuizInitialState();
        
        // Reset cancel button if it exists
        if (cancelQuizBtn) {
            cancelQuizBtn.disabled = false;
            cancelQuizBtn.innerHTML = '<i class="bi bi-x-circle"></i> Cancel Generation';
        }
    }
    
    // Enhanced error handling
    function showError(message) {
        // Reset state when showing errors to ensure consistent UI
        resetQuizState();
        
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger mt-3';
        errorAlert.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill me-2"></i> ${message}
        `;
        
        quizContainer.appendChild(errorAlert);
        
        // Remove error after 5 seconds
        setTimeout(() => {
            errorAlert.remove();
        }, 5000);
    }
    
    // Load quiz data from localStorage if available
    function checkExistingQuiz() {
        const savedQuiz = localStorage.getItem('studyLmQuiz');
        const savedStatus = localStorage.getItem('quizGenerationStatus');
        quizGenerationId = localStorage.getItem('quizGenerationId');
        quizSubmitted = localStorage.getItem('quizSubmitted') === 'true';
        
        if (savedStatus === 'generating' && quizGenerationId) {
            showQuizLoadingState();
            quizGenerationStatus = 'generating';
            // Start checking for quiz completion
            checkQuizGenerationStatus();
        } else if (savedQuiz) {
            try {
                quizData = JSON.parse(savedQuiz);
                showQuizContent();
                renderQuiz(quizData);
                quizGenerationStatus = 'complete';
                
                // If quiz was previously submitted, re-evaluate it to show results
                if (quizSubmitted) {
                    console.log('Restoring submitted quiz state');
                    restoreSubmittedQuizState();
                }
            } catch (e) {
                // If the saved quiz is invalid, clear it and show initial state
                localStorage.removeItem('studyLmQuiz');
                localStorage.removeItem('quizSubmitted');
                showQuizInitialState();
            }
        } else {
            showQuizInitialState();
        }
    }
    
    // Function to restore submitted quiz state
    function restoreSubmittedQuizState() {
        if (!quizData || !quizSelections) return;
        
        // We need to wait a moment for the quiz UI to fully render
        setTimeout(() => {
            // Get the saved quiz result if it exists
            const savedResult = localStorage.getItem('quizResult');
            if (savedResult) {
                try {
                    const resultData = JSON.parse(savedResult);
                    // Display the result in the score container
                    if (quizScoreContainer) {
                        const scoreElement = document.createElement('div');
                        scoreElement.className = `alert ${resultData.alertClass}`;
                        scoreElement.innerHTML = resultData.html;
                        quizScoreContainer.innerHTML = '';
                        quizScoreContainer.appendChild(scoreElement);
                    }
                } catch (e) {
                    console.error('Error restoring quiz result:', e);
                }
            }
            
            // Disable all question inputs and show correct/wrong feedback
            for (const questionIndex in quizSelections) {
                const answer = quizSelections[questionIndex];
                const qIndex = parseInt(questionIndex);
                
                // Find the question card
                const questionCard = document.querySelector(`.question-card[data-question-index="${qIndex}"]`);
                if (!questionCard) continue;
                
                // Find the selected radio input
                const selectedInput = document.querySelector(`input[name="quiz-question-${qIndex}"][value="${answer.selectedIndex}"]`);
                if (!selectedInput) continue;
                
                const formCheck = selectedInput.closest('.form-check');
                const cardBody = selectedInput.closest('.card-body');
                const feedbackDiv = cardBody.querySelector('.answer-feedback');
                const correctFeedback = feedbackDiv.querySelector('.correct-answer');
                const wrongFeedback = feedbackDiv.querySelector('.wrong-answer');
                
                // Show feedback
                feedbackDiv.classList.remove('d-none');
                
                if (answer.selectedIndex === answer.correctIndex) {
                    // Correct answer
                    correctFeedback.classList.remove('d-none');
                    wrongFeedback.classList.add('d-none');
                    formCheck.classList.add('correct-answer');
                } else {
                    // Wrong answer
                    correctFeedback.classList.add('d-none');
                    wrongFeedback.classList.remove('d-none');
                    formCheck.classList.add('wrong-answer');
                    
                    // Find and highlight the correct answer
                    const correctInput = document.querySelector(`input[name="quiz-question-${qIndex}"][value="${answer.correctIndex}"]`);
                    if (correctInput) {
                        const correctFormCheck = correctInput.closest('.form-check');
                        correctFormCheck.classList.add('correct-answer');
                    }
                }
                
                // Disable all options for this question
                const relatedOptions = document.querySelectorAll(`input[name="quiz-question-${qIndex}"]`);
                relatedOptions.forEach(opt => {
                    opt.disabled = true;
                });
            }
            
            // Update submit button
            if (submitQuizBtn) {
                submitQuizBtn.disabled = true;
                submitQuizBtn.innerHTML = '<i class="bi bi-check2-all"></i> Review Answers';
            }
            
            // Update the new quiz button
            if (generateNewQuizBtn) {
                generateNewQuizBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Try Another Quiz';
            }
            
        }, 100);
    }
    
    // Function to start quiz generation
    function startQuizGeneration() {
        // Clear any existing quiz
        quizData = null;
        quizSelections = {};
        quizSubmitted = false;
        localStorage.removeItem('studyLmQuiz');
        localStorage.removeItem('quizSelections');
        localStorage.removeItem('quizSubmitted');
        localStorage.removeItem('quizResult');
        
        // Show loading state
        showQuizLoadingState();
        
        // Get selected question count - prioritize the visible dropdown
        let questionCount;
        if (quizInitialState.classList.contains('d-none') && headerQuestionCountSelect) {
            questionCount = parseInt(headerQuestionCountSelect.value) || 10;
        } else {
            questionCount = parseInt(questionCountSelect.value) || 10;
        }
        
        // Call API to generate quiz
        fetch('/generate-quiz', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question_count: questionCount
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'generating') {
                // Store the generation ID for checking status later
                quizGenerationId = data.generation_id;
                quizGenerationStatus = 'generating';
                localStorage.setItem('quizGenerationId', quizGenerationId);
                localStorage.setItem('quizGenerationStatus', 'generating');
                localStorage.setItem('questionCount', questionCount);
                
                // Start checking for quiz completion
                checkQuizGenerationStatus();
            } else if (data.error) {
                showError(data.error);
            }
        })
        .catch(error => {
            console.error('Error starting quiz generation:', error);
            showError('Failed to start quiz generation. Please try again.');
        });
    }
    
    // Function to check quiz generation status
    function checkQuizGenerationStatus() {
        if (quizGenerationStatus !== 'generating' || !quizGenerationId) {
            return;
        }
        
        fetch(`/quiz-status/${quizGenerationId}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'complete' && data.quiz) {
                    // Quiz generation completed
                    quizData = data.quiz;
                    quizGenerationStatus = 'complete';
                    
                    // Save quiz to localStorage
                    localStorage.setItem('studyLmQuiz', JSON.stringify(quizData));
                    localStorage.removeItem('quizGenerationStatus');
                    localStorage.removeItem('quizGenerationId');
                    
                    // Render the quiz
                    showQuizContent();
                    renderQuiz(quizData);
                } else if (data.status === 'error') {
                    // Quiz generation failed
                    showError(data.message || 'Failed to generate quiz');
                    quizGenerationStatus = 'idle';
                    localStorage.removeItem('quizGenerationStatus');
                    localStorage.removeItem('quizGenerationId');
                } else if (data.status === 'canceled') {
                    // Quiz generation was canceled
                    console.log('Quiz generation was canceled');
                    resetQuizState();
                } else if (data.status === 'generating') {
                    // Quiz is still being generated, check again in a few seconds
                    setTimeout(checkQuizGenerationStatus, 3000);
                }
            })
            .catch(error => {
                console.error('Error checking quiz status:', error);
                // Try again in 5 seconds if there was an error
                setTimeout(checkQuizGenerationStatus, 5000);
            });
    }
    
    // Function to render the quiz UI - using shared module
    function renderQuiz(quizData) {
        // Use the shared QuizUI module to render the quiz
        totalQuestions = QuizUI.renderQuizUI(quizData, quizContent, quizSelections, updateAnswerCount);
        console.log(`Quiz loaded with ${totalQuestions} questions`);
        
        // Show quiz elements
        showElement(printQuizBtn.parentElement);
        showElement(quizControls);
        showElement(quizFooter); // Show footer which contains the button

        // Initialize submit button state and text
        if (submitQuizBtn) {
            submitQuizBtn.innerHTML = `<i class="bi bi-check-circle"></i> Check Answers (0/${totalQuestions})`;
            submitQuizBtn.disabled = true;
            console.log(`Submit button initialized: disabled, 0/${totalQuestions} answers`);
        }

        // Set the header question count dropdown to match the current quiz
        if (headerQuestionCountSelect) {
            const savedQuestionCount = localStorage.getItem('questionCount');
            if (savedQuestionCount) {
                headerQuestionCountSelect.value = savedQuestionCount;
            }
        }

        // Restore any saved answers
        const savedSelections = localStorage.getItem('quizSelections');
        if (savedSelections) {
            try {
                const savedData = JSON.parse(savedSelections);
                // Only restore if it seems to be for the same quiz
                if (Object.keys(savedData).length <= totalQuestions) {
                    quizSelections = savedData;

                    // Re-apply selections to the UI
                    for (const questionIndex in quizSelections) {
                        const answer = quizSelections[questionIndex];
                        const radioInput = document.querySelector(`input[name="quiz-question-${questionIndex}"][value="${answer.selectedIndex}"]`);
                        if (radioInput) {
                            radioInput.checked = true;
                            const formCheck = radioInput.closest('.form-check');
                            if (formCheck) {
                                formCheck.classList.add('selected-answer');
                            }
                        }
                    }

                    // Update the button state after restoring selections
                    updateAnswerCount();
                } else {
                     // If saved selections don't match, clear them
                     localStorage.removeItem('quizSelections');
                     quizSelections = {};
                     updateAnswerCount(); // Update button based on empty selections
                }
            } catch (e) {
                console.error('Error restoring saved quiz selections:', e);
                localStorage.removeItem('quizSelections'); // Clear invalid data
                quizSelections = {};
                updateAnswerCount(); // Update button based on empty selections
            }
        } else {
             // Ensure button state is correct even if no selections were saved
             updateAnswerCount();
        }
        
        // Note: we're no longer adding individual change listeners here 
        // because we're using event delegation in the main event listener
    }

    // Function to update answer count and button state
    function updateAnswerCount() {
        // Ensure totalQuestions is valid before proceeding
        if (typeof totalQuestions !== 'number' || totalQuestions <= 0) {
             console.warn('updateAnswerCount called with invalid totalQuestions:', totalQuestions);
             if (submitQuizBtn) {
                 submitQuizBtn.innerHTML = `<i class="bi bi-check-circle"></i> Check Answers`;
                 submitQuizBtn.disabled = true;
             }
             return;
        }

        if (submitQuizBtn) {
            const answeredQuestions = Object.keys(quizSelections).length;

            console.log(`Updating button: ${answeredQuestions}/${totalQuestions} questions answered`);

            // Update button text to show progress
            submitQuizBtn.innerHTML = `<i class="bi bi-check-circle"></i> Check Answers (${answeredQuestions}/${totalQuestions})`;

            // Enable button if all questions are answered
            if (answeredQuestions >= totalQuestions) {
                submitQuizBtn.disabled = false;
                console.log('All questions answered, enabling submit button');
            } else {
                submitQuizBtn.disabled = true;
                console.log(`Need ${totalQuestions - answeredQuestions} more answers`);
            }
        } else {
             console.warn('updateAnswerCount called but submitQuizBtn is not found.');
        }
    }

    // Function to evaluate quiz answers - using shared module
    function evaluateQuiz() {
        // Store answer states to localStorage
        localStorage.setItem('quizSelections', JSON.stringify(quizSelections));
        
        // Mark the quiz as submitted
        quizSubmitted = true;
        localStorage.setItem('quizSubmitted', 'true');
        
        // Capture score container content after evaluation for persistent storage
        const captureResult = () => {
            if (quizScoreContainer && quizScoreContainer.querySelector('.alert')) {
                const resultElement = quizScoreContainer.querySelector('.alert');
                const resultData = {
                    html: resultElement.innerHTML,
                    alertClass: resultElement.className.replace('alert ', '')
                };
                localStorage.setItem('quizResult', JSON.stringify(resultData));
            }
        };
        
        // Use the shared QuizUI module to evaluate the quiz
        QuizUI.evaluateQuizUI(quizSelections, quizData, quizScoreContainer, submitQuizBtn);
        
        // Wait a brief moment for the UI to update before capturing the result
        setTimeout(captureResult, 500);
        
        // Change "Generate New Quiz" button text
        generateNewQuizBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Try Another Quiz';
    }
    
    // Function to confirm and generate a new quiz
    function confirmNewQuiz() {
        if (confirm('Are you sure you want to generate a new quiz? Your current quiz will be lost.')) {
            localStorage.removeItem('studyLmQuiz');
            localStorage.removeItem('quizSelections');
            localStorage.removeItem('quizSubmitted');
            localStorage.removeItem('quizResult');
            quizSubmitted = false;
            
            // Use the header question count value for the new quiz
            const newQuestionCount = headerQuestionCountSelect ? 
                parseInt(headerQuestionCountSelect.value) : 
                parseInt(questionCountSelect.value);
            
            if (newQuestionCount) {
                localStorage.setItem('questionCount', newQuestionCount);
                if (questionCountSelect) questionCountSelect.value = newQuestionCount;
            }
            
            startQuizGeneration();
        }
    }
    
    // Helper function to show the quiz initial state
    function showQuizInitialState() {
        showElement(quizInitialState);
        hideElement(quizLoadingState);
        hideElement(quizContent);
        hideElement(quizFooter);
        hideElement(quizControls);
        hideElement(quizStatusContainer);
        hideElement(printQuizBtn.parentElement);
    }
    
    // Helper function to show the quiz loading state
    function showQuizLoadingState() {
        hideElement(quizInitialState);
        showElement(quizLoadingState);
        hideElement(quizContent);
        hideElement(quizFooter);
        hideElement(quizControls);
        showElement(quizStatusContainer);
        hideElement(printQuizBtn.parentElement);
    }
    
    // Helper function to show the quiz content
    function showQuizContent() {
        hideElement(quizInitialState);
        hideElement(quizLoadingState);
        showElement(quizContent);
        showElement(quizControls);
        hideElement(quizStatusContainer);
        showElement(printQuizBtn.parentElement);

        // Only clear the score container if the quiz is not submitted
        // This ensures we don't wipe out the results when reloading a completed quiz
        if (quizScoreContainer && !quizSubmitted) {
            quizScoreContainer.innerHTML = '';
        }
    }
    
    // Helper to show/hide elements
    function showElement(element) {
        if (element) {
            if (element.id === 'quiz-footer') {
                element.style.display = 'block';
            } else {
                element.classList.remove('d-none');
            }
        }
    }
    
    function hideElement(element) {
        if (element) {
            if (element.id === 'quiz-footer') {
                element.style.display = 'none';
            } else {
                element.classList.add('d-none');
            }
        }
    }
    
    // Function to print the quiz
    function printQuiz() {
        window.print();
    }
});
