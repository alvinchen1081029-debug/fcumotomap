import os
from app import create_app, init_db

app = create_app()

# Auto-initialize DB on first run if database file is missing
if not os.path.exists(app.config['DATABASE']):
    init_db()
    print("Initialized SQLite database at:", app.config['DATABASE'])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
