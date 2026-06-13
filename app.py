import os
from app import app, init_db

if __name__ == '__main__':
    # Auto-initialize DB on first run if database file is missing
    if not os.path.exists(app.config['DATABASE']):
        init_db()
        print("Initialized SQLite database at:", app.config['DATABASE'])
    app.run(debug=True, port=5000)
