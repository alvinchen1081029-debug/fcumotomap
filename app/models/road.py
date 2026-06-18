import json
from app.models import get_db_connection

def row_to_dict(row):
    """Convert SQLite Row to a dictionary and parse coordinates JSON string."""
    d = dict(row)
    if 'coordinates' in d and d['coordinates']:
        try:
            d['coordinates'] = json.loads(d['coordinates'])
        except Exception:
            pass
    return d

def get_all():
    """Retrieve all road segments from database."""
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM roads')
        rows = cursor.fetchall()
        return [row_to_dict(r) for r in rows]
    except Exception as e:
        print(f"Database error in road.get_all: {e}")
        return []
    finally:
        conn.close()

def get_filtered_roads(name=None, traffic_level=None, two_stage_turn=None):
    """Retrieve filtered road segments based on parameters."""
    conn = get_db_connection()
    query = 'SELECT * FROM roads WHERE 1=1'
    params = []
    
    if name:
        query += ' AND name LIKE ?'
        params.append(f'%{name}%')
        
    if traffic_level and traffic_level != 'all':
        query += ' AND traffic_level = ?'
        params.append(traffic_level)
        
    if two_stage_turn is not None and two_stage_turn != '':
        try:
            val = int(two_stage_turn)
            query += ' AND two_stage_turn = ?'
            params.append(val)
        except ValueError:
            pass
            
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [row_to_dict(r) for r in rows]
    except Exception as e:
        print(f"Database error in road.get_filtered_roads: {e}")
        return []
    finally:
        conn.close()
