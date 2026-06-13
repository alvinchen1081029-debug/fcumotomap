import os
import sqlite3
from flask import Flask, g

# Initialize Flask application under the package
app = Flask(__name__, 
            template_folder='templates', 
            static_folder='static')

app.config.from_mapping(
    SECRET_KEY=os.environ.get('SECRET_KEY', 'dev_key_for_fcumotomap_safety'),
    DATABASE=os.path.join(app.instance_path, 'database.db'),
)

# Ensure the instance folder exists
os.makedirs(app.instance_path, exist_ok=True)

# Register routes/blueprints (importing after app initialization to prevent circular imports)
from app.routes.routes import main_bp
app.register_blueprint(main_bp)

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    db = sqlite3.connect(
        app.config['DATABASE']
    )
    # database is in parent folder of app package
    schema_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'schema.sql')
    with open(schema_path, 'r', encoding='utf-8') as f:
        db.executescript(f.read())
    db.commit()
    db.close()
