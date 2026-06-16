import os
import sqlite3
from flask import current_app, g, has_app_context

FALLBACK_DB_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
    'instance', 
    'database.db'
)

def get_db_connection():
    """Returns a connection to the SQLite database. Detects if running within Flask context."""
    if has_app_context():
        db_path = current_app.config['DATABASE']
    else:
        db_path = FALLBACK_DB_PATH
        # Ensure parent directory exists for fallback
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn
