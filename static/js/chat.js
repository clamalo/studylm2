// chat.js
document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    const sendButton = document.getElementById('send-button');
    const suggestedQuestions = document.querySelectorAll('.suggested-question');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const newChatButton = document.getElementById('new-chat-button');
    const topicButtons = document.querySelectorAll('.topic-btn');
    const modelSelector = document.getElementById('model-selector');
    
    // Initialize chat history from localStorage or as empty array if nothing stored
    let chatHistory = loadChatHistory();
    
    // Initialize the chat UI with saved messages if they exist
    initializeChatUI();
    
    // Track if we're currently waiting for a response
    let isWaitingForResponse = false;
    
    // Track the current streaming message ID
    let currentStreamingMessageId = null;
    
    // Disable model selector if there are already messages in the chat
    if (chatHistory.length > 0) {
        disableModelSelector();
    }
    
    // Function to disable model selector
    function disableModelSelector() {
        modelSelector.disabled = true;
        modelSelector.classList.add('disabled');
    }
    
    // Function to enable model selector
    function enableModelSelector() {
        modelSelector.disabled = false;
        modelSelector.classList.remove('disabled');
    }
    
    // Function to load chat history from localStorage
    function loadChatHistory() {
        const saved = localStorage.getItem('chatHistory');
        return saved ? JSON.parse(saved) : [];
    }
    
    // Function to save chat history to localStorage
    function saveChatHistory() {
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
    
    // Save the selected model to localStorage
    function saveSelectedModel() {
        localStorage.setItem('selectedModel', modelSelector.value);
    }
    
    // Load the selected model from localStorage
    function loadSelectedModel() {
        const savedModel = localStorage.getItem('selectedModel');
        if (savedModel) {
            modelSelector.value = savedModel;
        }
    }
    
    // Load the saved model preference
    loadSelectedModel();
    
    // Save model preference when changed
    modelSelector.addEventListener('change', saveSelectedModel);
    
    // Function to initialize chat UI with saved messages
    function initializeChatUI() {
        // Clear the chat area of any default welcome message
        if (chatHistory.length > 0) {
            chatMessages.innerHTML = '';
            
            // Recreate all messages from chat history
            chatHistory.forEach(item => {
                addMessageToChat(item.content, item.role);
            });
            
            // Scroll to the bottom
            scrollToBottom();
        }
    }
    
    // Function to scroll chat to bottom with a simple animation
    function scrollToBottom() {
        // Use the smooth implementation
        smoothScrollToBottom();
    }
    
    // Function to add a message to the chat UI
    function addMessageToChat(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        // Add appropriate icon based on sender
        const icon = document.createElement('i');
        icon.className = sender === 'user' ? 'bi bi-person' : 'bi bi-robot';
        avatarDiv.appendChild(icon);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        headerDiv.innerHTML = `<span class="message-name">${sender === 'user' ? 'You' : 'AI Assistant'}</span>`;
        
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'message-body';
        
        // If this is the first user message and we're starting a new chat, clear the welcome message
        if (sender === 'user' && chatHistory.length === 0) {
            chatMessages.innerHTML = '';
        }
        
        // Process markdown content for assistant messages using the marked library
        if (sender === 'assistant') {
            // Configure marked options
            marked.setOptions({
                breaks: true,          // Add <br> on a single line break
                gfm: true,             // GitHub Flavored Markdown
                headerIds: false,      // Don't add IDs to headers
                mangle: false,         // Don't escape HTML
                sanitize: false        // Don't sanitize HTML
            });
            
            bodyDiv.innerHTML = marked.parse(message);
        } else {
            bodyDiv.textContent = message;
        }
        
        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(bodyDiv);
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat
        scrollToBottom();
        
        return messageDiv;
    }
    
    // Function to create an assistant message bubble for streaming
    function createStreamingMessageBubble() {
        // Generate a unique ID for this streaming message
        const streamingId = 'streaming-message-' + Date.now();
        currentStreamingMessageId = streamingId;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message assistant-message';
        messageDiv.id = streamingId;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        const icon = document.createElement('i');
        icon.className = 'bi bi-robot';
        avatarDiv.appendChild(icon);
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        headerDiv.innerHTML = '<span class="message-name">AI Assistant</span>';
        
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'message-body';
        bodyDiv.id = streamingId + '-content';
        
        // Add regular loading animation for all models
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'typing-indicator';
        loadingDiv.innerHTML = '<span></span><span></span><span></span>';
        bodyDiv.appendChild(loadingDiv);
        
        contentDiv.appendChild(headerDiv);
        contentDiv.appendChild(bodyDiv);
        
        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to the bottom of the chat
        scrollToBottom();
        
        return {
            messageDiv,
            bodyDiv,
            streamingId
        };
    }
    
    // Keep track of the last full response
    let lastFullResponse = '';

    // Function to update the streaming message bubble with new content
    function updateStreamingMessage(content) {
        if (!currentStreamingMessageId) return;
        
        const streamingContent = document.getElementById(currentStreamingMessageId + '-content');
        if (streamingContent) {
            // Configure marked options
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: false,
                mangle: false,
                sanitize: false
            });
            
            // Only process if content has changed
            if (content !== lastFullResponse) {
                // Remove the loading indicator if it exists (when first chunk arrives)
                const loadingIndicator = streamingContent.querySelector('.typing-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
                
                // Remove the thinking animation if it exists (when first chunk arrives)
                const thinkingAnimation = streamingContent.querySelector('.thinking-animation');
                if (thinkingAnimation) {
                    thinkingAnimation.remove();
                }
                
                // Parse and display the content immediately
                streamingContent.innerHTML = marked.parse(content);
                
                // Update our tracking variable
                lastFullResponse = content;
            }
        }
    }
    
    // Function to convert a streaming message to a permanent message
    function finalizeStreamingMessage(content) {
        if (!currentStreamingMessageId || !content) return;
        
        // Find the streaming message element
        const streamingMessage = document.getElementById(currentStreamingMessageId);
        if (!streamingMessage) return;
        
        // Create a permanent message to replace it
        const permanentMessage = addMessageToChat(content, 'assistant');
        
        // Replace the streaming message with the permanent one
        streamingMessage.remove();
    }
    
    // Smooth scrolling function
    function smoothScrollToBottom() {
        const scrollContainer = chatMessages;
        const targetPosition = scrollContainer.scrollHeight;
        
        // Use smooth scrolling with requestAnimationFrame
        const startPosition = scrollContainer.scrollTop;
        const distance = targetPosition - startPosition;
        const duration = 300; // milliseconds
        let startTime = null;
        
        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Use ease-out effect for smoother finish
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            scrollContainer.scrollTop = startPosition + distance * easeProgress;
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        }
        
        window.requestAnimationFrame(step);
    }
    
    // Function to send a message to the server
    async function sendMessage(message) {
        // Mark that we're waiting for a response
        isWaitingForResponse = true;
        
        // Enable the input field but disable the send button
        chatInput.disabled = false;
        sendButton.disabled = true;
        
        // Display the user's message
        addMessageToChat(message, 'user');
        
        // Clear the input field
        chatInput.value = '';
        
        // If this is the first message, disable the model selector
        if (chatHistory.length === 0) {
            disableModelSelector();
        }
        
        // Create streaming message bubble
        const { bodyDiv, streamingId } = createStreamingMessageBubble();
        
        try {
            // Get the selected model
            const selectedModel = modelSelector.value;
            
            // Update chat history for the user message
            chatHistory.push({
                role: 'user',
                content: message
            });
            
            // Add a unique timestamp to prevent caching issues with EventSource
            const timestamp = Date.now();
            
            // First, make the POST request to start the message processing
            console.log('Sending POST request to start message processing');
            const postResponse = await fetch('/send-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    model: selectedModel,
                    stream: true  // Always set to true - server will enforce streaming anyway
                })
            });
            
            if (!postResponse.ok) {
                throw new Error(`POST request failed: ${postResponse.status}`);
            }
            
            // Now create the EventSource to receive the stream
            console.log(`Creating EventSource connection with timestamp: ${timestamp}`);
            const eventSource = new EventSource(`/send-chat?timestamp=${timestamp}`);
            
            // Set up variables for tracking the response
            let fullResponse = '';
            let hasReceivedChunk = false;
            let connectionTimeout = null;
            
            // Handle connection opened
            eventSource.onopen = function(event) {
                console.log('EventSource connection opened successfully');
                // Set a timeout to close the connection if no chunks are received
                connectionTimeout = setTimeout(() => {
                    if (!hasReceivedChunk) {
                        console.error('Connection timeout - no data received within 20 seconds');
                        eventSource.close();
                        updateStreamingMessage('Error: Request timed out. Please try again.');
                        
                        // Re-enable buttons
                        sendButton.disabled = false;
                        isWaitingForResponse = false;
                    }
                }, 60000); // 20 second timeout
            };
            
            // Process regular chunks
            eventSource.onmessage = function(event) {
                try {
                    console.log(`Received SSE data: ${event.data.substring(0, 100)}...`);
                    const data = JSON.parse(event.data);
                    
                    // If we get a connection established message
                    if (data.connection === 'established') {
                        console.log('Connection established with server');
                        return;
                    }
                    
                    // If we get an error message
                    if (data.error) {
                        console.error('Error from server:', data.error);
                        eventSource.close();
                        
                        // Reset our tracking variable
                        lastFullResponse = '';
                        
                        updateStreamingMessage(`Error: ${data.error}`);
                        
                        // Re-enable buttons
                        sendButton.disabled = false;
                        isWaitingForResponse = false;
                        
                        // Clear any pending timeout
                        if (connectionTimeout) {
                            clearTimeout(connectionTimeout);
                            connectionTimeout = null;
                        }
                        return;
                    }
                    
                    // Process regular chunks
                    if (data.chunk) {
                        // Clear the timeout since we've received data
                        if (connectionTimeout && !hasReceivedChunk) {
                            clearTimeout(connectionTimeout);
                            connectionTimeout = null;
                        }
                        
                        hasReceivedChunk = true;
                        
                        // Get the scroll position before updating content
                        const scrollContainer = chatMessages;
                        const wasAtBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 10;
                        
                        // Update content immediately
                        fullResponse = data.full_response;
                        updateStreamingMessage(fullResponse);
                        
                        // Smooth scroll only if we were already at the bottom
                        if (wasAtBottom) {
                            smoothScrollToBottom();
                        }
                    }
                    
                    // Handle completion
                    if (data.done) {
                        console.log('Received done signal, closing connection');
                        eventSource.close();
                        
                        // Only update chat history if we actually received content
                        if (hasReceivedChunk && fullResponse) {
                            // Add the assistant response to chat history
                            chatHistory.push({
                                role: 'assistant',
                                content: fullResponse
                            });
                            
                            // Save to localStorage
                            saveChatHistory();
                            
                            // Convert streaming message to permanent message
                            finalizeStreamingMessage(fullResponse);
                        }
                        
                        // Reset for next message
                        lastFullResponse = '';
                        currentStreamingMessageId = null;
                        
                        // Clear any pending timeout
                        if (connectionTimeout) {
                            clearTimeout(connectionTimeout);
                            connectionTimeout = null;
                        }
                        
                        // Re-enable the send button
                        sendButton.disabled = false;
                        
                        // Not waiting for a response anymore
                        isWaitingForResponse = false;
                        
                        // Focus on input
                        chatInput.focus();
                    }
                } catch (error) {
                    console.error('Error processing event data:', error, 'Raw data:', event.data);
                    eventSource.close();
                    updateStreamingMessage('Error: Failed to process server response.');
                    
                    // Reset for next message
                    lastFullResponse = '';
                    currentStreamingMessageId = null;
                    
                    // Re-enable buttons
                    sendButton.disabled = false;
                    isWaitingForResponse = false;
                    
                    // Clear any pending timeout
                    if (connectionTimeout) {
                        clearTimeout(connectionTimeout);
                        connectionTimeout = null;
                    }
                }
            };
            
            // Handle errors
            eventSource.onerror = function(error) {
                console.error('EventSource error:', error);
                eventSource.close();
                
                // Clear any pending timeout
                if (connectionTimeout) {
                    clearTimeout(connectionTimeout);
                    connectionTimeout = null;
                }
                
                // Only show error if we haven't received any chunks yet
                if (!hasReceivedChunk) {
                    updateStreamingMessage('Error: Connection to server was lost. Please try again.');
                }
                
                // Re-enable buttons
                sendButton.disabled = false;
                isWaitingForResponse = false;
                
                // Reset our tracking variable
                currentStreamingMessageId = null;
                
                // Focus on input
                chatInput.focus();
            };
            
        } catch (error) {
            console.error('Error initiating request:', error);
            
            // Show error message
            updateStreamingMessage('Error: Failed to connect to server. Please try again.');
            
            // Re-enable buttons
            sendButton.disabled = false;
            isWaitingForResponse = false;
            
            // Reset our tracking variable
            currentStreamingMessageId = null;
            
            // Focus on input
            chatInput.focus();
        }
    }
    
    // Handle form submission
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const message = chatInput.value.trim();
        if (message && !isWaitingForResponse) {
            sendMessage(message);
        } else if (message && isWaitingForResponse) {
            // If we're waiting for a response, simply clear the input
            // The message will be kept for the next submission
            e.preventDefault();
        }
    });
    
    // Handle suggested questions
    suggestedQuestions.forEach(button => {
        button.addEventListener('click', function() {
            const question = this.textContent.trim();
            chatInput.value = question;
            if (!isWaitingForResponse) {
                sendMessage(question);
            }
        });
    });
    
    // Handle topic buttons
    topicButtons.forEach(button => {
        button.addEventListener('click', function() {
            const topic = this.textContent.trim();
            const question = `Tell me about ${topic}`;
            chatInput.value = question;
            if (!isWaitingForResponse) {
                sendMessage(question);
            }
        });
    });
    
    // Handle new chat button click
    if (newChatButton) {
        newChatButton.addEventListener('click', function() {
            // Tell the server to create a new chat session without confirmation
            fetch('/new-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create new chat');
                }
                return response.json();
            })
            .then(data => {
                // Clear chat history
                chatHistory = [];
                localStorage.removeItem('chatHistory');
                
                // Enable model selector for new chat
                enableModelSelector();
                
                // Reset the UI
                chatMessages.innerHTML = `
                    <div class="message assistant-message">
                        <div class="message-avatar">
                            <i class="bi bi-robot"></i>
                        </div>
                        <div class="message-content">
                            <div class="message-header">
                                <span class="message-name">AI Assistant</span>
                            </div>
                            <div class="message-body">
                                <p>Hello! I'm your AI study assistant. I've analyzed your uploaded materials. What would you like to know about them?</p>
                            </div>
                        </div>
                    </div>
                `;
                
                // Focus on input
                chatInput.focus();
            })
            .catch(error => {
                console.error('Error creating new chat:', error);
                alert('There was an error creating a new chat. Please try again.');
            });
        });
    }
    
    // Set focus to chat input on page load
    chatInput.focus();
    
    // Add Enter key handling (Enter to send, Shift+Enter for new line)
    chatInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            chatForm.dispatchEvent(new Event('submit'));
        }
    });
});