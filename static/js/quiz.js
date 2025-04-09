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
    const defaultModel = 'gemini-2.5-pro-exp-03-25'; // Default model updated
    // const defaultModel = 'gemini-2.0-flash"; // Default model updated
    
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
        localStorage.removeItem('quizGenerationStatus');
        localStorage.removeItem('quizGenerationId');
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
            } catch (e) {
                // If the saved quiz is invalid, clear it and show initial state
                localStorage.removeItem('studyLmQuiz');
                showQuizInitialState();
            }
        } else {
            showQuizInitialState();
        }
    }
    
    // Function to start quiz generation
    function startQuizGeneration() {
        // Clear any existing quiz
        quizData = null;
        quizSelections = {};
        localStorage.removeItem('studyLmQuiz');
        
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
                model: defaultModel,
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
    
    // Function to cancel quiz generation
    function cancelQuizGeneration() {
        if (quizGenerationStatus === 'generating' && quizGenerationId) {
            // Show a confirmation dialog
            if (confirm('Are you sure you want to cancel quiz generation?')) {
                // Call the cancel endpoint
                fetch(`/cancel-quiz/${quizGenerationId}`, {
                    method: 'POST'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Reset quiz state
                        quizGenerationStatus = 'idle';
                        localStorage.removeItem('quizGenerationId');
                        localStorage.removeItem('quizGenerationStatus');
                        showQuizInitialState();
                    }
                })
                .catch(error => {
                    console.error('Error canceling quiz generation:', error);
                });
            }
        }
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
    
    // Function to render the quiz UI
    function renderQuiz(quizData) {
        quizContent.innerHTML = '';
        
        if (!quizData || !quizData.questions || !quizData.questions.length) {
            showError('No quiz questions available');
            return;
        }
        
        // Set the total number of questions for validation
        totalQuestions = quizData.questions.length;
        console.log(`Quiz loaded with ${totalQuestions} questions`);
        
        // Reset quiz selections
        quizSelections = {};
        
        // Add quiz title and description
        const titleSection = document.createElement('div');
        titleSection.className = 'mb-4';
        titleSection.innerHTML = `
            <h2 class="mb-3">Comprehensive Exam Preparation</h2>
            <p class="lead">This quiz contains ${quizData.questions.length} questions covering essential concepts from your study materials.</p>
            <p class="text-muted mb-4">Select the best answer for each question. You can check your answers when finished.</p>
        `;
        quizContent.appendChild(titleSection);
        
        // Render each question
        quizData.questions.forEach((question, index) => {
            const questionNumber = index + 1;
            const questionCard = document.createElement('div');
            questionCard.className = 'card question-card mb-4';
            questionCard.dataset.questionIndex = index;
            
            // Create the HTML for the question card
            let choicesHtml = '';
            question.choices.forEach((choice, choiceIndex) => {
                choicesHtml += `
                    <div class="form-check">
                        <input class="form-check-input quiz-option" 
                            type="radio" 
                            name="quiz-question-${index}" 
                            value="${choiceIndex}"
                            data-question-index="${index}"
                            data-choice-index="${choiceIndex}"
                            id="quiz-q${index}-c${choiceIndex}">
                        <label class="form-check-label" for="quiz-q${index}-c${choiceIndex}">
                            ${choice}
                        </label>
                    </div>
                `;
            });
            
            questionCard.innerHTML = `
                <div class="card-header">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Q${questionNumber}: ${question.question}</h5>
                        <span class="badge bg-primary">${questionNumber}/${quizData.questions.length}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="choices">
                        ${choicesHtml}
                    </div>
                    <div class="answer-feedback mt-3 d-none">
                        <div class="alert alert-success correct-answer d-none">
                            <i class="bi bi-check-circle-fill me-2"></i> Correct! The answer is: <strong>${question.correct_answer}</strong>
                        </div>
                        <div class="alert alert-danger wrong-answer d-none">
                            <i class="bi bi-x-circle-fill me-2"></i> Incorrect. The correct answer is: <strong>${question.correct_answer}</strong>
                        </div>
                    </div>
                </div>
            `;
            
            quizContent.appendChild(questionCard);
            
            // Store the correct answer index for easier comparison later
            const correctIndex = question.choices.findIndex(choice => choice === question.correct_answer);
            if (correctIndex !== -1) {
                question.correctIndex = correctIndex;
            }
        });
        
        // Show quiz elements and initialize button state *before* restoring selections
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

        // Add event listeners for the options
        attachQuizOptionListeners();

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

                    // Update the button state *after* restoring selections
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
    }

    // Attach click event listeners to quiz options
    function attachQuizOptionListeners() {
        const quizOptions = document.querySelectorAll('.quiz-option');

        quizOptions.forEach(option => {
            option.addEventListener('change', function() {
                const questionIndex = parseInt(this.dataset.questionIndex);
                const choiceIndex = parseInt(this.dataset.choiceIndex);
                const formCheck = this.closest('.form-check');
                const cardBody = formCheck.closest('.card-body');

                // Remove any previous selection highlight in this question
                cardBody.querySelectorAll('.form-check').forEach(fc => {
                    fc.classList.remove('selected-answer');
                });

                // Add highlight to the selected answer
                formCheck.classList.add('selected-answer');

                // Get the text of the selected choice for display purposes
                const selectedChoiceText = quizData.questions[questionIndex].choices[choiceIndex];
                const correctAnswerText = quizData.questions[questionIndex].correct_answer;
                const correctIndex = quizData.questions[questionIndex].correctIndex != null ? quizData.questions[questionIndex].correctIndex :
                                    quizData.questions[questionIndex].choices.indexOf(correctAnswerText);

                // Store the selection using indices
                quizSelections[questionIndex] = {
                    selectedIndex: choiceIndex,
                    correctIndex: correctIndex,
                    selected: selectedChoiceText,
                    correct: correctAnswerText
                };

                console.log(`Selected answer for question ${questionIndex}: Choice #${choiceIndex}`);
                console.log(`Current selections: ${Object.keys(quizSelections).length}/${totalQuestions}`);

                // Update the button state
                updateAnswerCount();
            });
        });

        // Make entire form-check div clickable
        document.querySelectorAll('.form-check').forEach(check => {
            check.addEventListener('click', function(e) {
                // Only proceed if we didn't click on the radio button itself
                if (!e.target.classList.contains('form-check-input')) {
                    const radioButton = this.querySelector('.form-check-input');
                    if (radioButton && !radioButton.disabled) {
                        radioButton.checked = true;
                        // Trigger the change event
                        const event = new Event('change', { bubbles: true });
                        radioButton.dispatchEvent(event);
                    }
                }
            });
        });
    }

    // New function to directly update the answer count and button state
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

    // Function to evaluate quiz answers
    function evaluateQuiz() {
        let correctCount = 0;
        let animationDelay = 0;
        
        // Store answer states to localStorage
        localStorage.setItem('quizSelections', JSON.stringify(quizSelections));
        
        // Disable submit button
        submitQuizBtn.disabled = true;
        submitQuizBtn.innerHTML = '<i class="bi bi-check2-all"></i> Review Answers';
        
        // Clear any previous quiz score
        if (quizScoreContainer) {
            quizScoreContainer.innerHTML = '';
        }
        
        // Process each answer
        for (const questionIndex in quizSelections) {
            const answer = quizSelections[questionIndex];
            const qIndex = parseInt(questionIndex);
            
            // Find the question element
            const questionCard = document.querySelector(`.question-card[data-question-index="${qIndex}"]`);
            if (!questionCard) continue;
            
            // Find the selected radio input using its index rather than value
            const radioInput = document.querySelector(`input[name="quiz-question-${qIndex}"][value="${answer.selectedIndex}"]`);
            if (!radioInput) continue;
            
            const formCheck = radioInput.closest('.form-check');
            const cardBody = radioInput.closest('.card-body');
            const feedbackDiv = cardBody.querySelector('.answer-feedback');
            const correctFeedback = feedbackDiv.querySelector('.correct-answer');
            const wrongFeedback = feedbackDiv.querySelector('.wrong-answer');
            
            // Show the feedback with a staggered animation delay
            setTimeout(() => {
                // Show the feedback div
                feedbackDiv.classList.remove('d-none');
                
                // Compare using indices instead of text
                if (answer.selectedIndex === answer.correctIndex) {
                    // Show correct feedback
                    correctFeedback.classList.remove('d-none');
                    wrongFeedback.classList.add('d-none');
                    
                    // Highlight the correct answer
                    formCheck.classList.add('correct-answer');
                    correctCount++;
                } else {
                    // Show wrong feedback
                    correctFeedback.classList.add('d-none');
                    wrongFeedback.classList.remove('d-none');
                    
                    // Highlight wrong answer and mark the correct one
                    formCheck.classList.add('wrong-answer');
                    
                    // Find and highlight the correct answer option using index
                    const correctOption = document.querySelector(`input[name="quiz-question-${qIndex}"][value="${answer.correctIndex}"]`);
                    if (correctOption) {
                        const correctFormCheck = correctOption.closest('.form-check');
                        correctFormCheck.classList.add('correct-answer');
                    }
                }
                
                // Disable all options for this question
                const relatedOptions = document.querySelectorAll(`input[name="quiz-question-${qIndex}"]`);
                relatedOptions.forEach(opt => {
                    opt.disabled = true;
                });
                
                // Scroll to the question if it's not visible
                questionCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, animationDelay);
            
            animationDelay += 100; // Stagger the animations
        }
        
        // Show overall score after all feedback is shown
        setTimeout(() => {
            const totalQuestions = quizData.questions.length;
            const percentage = Math.round((correctCount / totalQuestions) * 100);
            
            const scoreElement = document.createElement('div');
            scoreElement.className = 'alert mt-3';
            
            let feedbackClass = 'alert-info';
            let feedbackIcon = 'info-circle-fill';
            let feedbackMessage = 'Keep practicing to improve!';
            
            if (percentage >= 80) {
                feedbackClass = 'alert-success';
                feedbackIcon = 'trophy-fill';
                feedbackMessage = 'Excellent work! You\'re well-prepared for the exam.';
            } else if (percentage >= 60) {
                feedbackClass = 'alert-info';
                feedbackIcon = 'patch-check-fill';
                feedbackMessage = 'Good job! Review the incorrect answers to strengthen your knowledge.';
            } else {
                feedbackClass = 'alert-warning';
                feedbackIcon = 'exclamation-triangle-fill';
                feedbackMessage = 'Review the material again to improve your understanding.';
            }
            
            scoreElement.className = `alert ${feedbackClass}`;
            scoreElement.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bi bi-${feedbackIcon} fs-3 me-3"></i>
                    <div>
                        <h5 class="mb-1">Quiz Results</h5>
                        <p class="mb-1">Your score: <strong>${correctCount}/${totalQuestions}</strong> (${percentage}%)</p>
                        <p class="mb-0 small">${feedbackMessage}</p>
                    </div>
                </div>
            `;
            
            // Add score to the quiz footer
            if (quizScoreContainer) {
                quizScoreContainer.appendChild(scoreElement);
                quizScoreContainer.style.animation = 'fadeIn 0.8s';
                
                // Scroll to the bottom to show the score
                quizFooter.scrollIntoView({ behavior: 'smooth' });
            }
            
            // Change "Generate New Quiz" button text
            generateNewQuizBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Try Another Quiz';
        }, animationDelay + 500);
    }
    
    // Function to confirm and generate a new quiz
    function confirmNewQuiz() {
        if (confirm('Are you sure you want to generate a new quiz? Your current quiz will be lost.')) {
            localStorage.removeItem('studyLmQuiz');
            localStorage.removeItem('quizSelections');
            
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

        if (quizScoreContainer) {
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
