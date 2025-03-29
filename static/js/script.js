document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const fileUpload = document.getElementById('fileUpload');
    const browseBtn = document.getElementById('browseBtn');
    const uploadArea = document.getElementById('uploadArea');
    const fileList = document.getElementById('fileList');
    const generateBtn = document.getElementById('generateBtn');
    const loadingOverlay = document.getElementById('loadingOverlay');

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

    // Handle form submission
    uploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate that files are selected
        if (fileUpload.files.length === 0) {
            alert('Please select at least one file to upload.');
            return;
        }
        
        // Show loading overlay
        loadingOverlay.classList.remove('d-none');
        
        // Create FormData object and append files
        const formData = new FormData();
        for (let i = 0; i < fileUpload.files.length; i++) {
            formData.append('files[]', fileUpload.files[i]);
        }
        
        // Send AJAX request to upload files and generate study guide
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            // Hide loading overlay
            loadingOverlay.classList.add('d-none');
            
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                // Redirect to the study guide page
                window.location.href = '/study-guide';
            }
        })
        .catch(error => {
            // Hide loading overlay
            loadingOverlay.classList.add('d-none');
            alert('An error occurred: ' + error.message);
        });
    });
});