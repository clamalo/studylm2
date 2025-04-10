"""
Progress updates tracking system for StudyLM
This module provides functionality to track and retrieve progress updates
during long-running operations like study guide generation.
"""

import time
from threading import Lock
from collections import deque

# Store progress updates in a thread-safe way
_progress_data = {}
_progress_lock = Lock()

# Maximum number of messages to keep per operation
MAX_MESSAGES = 50

def init_progress(operation_id):
    """Initialize progress tracking for a specific operation"""
    with _progress_lock:
        _progress_data[operation_id] = {
            'messages': deque(maxlen=MAX_MESSAGES),
            'status': 'initializing',
            'progress': 0,
            'last_update': time.time()
        }

def add_progress_message(operation_id, message, status=None, progress=None):
    """Add a progress message and optionally update status/progress"""
    with _progress_lock:
        if operation_id not in _progress_data:
            init_progress(operation_id)
        
        # Add timestamp to message
        timestamp = time.time()
        _progress_data[operation_id]['messages'].append({
            'text': message,
            'timestamp': timestamp
        })
        
        # Update status if provided
        if status:
            _progress_data[operation_id]['status'] = status
        
        # Update progress if provided
        if progress is not None:
            _progress_data[operation_id]['progress'] = progress
            
        # Update last update time
        _progress_data[operation_id]['last_update'] = timestamp

def get_progress(operation_id):
    """Get progress data for a specific operation"""
    with _progress_lock:
        if operation_id not in _progress_data:
            return None
        
        # Convert deque to list for JSON serialization
        progress_data = dict(_progress_data[operation_id])
        progress_data['messages'] = list(progress_data['messages'])
        return progress_data

def clear_progress(operation_id):
    """Clear progress data for a specific operation"""
    with _progress_lock:
        if operation_id in _progress_data:
            del _progress_data[operation_id]

def cleanup_old_progress(max_age=3600):
    """Remove progress data older than max_age seconds"""
    current_time = time.time()
    with _progress_lock:
        to_remove = []
        for op_id, data in _progress_data.items():
            if current_time - data['last_update'] > max_age:
                to_remove.append(op_id)
        
        for op_id in to_remove:
            del _progress_data[op_id]