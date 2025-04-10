document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const fileUpload = document.getElementById('fileUpload');
    const browseBtn = document.getElementById('browseBtn');
    const uploadArea = document.getElementById('uploadArea');
    const fileList = document.getElementById('fileList');
    const generateBtn = document.getElementById('generateBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const generationProgress = document.getElementById('generationProgress');
    const generationStatus = document.getElementById('generationStatus');
    const progressUpdates = document.getElementById('progressUpdates');
    const progressCounter = document.getElementById('progressCounter');

    // Progress tracking variables
    let operationId = null;
    let progressCheckInterval = null;
    let updateCount = 0;
    let lastMessageId = -1;

    // Click the hidden file input when the browse button is clicked
    browseBtn.addEventListener('click', function() {
        fileUpload.click();
    });

    // Click the hidden file input when the upload area is clicked
    uploadArea.addEventListener('click', function() {
        fileUpload.click();
    });

    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight the drop area when a file is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        uploadArea.classList.add('dragover');
    }

    function unhighlight() {
        uploadArea.classList.remove('dragover');
    }

    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileUpload.files = files;
        updateFileList();
    }

    // Update file list when files are selected via the file input
    fileUpload.addEventListener('change', updateFileList);

    // Function to display selected files
    function updateFileList() {
        fileList.innerHTML = '';
        
        if (fileUpload.files.length > 0) {
            for (let i = 0; i < fileUpload.files.length; i++) {
                const file = fileUpload.files[i];
                const fileSize = formatFileSize(file.size);
                
                const fileItem = document.createElement('div');
                fileItem.className = 'file-item';
                fileItem.innerHTML = `
                    <div class="file-icon me-2">
                        <i class="bi bi-file-earmark-text"></i>
                    </div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-size me-3">${fileSize}</div>
                `;
                
                fileList.appendChild(fileItem);
            }
        }
    }

    // Format file size to a human-readable format
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Function to check processing status
    function checkGenerationStatus() {
        if (!operationId) {
            return;
        }
        
        fetch(`/generation-status/${operationId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Update progress display
                if (data.progress) {
                    generationProgress.style.width = `${data.progress}%`;
                }
                
                // Update status text based on current status
                if (data.status) {
                    switch (data.status) {
                        case 'uploading':
                            generationStatus.textContent = 'Uploading files...';
                            break;
                        case 'preparing':
                            generationStatus.textContent = 'Preparing input for analysis...';
                            break;
                        case 'generating':
                            generationStatus.textContent = 'Generating study guide...';
                            break;
                        case 'complete':
                            generationStatus.textContent = 'Study guide created!';
                            window.location.href = '/study-guide';
                            clearInterval(progressCheckInterval);
                            break;
                        case 'error':
                            generationStatus.textContent = 'Error generating study guide';
                            clearInterval(progressCheckInterval);
                            alert('Error generating study guide. Please try again.');
                            loadingOverlay.classList.add('d-none');
                            break;
                    }
                }
                
                // Add new messages to the progress updates list
                if (data.messages && data.messages.length > 0) {
                    updateProgressMessages(data.messages);
                }
                
                // If generation is complete, redirect
                if (data.status === 'complete') {
                    setTimeout(() => {
                        window.location.href = '/study-guide';
                    }, 1000);
                }
            })
            .catch(err => {
                console.error('Error checking generation status:', err);
                // If there's an error, keep checking but less frequently
                clearInterval(progressCheckInterval);
                progressCheckInterval = setInterval(checkGenerationStatus, 5000);
            });
    }
    
    // Function to update progress messages in the UI
    function updateProgressMessages(messages) {
        // Find any new messages (those we haven't shown yet)
        const newMessages = messages.slice(lastMessageId + 1);
        lastMessageId = messages.length - 1;
        
        if (newMessages.length === 0) {
            return;
        }
        
        // Update the counter
        updateCount += newMessages.length;
        progressCounter.textContent = `${updateCount} steps`;
        
        // Add new messages to the list
        newMessages.forEach(msg => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item progress-update-item py-2';
            listItem.textContent = msg.text;
            
            // Add to the beginning for newest-first ordering
            progressUpdates.insertBefore(listItem, progressUpdates.firstChild);
            
            // Limit the number of visible messages to prevent UI clutter
            if (progressUpdates.children.length > 25) {
                progressUpdates.removeChild(progressUpdates.lastChild);
            }
        });
    }

    // Handle form submission
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate that files are selected
        if (fileUpload.files.length === 0) {
            alert('Please select at least one file to upload.');
            return;
        }
        
        // Reset progress tracking
        operationId = null;
        lastMessageId = -1;
        updateCount = 0;
        if (progressCheckInterval) {
            clearInterval(progressCheckInterval);
        }
        progressUpdates.innerHTML = '';
        progressCounter.textContent = '0 steps';
        generationProgress.style.width = '0%';
        generationStatus.textContent = 'Analyzing your materials...';
        
        // Show loading overlay
        loadingOverlay.classList.remove('d-none');
        
        // Create FormData object and append files
        const formData = new FormData();
        for (let i = 0; i < fileUpload.files.length; i++) {
            formData.append('files[]', fileUpload.files[i]);
        }
        
        // Send AJAX request to upload files and start background processing
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
                loadingOverlay.classList.add('d-none');
            } else {
                // Get operation ID and start checking progress
                operationId = data.operation_id;
                
                // Start checking status periodically
                progressCheckInterval = setInterval(checkGenerationStatus, 1500);
                
                // Do an immediate check
                checkGenerationStatus();
            }
        })
        .catch(error => {
            loadingOverlay.classList.add('d-none');
            alert('An error occurred: ' + error.message);
        });
    });
});