import sqlite3
from datetime import datetime
from app.models import get_db_connection

def get_comments_for_target(target_type, target_id):
    """Retrieve comments for a specific target (danger_zone, intersection, or poi)."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            SELECT * FROM comments 
            WHERE target_type = ? AND target_id = ? 
            ORDER BY created_at ASC
        ''', (target_type, int(target_id)))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"Error fetching comments for {target_type} #{target_id}: {e}")
        return []
    finally:
        conn.close()

def add_comment_to_target(target_type, target_id, author, content):
    """Add a new comment to a target in the polymorphic comments table."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        author = author.strip() if (author and author.strip()) else '匿名騎士'
        cursor.execute('''
            INSERT INTO comments (target_type, target_id, author, content, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (target_type, int(target_id), author, content, created_at))
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        print(f"Error adding comment for {target_type} #{target_id}: {e}")
        return None
    finally:
        conn.close()

def get_all():
    """Retrieve all danger zones, sorted by created_at descending."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM danger_zones ORDER BY created_at DESC')
        rows = cursor.fetchall()
        zones = [dict(r) for r in rows]
        # Attach comments to each zone
        for z in zones:
            z['comments'] = get_comments_for_target('danger_zone', z['id'])
        return zones
    except Exception as e:
        print(f"Database error in danger_zone.get_all: {e}")
        return []
    finally:
        conn.close()

def get_by_id(danger_zone_id):
    """Retrieve a single danger zone by its ID, with comments attached."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM danger_zones WHERE id = ?', (danger_zone_id,))
        row = cursor.fetchone()
        if row:
            zone = dict(row)
            zone['comments'] = get_comments_for_target('danger_zone', danger_zone_id)
            return zone
        return None
    except Exception as e:
        print(f"Database error in danger_zone.get_by_id: {e}")
        return None
    finally:
        conn.close()

def create(latitude, longitude, title, description, rating, hazard_type='other', reporter='匿名騎士'):
    """Insert a new danger zone and return its ID."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        reporter = reporter.strip() if (reporter and reporter.strip()) else '匿名騎士'
        cursor.execute('''
            INSERT INTO danger_zones (latitude, longitude, title, description, rating, upvotes, downvotes, hazard_type, reporter, created_at)
            VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?)
        ''', (float(latitude), float(longitude), title, description, int(rating), hazard_type, reporter, created_at))
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        print(f"Database error in danger_zone.create: {e}")
        return None
    finally:
        conn.close()

def vote(danger_zone_id, vote_type):
    """Increment upvotes or downvotes for a danger zone and return updated counts."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if vote_type == 'upvote':
            cursor.execute('UPDATE danger_zones SET upvotes = upvotes + 1 WHERE id = ?', (danger_zone_id,))
        elif vote_type == 'downvote':
            cursor.execute('UPDATE danger_zones SET downvotes = downvotes + 1 WHERE id = ?', (danger_zone_id,))
        else:
            return None
        
        conn.commit()
        
        # Get updated counts
        cursor.execute('SELECT upvotes, downvotes FROM danger_zones WHERE id = ?', (danger_zone_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception as e:
        conn.rollback()
        print(f"Database error in danger_zone.vote: {e}")
        return None
    finally:
        conn.close()

def add_comment(danger_zone_id, author, content):
    """Add a new comment for a danger zone."""
    return add_comment_to_target('danger_zone', danger_zone_id, author, content)

def get_comments(danger_zone_id):
    """Retrieve comments for a danger zone."""
    return get_comments_for_target('danger_zone', danger_zone_id)
