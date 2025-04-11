/**
 * quiz_ui.js - Shared quiz UI functionality for StudyLM
 * This module provides reusable functions for rendering quiz UI, 
 * handling user selections, and evaluating answers across different quiz features.
 */

// Common quiz UI functions
const QuizUI = {
    /**
     * Initialize quiz options and make them interactive
     * @param {NodeList} options - The quiz options (radio inputs)
     * @param {Object} quizSelections - Object to store user selections
     * @param {Function} updateCallback - Optional callback when selections change
     */
    attachQuizHandlers: function(options, quizSelections, updateCallback) {
        options.forEach(option => {
            option.addEventListener('change', function() {
                const questionIndex = parseInt(this.dataset.questionIndex);
                const choiceIndex = parseInt(this.dataset.choiceIndex);
                const quizGroup = this.dataset.quizGroup;
                const questionName = this.getAttribute('name');
                const formCheck = this.closest('.form-check');
                const cardBody = formCheck.closest('.card-body');
                
                // Remove any previous selection highlight in this question
                cardBody.querySelectorAll('.form-check').forEach(fc => {
                    fc.classList.remove('selected-answer');
                });
                
                // Add highlight to the selected answer
                formCheck.classList.add('selected-answer');
                
                // Store the selection
                if (quizGroup) {
                    // For study guide section quizzes
                    if (!quizSelections[quizGroup]) {
                        quizSelections[quizGroup] = {};
                    }
                    
                    quizSelections[quizGroup][questionName] = {
                        selected: this.value,
                        correct: this.dataset.correct
                    };
                    
                    // Enable submit button if exists
                    const submitButton = document.getElementById(`submit-${quizGroup}`);
                    if (submitButton && Object.keys(quizSelections[quizGroup]).length > 0) {
                        submitButton.disabled = false;
                        submitButton.classList.add('animate__animated', 'animate__pulse');
                    }
                } else {
                    // For main quiz page
                    const selectedChoiceText = this.closest('.card-body').querySelector(`label[for="${this.id}"]`).textContent.trim();
                    const correctAnswerText = this.dataset.correct;
                    const correctIndex = this.dataset.correctIndex !== undefined ? 
                        parseInt(this.dataset.correctIndex) : null;
                    
                    quizSelections[questionIndex] = {
                        selectedIndex: choiceIndex,
                        correctIndex: correctIndex,
                        selected: selectedChoiceText,
                        correct: correctAnswerText
                    };
                    
                    // Call the update callback if provided
                    if (typeof updateCallback === 'function') {
                        updateCallback();
                    }
                }
            });
        });
        
        // Make entire form-check div clickable for better UX
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
    },
    
    /**
     * Render a quiz from provided quiz data
     * @param {Object} quizData - The quiz data containing questions and answers
     * @param {Element} container - The container element to render the quiz in
     * @param {Object} quizSelections - Object to store user selections
     * @param {Function} updateCallback - Optional callback when selections change
     * @returns {number} - The total number of questions rendered
     */
    renderQuizUI: function(quizData, container, quizSelections, updateCallback) {
        container.innerHTML = '';
        
        if (!quizData || !quizData.questions || !quizData.questions.length) {
            console.error('No quiz questions available');
            return 0;
        }
        
        // Add quiz title and description
        const titleSection = document.createElement('div');
        titleSection.className = 'mb-4';
        titleSection.innerHTML = `
            <h2 class="mb-3">Comprehensive Exam Preparation</h2>
            <p class="lead">This quiz contains ${quizData.questions.length} questions covering essential concepts from your study materials.</p>
            <p class="text-muted mb-4">Select the best answer for each question. You can check your answers when finished.</p>
        `;
        container.appendChild(titleSection);
        
        // Render each question
        quizData.questions.forEach((question, index) => {
            const questionNumber = index + 1;
            const questionCard = document.createElement('div');
            questionCard.className = 'card question-card mb-4';
            questionCard.dataset.questionIndex = index;
            
            // Create the HTML for the question card
            let choicesHtml = '';
            question.choices.forEach((choice, choiceIndex) => {
                const isCorrect = choice === question.correct_answer ? 'true' : 'false';
                const correctIndex = question.correct_answer ? 
                    question.choices.findIndex(c => c === question.correct_answer) : '';
                
                choicesHtml += `
                    <div class="form-check">
                        <input class="form-check-input quiz-option" 
                            type="radio" 
                            name="quiz-question-${index}" 
                            value="${choiceIndex}"
                            data-question-index="${index}"
                            data-choice-index="${choiceIndex}"
                            data-correct="${isCorrect}"
                            data-correct-index="${correctIndex}"
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
            
            container.appendChild(questionCard);
            
            // Store the correct answer index for easier comparison later
            const correctIndex = question.choices.findIndex(choice => choice === question.correct_answer);
            if (correctIndex !== -1) {
                question.correctIndex = correctIndex;
            }
        });
        
        // Attach event handlers
        const quizOptions = document.querySelectorAll('.quiz-option');
        this.attachQuizHandlers(quizOptions, quizSelections, updateCallback);
        
        return quizData.questions.length;
    },
    
    /**
     * Evaluate quiz answers and display feedback
     * @param {Object} quizSelections - The user's selected answers
     * @param {Object} quizData - The quiz data containing correct answers
     * @param {Element} scoreContainer - Element to display the score
     * @param {Element} submitBtn - The submit button to update
     * @param {string} [quizGroup] - Optional quiz group ID for study guide quizzes
     * @returns {Object} - Score results {correct, total, percentage}
     */
    evaluateQuizUI: function(quizSelections, quizData, scoreContainer, submitBtn, quizGroup) {
        let correctCount = 0;
        let totalQuestions = 0;
        
        // Handle different quiz types (main quiz or study guide section quiz)
        if (quizGroup) {
            // Study guide section quiz evaluation
            totalQuestions = Object.keys(quizSelections[quizGroup]).length;
            
            // Process each answer in the quiz group
            for (const questionName in quizSelections[quizGroup]) {
                const answer = quizSelections[quizGroup][questionName];
                
                // Find the question element
                const radioInput = document.querySelector(`input[name="${questionName}"][value="${answer.selected}"]`);
                if (!radioInput) continue;
                
                const formCheck = radioInput.closest('.form-check');
                const cardBody = radioInput.closest('.card-body');
                const quizCard = radioInput.closest('.quiz-card');
                const feedbackDiv = cardBody.querySelector('.answer-feedback');
                const correctFeedback = feedbackDiv.querySelector('.correct-answer');
                const wrongFeedback = feedbackDiv.querySelector('.wrong-answer');
                
                // Show the feedback div
                feedbackDiv.classList.remove('d-none');
                
                if (answer.selected === answer.correct) {
                    // Show correct feedback
                    correctFeedback.classList.remove('d-none');
                    wrongFeedback.classList.add('d-none');
                    
                    // Highlight the correct answer
                    formCheck.classList.add('correct-answer');
                    correctCount++;
                    
                    // Add green border to card if it exists
                    if (quizCard) {
                        quizCard.style.borderLeft = '4px solid var(--success)';
                    }
                    
                    // Play sound if available
                    this.playSound('success');
                } else {
                    // Show wrong feedback
                    correctFeedback.classList.add('d-none');
                    wrongFeedback.classList.remove('d-none');
                    
                    // Highlight the wrong answer
                    formCheck.classList.add('wrong-answer');
                    
                    // Find and highlight the correct answer option
                    const correctOption = document.querySelector(`input[name="${questionName}"][value="${answer.correct}"]`);
                    if (correctOption) {
                        const correctFormCheck = correctOption.closest('.form-check');
                        correctFormCheck.classList.add('correct-answer');
                    }
                    
                    // Add red border to card if it exists
                    if (quizCard) {
                        quizCard.style.borderLeft = '4px solid var(--danger)';
                    }
                    
                    // Play sound if available
                    this.playSound('error');
                }
                
                // Disable all options for this question
                const relatedOptions = document.querySelectorAll(`input[name="${questionName}"]`);
                relatedOptions.forEach(opt => {
                    opt.disabled = true;
                });
            }
        } else {
            // Main quiz evaluation
            totalQuestions = quizData ? quizData.questions.length : Object.keys(quizSelections).length;
            
            // Process each answer
            for (const questionIndex in quizSelections) {
                const answer = quizSelections[questionIndex];
                const qIndex = parseInt(questionIndex);
                
                // Find the question element
                const questionCard = document.querySelector(`.question-card[data-question-index="${qIndex}"]`);
                if (!questionCard) continue;
                
                // Find the selected radio input
                const radioInput = document.querySelector(`input[name="quiz-question-${qIndex}"][value="${answer.selectedIndex}"]`);
                if (!radioInput) continue;
                
                const formCheck = radioInput.closest('.form-check');
                const cardBody = radioInput.closest('.card-body');
                const feedbackDiv = cardBody.querySelector('.answer-feedback');
                const correctFeedback = feedbackDiv.querySelector('.correct-answer');
                const wrongFeedback = feedbackDiv.querySelector('.wrong-answer');
                
                // Show the feedback div
                feedbackDiv.classList.remove('d-none');
                
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
                    
                    // Find and highlight the correct answer option
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
            }
        }
        
        // Update submit button if provided
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-check2-all"></i> Review Answers';
        }
        
        // Display score if container is provided
        if (scoreContainer) {
            const percentage = Math.round((correctCount / totalQuestions) * 100);
            scoreContainer.innerHTML = '';
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
            
            scoreContainer.appendChild(scoreElement);
            
            // No scrolling to score container - let it appear naturally where it is
        }
        
        return {
            correct: correctCount,
            total: totalQuestions,
            percentage: Math.round((correctCount / totalQuestions) * 100)
        };
    },
    
    /**
     * Play a sound effect
     * @param {string} type - The type of sound to play ('success' or 'error')
     */
    playSound: function(type) {
        // Only play sounds if user preference is set
        if (localStorage.getItem('enableSounds') !== 'false') {
            const audio = new Audio();
            if (type === 'success') {
                audio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-beep-221.mp3';
            } else {
                audio.src = 'https://assets.mixkit.co/sfx/preview/mixkit-interface-click-1126.mp3';
            }
            audio.volume = 0.2;
            audio.play().catch(err => console.log('Error playing sound:', err));
        }
    },
    
    /**
     * Add CSS styles for quiz UI elements
     */
    addStyles: function() {
        // Check if styles are already added
        if (document.getElementById('quiz-ui-styles')) {
            return;
        }
        
        const quizStyle = document.createElement('style');
        quizStyle.id = 'quiz-ui-styles';
        quizStyle.innerHTML = `
            /* Answer selection styling */
            .selected-answer {
                background-color: rgba(13, 110, 253, 0.08);
                border-color: rgba(13, 110, 253, 0.3);
                transform: translateX(5px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                transition: all 0.2s ease;
            }
            
            /* Correct/wrong answer styling */
            .correct-answer {
                background-color: rgba(25, 135, 84, 0.1);
                border-color: rgba(25, 135, 84, 0.3);
            }
            
            .wrong-answer {
                background-color: rgba(220, 53, 69, 0.1);
                border-color: rgba(220, 53, 69, 0.3);
            }
            
            /* Animations */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.03); }
                100% { transform: scale(1); }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-5px); }
                40%, 80% { transform: translateX(5px); }
            }
            
            .quiz-score-container {
                transition: all 0.3s ease;
            }
            
            .quiz-card, .question-card {
                transition: all 0.3s ease;
            }
            
            /* Improved focus state for accessibility */
            .form-check-input:focus {
                box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
            }
            
            /* Make form-checks more clickable */
            .form-check {
                cursor: pointer;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid transparent;
                margin-bottom: 8px;
                transition: all 0.2s ease;
            }
            
            .form-check:hover {
                background-color: rgba(13, 110, 253, 0.04);
            }
        `;
        document.head.appendChild(quizStyle);
    }
};

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuizUI;
} else {
    window.QuizUI = QuizUI;
}