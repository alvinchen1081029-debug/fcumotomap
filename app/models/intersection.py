import sqlite3
from datetime import datetime
from app.models import get_db_connection

def create_intersection(name, latitude, longitude, requires_two_stage=1, description="", 
                        waiting_area_size="中等", crowd_level="中等", safety_rating=3, reporter="系統管理員"):
    """
    Creates a new intersection record in the database.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        reporter = reporter.strip() if (reporter and reporter.strip()) else '系統管理員'
        
        cursor.execute(
            '''
            INSERT INTO intersections (name, latitude, longitude, requires_two_stage, description, 
                                      upvotes, downvotes, waiting_area_size, crowd_level, safety_rating, 
                                      reporter, created_at)
            VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)
            ''',
            (name, float(latitude), float(longitude), int(requires_two_stage), description,
             waiting_area_size, crowd_level, int(safety_rating), reporter, created_at)
        )
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        print(f"Database error in create_intersection: {e}")
        return None
    finally:
        if conn:
            conn.close()

def get_all_intersections():
    """
    Retrieves all intersections from the database with comments attached.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM intersections ORDER BY id DESC')
        rows = cursor.fetchall()
        intersections = [dict(row) for row in rows]
        
        # Attach comments
        from app.models.danger_zone import get_comments_for_target
        for i in intersections:
            i['comments'] = get_comments_for_target('intersection', i['id'])
            
        return intersections
    except Exception as e:
        print(f"Database error in get_all_intersections: {e}")
        return []
    finally:
        if conn:
            conn.close()

def get_intersection_by_id(intersection_id):
    """
    Retrieves a single intersection by its ID.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM intersections WHERE id = ?', (int(intersection_id),))
        row = cursor.fetchone()
        if row:
            intersection = dict(row)
            from app.models.danger_zone import get_comments_for_target
            intersection['comments'] = get_comments_for_target('intersection', intersection_id)
            return intersection
        return None
    except Exception as e:
        print(f"Database error in get_intersection_by_id: {e}")
        return None
    finally:
        if conn:
            conn.close()

def update_intersection(intersection_id, name, latitude, longitude, requires_two_stage, description="", 
                        waiting_area_size="中等", crowd_level="中等", safety_rating=3):
    """
    Updates an existing intersection's details.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            '''
            UPDATE intersections
            SET name = ?, latitude = ?, longitude = ?, requires_two_stage = ?, description = ?,
                waiting_area_size = ?, crowd_level = ?, safety_rating = ?
            WHERE id = ?
            ''',
            (name, float(latitude), float(longitude), int(requires_two_stage), description,
             waiting_area_size, crowd_level, int(safety_rating), int(intersection_id))
        )
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Database error in update_intersection: {e}")
        return False
    finally:
        if conn:
            conn.close()

def delete_intersection(intersection_id):
    """
    Deletes an intersection by its ID.
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM intersections WHERE id = ?', (int(intersection_id),))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        print(f"Database error in delete_intersection: {e}")
        return False
    finally:
        if conn:
            conn.close()

def vote(intersection_id, vote_type):
    """Increment upvotes or downvotes for an intersection."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        if vote_type == 'upvote':
            cursor.execute('UPDATE intersections SET upvotes = upvotes + 1 WHERE id = ?', (int(intersection_id),))
        elif vote_type == 'downvote':
            cursor.execute('UPDATE intersections SET downvotes = downvotes + 1 WHERE id = ?', (int(intersection_id),))
        else:
            return None
        
        conn.commit()
        
        # Get updated counts
        cursor.execute('SELECT upvotes, downvotes FROM intersections WHERE id = ?', (int(intersection_id),))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception as e:
        print(f"Database error in intersection.vote: {e}")
        return None
    finally:
        if conn:
            conn.close()

def add_comment(intersection_id, author, content):
    """Add comment on intersection."""
    from app.models.danger_zone import add_comment_to_target
    return add_comment_to_target('intersection', intersection_id, author, content)

def get_comments(intersection_id):
    """Retrieve comments for intersection."""
    from app.models.danger_zone import get_comments_for_target
    return get_comments_for_target('intersection', intersection_id)
