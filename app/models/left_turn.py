from app.models import get_db_connection
from app.models.poi import calculate_distance

class LeftTurn:
    @staticmethod
    def create(data):
        """
        新增一筆兩段式左轉提示。
        
        Args:
            data (dict): 包含 location_name, latitude, longitude, description
        Returns:
            int: 新增記錄的 ID
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO left_turns (location_name, latitude, longitude, description)
                VALUES (?, ?, ?, ?)
                """,
                (
                    data.get('location_name'),
                    data.get('latitude'),
                    data.get('longitude'),
                    data.get('description')
                )
            )
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            conn.rollback()
            print(f"新增兩段式左轉路口失敗: {e}")
            raise e
        finally:
            conn.close()

    @staticmethod
    def get_all():
        """
        取得所有標記的兩段式左轉路口。
        
        Returns:
            list: 左轉提示路口字典列表
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM left_turns ORDER BY id DESC")
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"取得兩段式左轉路口失敗: {e}")
            return []
        finally:
            conn.close()

    @staticmethod
    def get_by_id(lt_id):
        """
        根據 ID 取得單筆兩段式左轉路口資料。
        
        Args:
            lt_id (int): 記錄編號
        Returns:
            dict: 兩段式左轉路口資料字典或 None
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM left_turns WHERE id = ?", (lt_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        except Exception as e:
            print(f"取得兩段式左轉 (ID: {lt_id}) 失敗: {e}")
            return None
        finally:
            conn.close()

    @staticmethod
    def update(lt_id, data):
        """
        更新指定的兩段式左轉路口資料。
        
        Args:
            lt_id (int): 記錄編號
            data (dict): 更新欄位
        Returns:
            bool: 是否更新成功
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE left_turns
                SET location_name = ?, latitude = ?, longitude = ?, description = ?
                WHERE id = ?
                """,
                (
                    data.get('location_name'),
                    data.get('latitude'),
                    data.get('longitude'),
                    data.get('description'),
                    lt_id
                )
            )
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            print(f"更新兩段式左轉 (ID: {lt_id}) 失敗: {e}")
            raise e
        finally:
            conn.close()

    @staticmethod
    def delete(lt_id):
        """
        刪除指定的兩段式左轉路口。
        
        Args:
            lt_id (int): 記錄編號
        Returns:
            bool: 是否刪除成功
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM left_turns WHERE id = ?", (lt_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            print(f"刪除兩段式左轉 (ID: {lt_id}) 失敗: {e}")
            raise e
        finally:
            conn.close()

    @staticmethod
    def get_nearby_left_turns(lat, lng, radius_km=2.0):
        """
        搜尋指定經緯度周圍的兩段式左轉路口。
        
        Args:
            lat (float): 中心點緯度
            lng (float): 中心點經度
            radius_km (float): 搜尋半徑 (公里)
        Returns:
            list: 包含距離資訊 (dist) 的兩段式左轉路口字典列表，由近到遠排序
        """
        conn = get_db_connection()
        conn.create_function("distance", 4, calculate_distance)
        try:
            cursor = conn.cursor()
            query = """
                SELECT * FROM (
                    SELECT *, distance(latitude, longitude, ?, ?) AS dist 
                    FROM left_turns
                ) WHERE dist <= ?
                ORDER BY dist ASC
            """
            cursor.execute(query, (lat, lng, radius_km))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"查詢附近兩段式左轉路口失敗: {e}")
            return []
        finally:
            conn.close()
