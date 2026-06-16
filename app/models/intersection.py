import os
import sqlite3
from flask import current_app, has_app_context

# Fallback path for command-line scripts (like seed.py)
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

def create_intersection(name, latitude, longitude, requires_two_stage, description=""):
    """
    Creates a new intersection record in the database.
    
    Parameters:
        name (str): Name of the intersection.
        latitude (float): Latitude of the intersection.
        longitude (float): Longitude of the intersection.
        requires_two_stage (int): 1 if two-stage left turn is required, 0 otherwise.
        description (str, optional): Description of the rules.
        
    Returns:
        int: The ID of the newly created intersection, or None if failed.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            '''
            INSERT INTO intersections (name, latitude, longitude, requires_two_stage, description)
            VALUES (?, ?, ?, ?, ?)
            ''',
            (name, float(latitude), float(longitude), int(requires_two_stage), description)
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.Error as e:
        print(f"Database error in create_intersection: {e}")
        return None
    except ValueError as e:
        print(f"Validation error in create_intersection: {e}")
        return None
    finally:
        if conn:
            conn.close()

def get_all_intersections():
    """
    Retrieves all intersections from the database.
    
    Returns:
        list of dict: List containing intersection dictionaries.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM intersections ORDER BY id DESC')
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    except sqlite3.Error as e:
        print(f"Database error in get_all_intersections: {e}")
        return []
    finally:
        if conn:
            conn.close()

def get_intersection_by_id(intersection_id):
    """
    Retrieves a single intersection by its ID.
    
    Parameters:
        intersection_id (int): The ID of the intersection.
        
    Returns:
        dict: The intersection dictionary, or None if not found/error.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM intersections WHERE id = ?', (intersection_id,))
        row = cursor.fetchone()
        return dict(row) if row else None
    except sqlite3.Error as e:
        print(f"Database error in get_intersection_by_id: {e}")
        return None
    finally:
        if conn:
            conn.close()

def update_intersection(intersection_id, name, latitude, longitude, requires_two_stage, description=""):
    """
    Updates an existing intersection's details.
    
    Parameters:
        intersection_id (int): The ID of the intersection.
        name (str): Name of the intersection.
        latitude (float): Latitude.
        longitude (float): Longitude.
        requires_two_stage (int): 1 or 0.
        description (str, optional): Description of the rules.
        
    Returns:
        bool: True if successful, False otherwise.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            '''
            UPDATE intersections
            SET name = ?, latitude = ?, longitude = ?, requires_two_stage = ?, description = ?
            WHERE id = ?
            ''',
            (name, float(latitude), float(longitude), int(requires_two_stage), description, int(intersection_id))
        )
        conn.commit()
        return cursor.rowcount > 0
    except sqlite3.Error as e:
        print(f"Database error in update_intersection: {e}")
        return False
    except ValueError as e:
        print(f"Validation error in update_intersection: {e}")
        return False
    finally:
        if conn:
            conn.close()

def delete_intersection(intersection_id):
    """
    Deletes an intersection by its ID.
    
    Parameters:
        intersection_id (int): The ID of the intersection.
        
    Returns:
        bool: True if successful, False otherwise.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM intersections WHERE id = ?', (int(intersection_id),))
        conn.commit()
        return cursor.rowcount > 0
    except sqlite3.Error as e:
        print(f"Database error in delete_intersection: {e}")
        return False
    except ValueError as e:
        print(f"Validation error in delete_intersection: {e}")
        return False
    finally:
        if conn:
            conn.close()
