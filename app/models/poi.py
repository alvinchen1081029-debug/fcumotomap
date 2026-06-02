import math
from app.models import get_db_connection

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    使用 Haversine 公式計算地球表面兩點之間的經緯度球面距離 (單位：公里)。
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
        r = 6371.0  # 地球平均半徑 (公里)
        return c * r
    except Exception:
        return 99999.0

class POI:
    @staticmethod
    def create(data):
        """
        新增一筆 POI 記錄。
        
        Args:
            data (dict): 包含 name, type, latitude, longitude, address, phone, rating, description 的字典
        Returns:
            int: 新增記錄的 ID
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO pois (name, type, latitude, longitude, address, phone, rating, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    data.get('name'),
                    data.get('type'),
                    data.get('latitude'),
                    data.get('longitude'),
                    data.get('address'),
                    data.get('phone'),
                    data.get('rating', 0.0),
                    data.get('description')
                )
            )
            conn.commit()
            return cursor.lastrowid
        except Exception as e:
            conn.rollback()
            print(f"新增 POI 失敗: {e}")
            raise e
        finally:
            conn.close()

    @staticmethod
    def get_all():
        """
        取得所有 POI 記錄。
        
        Returns:
            list: POI 字典列表
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM pois ORDER BY id DESC")
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"取得所有 POI 失敗: {e}")
            return []
        finally:
            conn.close()

    @staticmethod
    def get_by_id(poi_id):
        """
        根據 ID 取得單筆 POI 記錄。
        
        Args:
            poi_id (int): POI 編號
        Returns:
            dict: POI 資料字典或 None
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM pois WHERE id = ?", (poi_id,))
            row = cursor.fetchone()
            return dict(row) if row else None
        except Exception as e:
            print(f"取得 POI (ID: {poi_id}) 失敗: {e}")
            return None
        finally:
            conn.close()

    @staticmethod
    def update(poi_id, data):
        """
        更新指定的 POI 記錄。
        
        Args:
            poi_id (int): POI 編號
            data (dict): 包含更新欄位的字典
        Returns:
            bool: 是否更新成功
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE pois
                SET name = ?, type = ?, latitude = ?, longitude = ?, address = ?, phone = ?, rating = ?, description = ?
                WHERE id = ?
                """,
                (
                    data.get('name'),
                    data.get('type'),
                    data.get('latitude'),
                    data.get('longitude'),
                    data.get('address'),
                    data.get('phone'),
                    data.get('rating'),
                    data.get('description'),
                    poi_id
                )
            )
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            print(f"更新 POI (ID: {poi_id}) 失敗: {e}")
            raise e
        finally:
            conn.close()

    @staticmethod
    def delete(poi_id):
        """
        刪除指定的 POI 記錄。
        
        Args:
            poi_id (int): POI 編號
        Returns:
            bool: 是否刪除成功
        """
        conn = get_db_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM pois WHERE id = ?", (poi_id,))
            conn.commit()
            return cursor.rowcount > 0
        except Exception as e:
            conn.rollback()
            print(f"刪除 POI (ID: {poi_id}) 失敗: {e}")
            raise e
        finally:
            conn.close()

    @staticmethod
    def get_nearby_pois(lat, lng, radius_km=2.0, poi_type=None):
        """
        搜尋指定經緯度周圍半徑範圍內的 POI。
        透過 sqlite3 的 create_function 功能註冊距離計算函數。
        
        Args:
            lat (float): 中心點緯度
            lng (float): 中心點經度
            radius_km (float): 搜尋半徑 (公里)
            poi_type (str): POI 類別，如 'shop', 'gas', 'charging', 'parking' 或 None/ 'all' 表示全部
        Returns:
            list: 包含距離資訊 (dist) 的 POI 字典列表，依距離由近到遠排序
        """
        conn = get_db_connection()
        # 註冊自訂 SQL 函數 distance
        conn.create_function("distance", 4, calculate_distance)
        try:
            cursor = conn.cursor()
            query = "SELECT *, distance(latitude, longitude, ?, ?) AS dist FROM pois"
            params = [lat, lng]
            
            # 過濾類型
            if poi_type and poi_type != 'all':
                query += " WHERE type = ?"
                params.append(poi_type)
            
            # 使用子查詢過濾距離，並由近到遠排序
            full_query = f"""
                SELECT * FROM (
                    {query}
                ) WHERE dist <= ?
                ORDER BY dist ASC
            """
            params.append(radius_km)
            
            cursor.execute(full_query, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except Exception as e:
            print(f"查詢附近 POI 失敗: {e}")
            return []
        finally:
            conn.close()
