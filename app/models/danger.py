from app.models import get_db_connection
from app.models.poi import calculate_distance

class DangerousRoad:
    @staticmethod
    def create(data):
        """
        新增一筆危險路段回報。
        
        Args:
            data (dict): 包含 road_name, latitude, longitude, danger_level, description, user_id
        Returns:
            int: 新增記錄的 ID
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO dangerous_roads (road_name, latitude, longitude, danger_level, description, user_id)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    data.get('road_name'),
                    data.get('latitude'),
                    data.get('longitude'),
                    data.get('danger_level'),
                    data.get('description'),
                    data.get('user_id')
                )
            )
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            conn.rollback()
            print(f"新增危險路段失敗: {e}")
            raise e
        finally:
            conn.close()

    @staticmethod
    def get_all():
        """
        取得所有危險路段。
        
        Returns:
            list: 危險路段字典列表
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM dangerous_roads ORDER BY id DESC")
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"取得所有危險路段失敗: {e}")
            return []
        finally:
            conn.close()

    @staticmethod
    def get_by_id(road_id):
        """
        根據 ID 取得單筆危險路段資料。
        
        Args:
            road_id (int): 記錄編號
        Returns:
            dict: 危險路段資料字典或 None
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM dangerous_roads WHERE id = ?", (road_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        except Exception as e:
            print(f"取得危險路段 (ID: {road_id}) 失敗: {e}")
            return None
        finally:
            conn.close()

    @staticmethod
    def update(road_id, data):
        """
        更新指定的危險路段資料。
        
        Args:
            road_id (int): 記錄編號
            data (dict): 更新欄位
        Returns:
            bool: 是否更新成功
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE dangerous_roads
                SET road_name = ?, latitude = ?, longitude = ?, danger_level = ?, description = ?, user_id = ?
                WHERE id = ?
                """,
                (
                    data.get('road_name'),
                    data.get('latitude'),
                    data.get('longitude'),
                    data.get('danger_level'),
                    data.get('description'),
                    data.get('user_id'),
                    road_id
                )
            )
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            print(f"更新危險路段 (ID: {road_id}) 失敗: {e}")
            raise e
        finally:
            conn.close()

    @staticmethod
    def delete(road_id):
        """
        刪除指定的危險路段。
        
        Args:
            road_id (int): 記錄編號
        Returns:
            bool: 是否刪除成功
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM dangerous_roads WHERE id = ?", (road_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            print(f"刪除危險路段 (ID: {road_id}) 失敗: {e}")
            raise e
        finally:
            conn.close()

    @staticmethod
    def get_nearby_dangers(lat, lng, radius_km=2.0):
        """
        搜尋指定經緯度周圍的危險路段。
        
        Args:
            lat (float): 中心點緯度
            lng (float): 中心點經度
            radius_km (float): 搜尋半徑 (公里)
        Returns:
            list: 包含距離資訊 (dist) 的危險路段字典列表，由近到遠排序
        """
        conn = get_db_connection()
        conn.create_function("distance", 4, calculate_distance)
        try:
            cursor = conn.cursor()
            query = """
                SELECT * FROM (
                    SELECT *, distance(latitude, longitude, ?, ?) AS dist 
                    FROM dangerous_roads
                ) WHERE dist <= ?
                ORDER BY dist ASC
            """
            cursor.execute(query, (lat, lng, radius_km))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"查詢附近危險路段失敗: {e}")
            return []
        finally:
            conn.close()
