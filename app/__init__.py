import os
import sqlite3
from flask import Flask, g

# Helper for database connection outside request context (e.g. for model tests or init)
def get_db_connection():
    db_path = os.path.join('instance', 'database.db')
    os.makedirs('instance', exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

# For request context
def get_db():
    if 'db' not in g:
        from flask import current_app
        g.db = sqlite3.connect(
            current_app.config['DATABASE']
        )
        g.db.row_factory = sqlite3.Row
    return g.db

def create_app():
    # Since templates and static are inside the app package directory, Flask defaults work perfectly.
    app = Flask(__name__)
    
    app.config.from_mapping(
        SECRET_KEY='dev_fcumotomap_key',
        DATABASE=os.path.join(app.instance_path, 'database.db'),
    )
    
    os.makedirs(app.instance_path, exist_ok=True)

    @app.teardown_appcontext
    def close_db(e=None):
        db = g.pop('db', None)
        if db is not None:
            db.close()

    # Import and register blueprints
    from app.routes.main import main_bp
    from app.routes.api import api_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(api_bp)

    return app

def init_db():
    db_path = os.path.join('instance', 'database.db')
    os.makedirs('instance', exist_ok=True)
    conn = sqlite3.connect(db_path)
    schema_path = os.path.join('database', 'schema.sql')
    with open(schema_path, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print("Database initialized successfully.")
