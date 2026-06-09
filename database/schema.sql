-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Create roads table
CREATE TABLE IF NOT EXISTS roads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    traffic_level TEXT NOT NULL CHECK(traffic_level IN ('low', 'medium', 'high')),
    two_stage_turn INTEGER NOT NULL CHECK(two_stage_turn IN (0, 1)) DEFAULT 0,
    coordinates TEXT NOT NULL,
    description TEXT
);

-- Create danger zones table
CREATE TABLE IF NOT EXISTS danger_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5) DEFAULT 3,
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    danger_zone_id INTEGER NOT NULL,
    author TEXT NOT NULL DEFAULT '匿名騎士',
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (danger_zone_id) REFERENCES danger_zones(id) ON DELETE CASCADE
);

-- Delete existing records if any (to allow clean re-init)
DELETE FROM comments;
DELETE FROM danger_zones;
DELETE FROM roads;

-- Seed roads (FCU Feng Chia University area)
-- Coordinates represent lists of [lat, lng] representing the polyline path of each road.
INSERT INTO roads (id, name, traffic_level, two_stage_turn, coordinates, description) VALUES
(1, '福星路', 'medium', 1, '[[24.1782, 120.6402], [24.1798, 120.6447], [24.1812, 120.6488]]', '逢甲商圈核心幹道，平日傍晚與假日車流量大，部分路口強制兩段式左轉。'),
(2, '河南路二段', 'high', 1, '[[24.1812, 120.6488], [24.1755, 120.6465], [24.1712, 120.6446]]', '聯外重要交通要道，公車流量極高，上下班尖峰時間極易塞車（紫爆）。'),
(3, '逢甲路', 'high', 0, '[[24.1798, 120.6447], [24.1770, 120.6443], [24.1742, 120.6440]]', '逢甲大學正門口主要道路，學生人潮與機車潮混雜，尖峰時間擠塞。'),
(4, '文華路', 'medium', 0, '[[24.1756, 120.6460], [24.1788, 120.6465], [24.1830, 120.6475]]', '夜市主要人行與機車通道，傍晚過後實施管制，白天機車流量大且巷弄狹窄。'),
(5, '西屯路二段', 'high', 1, '[[24.1740, 120.6400], [24.1712, 120.6446], [24.1685, 120.6490]]', '連接市區與沙鹿之主要幹道，路幅較窄，雙向機車流量大，下雨天易打滑。');

-- Seed danger zones
INSERT INTO danger_zones (id, latitude, longitude, title, description, rating, upvotes, downvotes, created_at) VALUES
(1, 24.1798, 120.6465, '福星文華路口視線死角與違停', '此路口人潮與攤販眾多，常有小黃或貨車違規臨停，導致後方機車右轉時產生極大視線死角。且路面斑馬線下雨天摩擦力低，易打滑。', 4, 15, 1, '2026-06-01 12:00:00'),
(2, 24.1768, 120.6470, '河南路公車搶道與路面坑洞', '河南路公車班次頻繁，常有公車靠站時擠壓右側機車道之情況。且此處路段路面有數處修補坑洞，下雨積水時對新手騎士極為危險。', 5, 24, 2, '2026-06-01 14:30:00'),
(3, 24.1798, 120.6447, '逢甲福星路口待轉區擁擠', '逢甲大學正門口的大型十字路口，上下課時間待轉機車非常多，但劃設的機車待轉區空間不足，車潮常溢出至快車道與斑馬線。', 3, 18, 0, '2026-06-02 08:15:00');

-- Seed comments
INSERT INTO comments (id, danger_zone_id, author, content, created_at) VALUES
(1, 1, '逢甲小飛俠', '上禮拜經過真的差點撞到違停走出來的行人，大家轉彎一定要慢！', '2026-06-01 12:15:00'),
(2, 1, '乖乖騎車大學生', '那邊的黃線基本上形同虛設，警察要多開單啦！不然早晚出大事。', '2026-06-01 13:02:00'),
(3, 2, '通勤族阿明', '這段路抖到手麻，避震器快壞了，下雨天騎過去超恐怖！', '2026-06-01 15:00:00'),
(4, 2, '逢甲大一新生', '公車靠站時完全把機車道擋住，只能切到左側汽車道，好幾次差點被後車追撞...', '2026-06-01 16:22:00'),
(5, 3, 'FCU騎士', '待轉區真的很小，每次都停到斑馬線上，行人都在看我們。', '2026-06-02 09:10:00'),
(6, 3, '機車即正義', '其實這個路口應該直接開放機車左轉，強迫待轉反而更危險。', '2026-06-02 10:05:00');
