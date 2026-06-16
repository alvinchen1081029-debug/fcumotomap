import math
from datetime import datetime
from app.models import get_db_connection

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculates the spherical distance between two coordinates in kilometers using Haversine formula.
    """
    try:
        if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
            return 99999.0
        
        rad_lat1 = math.radians(float(lat1))
        rad_lon1 = math.radians(float(lon1))
        rad_lat2 = math.radians(float(lat2))
        rad_lon2 = math.radians(float(lon2))
        
        dlat = rad_lat2 - rad_lat1
        dlon = rad_lon2 - rad_lon1
        
        a = math.sin(dlat / 2)**2 + math.cos(rad_lat1) * math.cos(rad_lat2) * math.sin(dlon / 2)**2
        c = 2 * math.asin(math.sqrt(a))
        r = 6371.0  # Earth average radius in km
        return c * r
    except Exception:
        return 99999.0

def create(name, type, latitude, longitude, address="", phone="", rating=0.0, description="",
           toilet_type=None, has_paper=0, is_accessible=0, motorcycle_friendly=0, hours=None, 
           services=None, reporter="系統管理員"):
    """
    Create a new POI record (toilet, gas station, or parking lot).
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        created_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        reporter = reporter.strip() if (reporter and reporter.strip()) else '系統管理員'
        
        cursor.execute(
            """
            INSERT INTO pois (name, type, latitude, longitude, address, phone, rating, description, 
                             upvotes, downvotes, toilet_type, has_paper, is_accessible, 
                             motorcycle_friendly, hours, services, reporter, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                type,
                float(latitude),
                float(longitude),
                address,
                phone,
                float(rating),
                description,
                toilet_type,
                int(has_paper),
                int(is_accessible),
                int(motorcycle_friendly),
                hours,
                services,
                reporter,
                created_at
            )
        )
        conn.commit()
        return cursor.lastrowid
    except Exception as e:
        conn.rollback()
        print(f"Error creating POI: {e}")
        return None
    finally:
        conn.close()

def get_all():
    """
    Retrieve all POI records with comments attached.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM pois ORDER BY id DESC")
        rows = cursor.fetchall()
        pois = [dict(row) for row in rows]
        
        # Attach comments
        from app.models.danger_zone import get_comments_for_target
        for p in pois:
            p['comments'] = get_comments_for_target('poi', p['id'])
            
        return pois
    except Exception as e:
        print(f"Error getting all POIs: {e}")
        return []
    finally:
        conn.close()

def get_by_id(poi_id):
    """
    Retrieve a single POI by ID with comments attached.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM pois WHERE id = ?", (int(poi_id),))
        row = cursor.fetchone()
        if row:
            poi = dict(row)
            from app.models.danger_zone import get_comments_for_target
            poi['comments'] = get_comments_for_target('poi', poi_id)
            return poi
        return None
    except Exception as e:
        print(f"Error getting POI by ID {poi_id}: {e}")
        return None
    finally:
        conn.close()

def update(poi_id, data):
    """
    Update POI record.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        # Dyn update fields
        keys = []
        values = []
        for k, v in data.items():
            keys.append(f"{k} = ?")
            values.append(v)
        values.append(int(poi_id))
        
        query = f"UPDATE pois SET {', '.join(keys)} WHERE id = ?"
        cursor.execute(query, values)
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print(f"Error updating POI {poi_id}: {e}")
        return False
    finally:
        conn.close()

def delete(poi_id):
    """
    Delete POI record.
    """
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM pois WHERE id = ?", (int(poi_id),))
        conn.commit()
        return cursor.rowcount > 0
    except Exception as e:
        conn.rollback()
        print(f"Error deleting POI {poi_id}: {e}")
        return False
    finally:
        conn.close()

def vote(poi_id, vote_type):
    """Increment upvotes or downvotes for a POI and return updated counts."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        if vote_type == 'upvote':
            cursor.execute('UPDATE pois SET upvotes = upvotes + 1 WHERE id = ?', (int(poi_id),))
        elif vote_type == 'downvote':
            cursor.execute('UPDATE pois SET downvotes = downvotes + 1 WHERE id = ?', (int(poi_id),))
        else:
            return None
        
        conn.commit()
        
        # Get updated counts
        cursor.execute('SELECT upvotes, downvotes FROM pois WHERE id = ?', (int(poi_id),))
        row = cursor.fetchone()
        return dict(row) if row else None
    except Exception as e:
        conn.rollback()
        print(f"Error voting on POI {poi_id}: {e}")
        return None
    finally:
        conn.close()

def get_nearby_pois(lat, lng, radius_km=2.0, poi_type=None):
    """
    Search for POIs within radius_km.
    """
    conn = get_db_connection()
    conn.create_function("distance", 4, calculate_distance)
    try:
        cursor = conn.cursor()
        query = "SELECT *, distance(latitude, longitude, ?, ?) AS dist FROM pois"
        params = [float(lat), float(lng)]
        
        if poi_type and poi_type != 'all':
            query += " WHERE type = ?"
            params.append(poi_type)
            
        full_query = f"""
            SELECT * FROM (
                {query}
            ) WHERE dist <= ?
            ORDER BY dist ASC
        """
        params.append(float(radius_km))
        
        cursor.execute(full_query, params)
        rows = cursor.fetchall()
        pois = [dict(row) for row in rows]
        
        # Attach comments
        from app.models.danger_zone import get_comments_for_target
        for p in pois:
            p['comments'] = get_comments_for_target('poi', p['id'])
            
        return pois
    except Exception as e:
        print(f"Error finding nearby POIs: {e}")
        return []
    finally:
        conn.close()

def add_comment(poi_id, author, content):
    """Add comment to POI."""
    from app.models.danger_zone import add_comment_to_target
    return add_comment_to_target('poi', poi_id, author, content)

def get_comments(poi_id):
    """Retrieve comments for POI."""
    from app.models.danger_zone import get_comments_for_target
    return get_comments_for_target('poi', poi_id)
