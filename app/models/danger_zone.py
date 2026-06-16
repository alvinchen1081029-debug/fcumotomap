import sqlite3
from datetime import datetime
from flask import current_app, g

def get_db():
    """Get sqlite3 connection for the current Flask request context."""
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE']
        )
        g.db.row_factory = sqlite3.Row
    return g.db

def get_all():
    """Retrieve all danger zones, sorted by created_at descending."""
    db = get_db()
    try:
        cursor = db.cursor()
        cursor.execute('SELECT * FROM danger_zones ORDER BY created_at DESC')
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    except sqlite3.Error as e:
        current_app.logger.error(f"Database error in danger_zone.get_all: {e}")
        return []

def get_by_id(danger_zone_id):
    """Retrieve a single danger zone by its ID."""
    db = get_db()
    try:
        cursor = db.cursor()
        cursor.execute('SELECT * FROM danger_zones WHERE id = ?', (danger_zone_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except sqlite3.Error as e:
        current_app.logger.error(f"Database error in danger_zone.get_by_id: {e}")
        return None

def create(latitude, longitude, title, description, rating):
    """Insert a new danger zone and return its ID."""
    db = get_db()
    try:
        cursor = db.cursor()
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        cursor.execute('''
            INSERT INTO danger_zones (latitude, longitude, title, description, rating, upvotes, downvotes, created_at)
            VALUES (?, ?, ?, ?, ?, 0, 0, ?)
        ''', (float(latitude), float(longitude), title, description, int(rating), created_at))
        db.commit()
        return cursor.lastrowid
    except sqlite3.Error as e:
        db.rollback()
        current_app.logger.error(f"Database error in danger_zone.create: {e}")
        return None

def vote(danger_zone_id, vote_type):
    """Increment upvotes or downvotes for a danger zone and return updated counts."""
    db = get_db()
    try:
        cursor = db.cursor()
        if vote_type == 'upvote':
            cursor.execute('UPDATE danger_zones SET upvotes = upvotes + 1 WHERE id = ?', (danger_zone_id,))
        elif vote_type == 'downvote':
            cursor.execute('UPDATE danger_zones SET downvotes = downvotes + 1 WHERE id = ?', (danger_zone_id,))
        else:
            return None
        
        db.commit()
        
        # Get updated counts
        cursor.execute('SELECT upvotes, downvotes FROM danger_zones WHERE id = ?', (danger_zone_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except sqlite3.Error as e:
        db.rollback()
        current_app.logger.error(f"Database error in danger_zone.vote: {e}")
        return None

def add_comment(danger_zone_id, author, content):
    """Add a new comment for a danger zone."""
    db = get_db()
    try:
        cursor = db.cursor()
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        author = author.strip() if (author and author.strip()) else '匿名騎士'
        cursor.execute('''
            INSERT INTO comments (danger_zone_id, author, content, created_at)
            VALUES (?, ?, ?, ?)
        ''', (int(danger_zone_id), author, content, created_at))
        db.commit()
        return cursor.lastrowid
    except sqlite3.Error as e:
        db.rollback()
        current_app.logger.error(f"Database error in danger_zone.add_comment: {e}")
        return None

def get_comments(danger_zone_id):
    """Retrieve all comments for a danger zone, sorted by created_at ascending."""
    db = get_db()
    try:
        cursor = db.cursor()
        cursor.execute('''
            SELECT * FROM comments 
            WHERE danger_zone_id = ? 
            ORDER BY created_at ASC
        ''', (danger_zone_id,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    except sqlite3.Error as e:
        current_app.logger.error(f"Database error in danger_zone.get_comments: {e}")
        return []
