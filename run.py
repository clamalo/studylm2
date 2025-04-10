from app import create_app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    # Create static directory if it doesn't exist
    import os
    os.makedirs('static', exist_ok=True)
    
    # Run the Flask application
    app.run(debug=True)