import os
import sqlite3
from app.models.intersection import create_intersection
from app import init_db, app

def seed_data():
    print("Starting database seeding...")
    
    # Ensure database is initialized first
    db_path = app.config['DATABASE']
    if not os.path.exists(db_path):
        print("Database file does not exist. Initializing database schema...")
        init_db()
        print("Database schema initialized.")
    else:
        print("Database file exists. Running schema script anyway to make sure table exists...")
        init_db()

    # Sample intersections around Feng Chia University
    seed_items = [
        {
            "name": "福星路與逢甲路口",
            "latitude": 24.178550,
            "longitude": 120.645480,
            "requires_two_stage": 1,
            "description": "逢甲夜市核心路口。福星路雙向車流量大，機車左轉逢甲路時強制使用兩段式左轉，待轉區設於路口角落。"
        },
        {
            "name": "福星路與河南路口",
            "latitude": 24.174810,
            "longitude": 120.648920,
            "requires_two_stage": 1,
            "description": "重要交通樞紐。雙向多線道，機車於此路口所有方向左轉皆強制兩段式左轉，尖峰時刻待轉區經常客滿，需注意安全。"
        },
        {
            "name": "西安街與文華路口",
            "latitude": 24.181200,
            "longitude": 120.645300,
            "requires_two_stage": 0,
            "description": "文華路側門路口。屬於學區內較窄街道，無兩段式左轉規定，機車可直接左轉，但常有行人通行，請減速慢行。"
        },
        {
            "name": "逢甲路與學術路口 (逢甲大學正門前)",
            "latitude": 24.178920,
            "longitude": 120.646580,
            "requires_two_stage": 0,
            "description": "大學正門前路口。設有機車專用左轉燈號，機車可於最內側車道或專用道直接左轉進入校園，請依專用綠燈號誌行駛。"
        },
        {
            "name": "西屯路與逢甲路口",
            "latitude": 24.176210,
            "longitude": 120.645150,
            "requires_two_stage": 1,
            "description": "西屯路路幅較窄但車流多，機車左轉逢甲路需兩段式左轉，待轉區空間有限，注意不要超出待轉格。"
        }
    ]

    # Insert mock data
    connection = sqlite3.connect(db_path)
    cursor = connection.cursor()
    # Check if we already have data to avoid duplicate seeding
    cursor.execute("SELECT COUNT(*) FROM intersections")
    count = cursor.fetchone()[0]
    connection.close()

    if count > 0:
        print(f"Database already contains {count} intersections. Skipping seeding to prevent duplicate data.")
        return

    for item in seed_items:
        new_id = create_intersection(
            name=item["name"],
            latitude=item["latitude"],
            longitude=item["longitude"],
            requires_two_stage=item["requires_two_stage"],
            description=item["description"]
        )
        if new_id:
            print(f"Seeded: {item['name']} (ID: {new_id})")
        else:
            print(f"Failed to seed: {item['name']}")

    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_data()
