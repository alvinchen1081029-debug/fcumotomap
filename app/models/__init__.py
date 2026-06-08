import sqlite3
import os

# 定義 SQLite 資料庫檔案路徑，放在專案根目錄的 instance/ 目錄下
DATABASE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'instance', 'database.db'))

def get_db_connection():
    """
    建立並回傳 SQLite 資料庫連線。
    設定 row_factory 為 sqlite3.Row 以便使用欄位名稱讀取資料。
    
    Returns:
        sqlite3.Connection: 資料庫連線物件
    """
    try:
        # 確保 instance 目錄存在
        os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        # 啟用外鍵支援
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn
    except sqlite3.Error as e:
        print(f"資料庫連線失敗: {e}")
        raise e
