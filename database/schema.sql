-- Enable foreign key support
PRAGMA foreign_keys = ON;

-- Drop existing tables to allow clean re-init
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS pois;
DROP TABLE IF EXISTS intersections;
DROP TABLE IF EXISTS danger_zones;
DROP TABLE IF EXISTS roads;

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
    hazard_type TEXT,
    reporter TEXT NOT NULL DEFAULT '匿名騎士',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Create intersections table
CREATE TABLE IF NOT EXISTS intersections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    requires_two_stage INTEGER NOT NULL DEFAULT 1, -- 1: 需兩段式左轉, 0: 免兩段式左轉
    description TEXT,
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    waiting_area_size TEXT,
    crowd_level TEXT,
    safety_rating INTEGER DEFAULT 3,
    reporter TEXT NOT NULL DEFAULT '系統管理員',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Create pois table
CREATE TABLE IF NOT EXISTS pois (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'gas_station', 'parking_lot', 'toilet'
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    address TEXT,
    phone TEXT,
    rating REAL DEFAULT 0.0, -- Cleanliness for toilets, standard rating for others
    description TEXT,
    upvotes INTEGER NOT NULL DEFAULT 0,
    downvotes INTEGER NOT NULL DEFAULT 0,
    -- Toilet specific fields
    toilet_type TEXT,
    has_paper INTEGER DEFAULT 0, -- 0 or 1
    is_accessible INTEGER DEFAULT 0, -- 0 or 1
    motorcycle_friendly INTEGER DEFAULT 0, -- 0 or 1
    hours TEXT,
    -- Gas station & Parking lot specific fields (as JSON arrays)
    services TEXT,
    reporter TEXT NOT NULL DEFAULT '系統管理員',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Create polymorphic comments table
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL, -- 'danger_zone', 'intersection', 'poi'
    target_id INTEGER NOT NULL,
    author TEXT NOT NULL DEFAULT '匿名騎士',
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- ==========================================
-- SEED DATA
-- ==========================================

-- Seed roads (FCU Feng Chia University area)
INSERT INTO roads (id, name, traffic_level, two_stage_turn, coordinates, description) VALUES
(1, '福星路', 'medium', 1, '[[24.1782, 120.6402], [24.1798, 120.6447], [24.1812, 120.6488]]', '逢甲商圈核心幹道，平日傍晚與假日車流量大，部分路口強制兩段式左轉。'),
(2, '河南路二段', 'high', 1, '[[24.1812, 120.6488], [24.1755, 120.6465], [24.1712, 120.6446]]', '聯外重要交通要道，公車流量極高，上下班尖峰時間極易塞車（紫爆）。'),
(3, '逢甲路', 'high', 0, '[[24.1798, 120.6447], [24.1770, 120.6443], [24.1742, 120.6440]]', '逢甲大學正門口主要道路，學生人潮與機車潮混雜，尖峰時間擠塞。'),
(4, '文華路', 'medium', 0, '[[24.1756, 120.6460], [24.1788, 120.6465], [24.1830, 120.6475]]', '夜市主要人行與機車通道，傍晚過後實施管制，白天機車流量大且巷弄狹窄。'),
(5, '西屯路二段', 'high', 1, '[[24.1740, 120.6400], [24.1712, 120.6446], [24.1685, 120.6490]]', '連接市區與沙鹿之主要幹道，路幅較窄，雙向機車流量大，下雨天易打滑。');

-- Seed danger zones
INSERT INTO danger_zones (id, latitude, longitude, title, description, rating, upvotes, downvotes, hazard_type, reporter, created_at) VALUES
(1, 24.17865, 120.64655, '逢甲路與福星路口 (福星路麥當勞旁)', '此路口緊鄰麥當勞與商圈核心，上下學與夜市尖峰時間人流極大。常有大量汽機車違規臨停在紅線上購買餐點，導致機車右轉時視線嚴重受阻。且行人常闖紅燈或未走斑馬線，機車極易與行人或轉彎車輛發生擦撞。', 4, 42, 3, 'illegal_parking', '逢甲小鋼炮', '2026-05-24 18:30:00'),
(2, 24.17700, 120.64820, '文華路 (逢甲夜市核心路段)', '文華路為逢甲夜市主要街道，傍晚後人潮洶湧。部分時段雖有車輛管制，但仍常有機車進入，造成人車極度交織。路面狹窄且常有攤販凸出，路面也因油污容易打滑，下雨天尤為危險。', 3, 18, 1, 'crowded', '夜市路過客', '2026-05-23 20:45:00'),
(3, 24.17510, 120.65350, '河南路二段與福星路口', '此路口車流量極大，為連接水湳與逢甲地區的重要樞紐。河南路直行車速極快，且福星路右轉河南路的機車常與河南路直行慢車道之機車交織。此外，尖峰時段左轉車輛常未禮讓直行車，是發生擦撞事故的極高危險路段。', 5, 67, 4, 'fast_lane_merge', '土木系大三', '2026-05-22 17:40:00'),
(4, 24.17420, 120.64530, '西屯路二段與逢甲路口', '逢甲路往西屯路方向，機車兩段式左轉待轉區設計過於狹小且位置尷尬。尖峰時間等待左轉的機車常多到溢出至西屯路直行車道，直接暴露在直行車流的危險中。且西屯路路幅較窄，大型公車切入時常逼近機車。', 5, 55, 2, 'bad_design', '資工系學長', '2026-05-21 12:15:00'),
(5, 24.17935, 120.65080, '逢大路與逢甲大學側門口', '逢甲大學側門是許多學生進出學校的重要通道。逢大路段路面寬敞，導致車速普遍偏快。然而此處常有外送機車為了接單或送餐突然煞停、迴轉，或是學生突然從側門衝出，行車安全反應不及極易追撞。', 3, 29, 0, 'sudden_stop', '外送小哥', '2026-05-24 14:10:00');

-- Seed intersections
INSERT INTO intersections (id, name, latitude, longitude, requires_two_stage, description, upvotes, downvotes, waiting_area_size, crowd_level, safety_rating, reporter, created_at) VALUES
(101, '逢甲路與福星路口 (麥當勞旁)', 24.17865, 120.64655, 1, '逢甲路往福星路方向需要兩段式左轉。待轉區格子畫得非常窄小，只要下課尖峰有5台以上機車，待轉區就會直接滿出來到福星路的直行車流中，騎士安全堪憂！建議尖峰時間放慢車速，盡量靠右停靠。', 38, 2, '狹小 (尖峰易溢出至車道)', '極高 (下課及夜市時段擁擠)', 2, '資工二乙', '2026-05-28 12:10:00'),
(102, '河南路二段與福星路口 (重要幹道樞紐)', 24.17510, 120.65350, 1, '由福星路左轉河南路二段必須兩段式左轉。因河南路是雙向多線道且車速極快，在待轉區等待時會直接迎面承受大流量的右轉與直行車流。綠燈起步時，左轉車輛常與直行車流交織，是極易發生擦撞的交界路口。', 72, 1, '中等 (但車流龐大，仍嫌不足)', '極高 (通勤尖峰車滿為患)', 1, '交通守護星', '2026-05-27 08:30:00'),
(103, '西屯路二段與逢甲路口 (狹窄路口待轉)', 24.17420, 120.64530, 1, '逢甲路左轉西屯路二段必須兩段式左轉。待轉區空間被壓縮在狹窄的路肩，且路口有公車站牌與違停。一旦有大型公車經過，公車車身會非常貼近待轉格，極具壓迫感。強烈建議新手骑士要特別注意車身間距。', 49, 3, '極度狹小 (約僅容納3台機車)', '高 (學生與買便當人潮多)', 2, '機車難民', '2026-05-26 18:00:00'),
(104, '河南路二段與西屯路二段路口 (大型多岔路口)', 24.17240, 120.64890, 1, '此路口為大型四岔路口，往西屯路或河南路皆有清楚的兩段式左轉標誌。待轉格空間非常充沛且退縮在安全島旁，能有效避開直行車流。唯獨需注意黃燈亮起時，搶黃燈的直行車速極快，起步時應確認完全紅燈後再前行。', 21, 0, '寬敞 (標線相對清晰)', '中等 (路幅較大)', 4, '機車大叔', '2026-05-25 15:40:00'),
(105, '福星北路與黎明路三段路口 (大學城外圍幹道)', 24.18340, 120.64810, 1, '黎明路三段左轉福星北路（往逢甲大學後門/僑光科大方向）。待轉區位於馬路正中間延伸處，後方完全沒有任何防撞石柱或安全島遮蔽，機車騎士暴露於黎明路疾駛而來的直行車流前。夜市結束後或深夜車速快，需特別警惕後方來車。', 35, 1, '中等 (無安全島遮蔽)', '高 (往僑光、中科車流大)', 3, '僑光機車俠', '2026-05-24 10:15:00');

-- Seed POIs (Toilets, Gas stations, Parking lots)
INSERT INTO pois (id, name, type, latitude, longitude, address, phone, rating, description, upvotes, downvotes, toilet_type, has_paper, is_accessible, motorcycle_friendly, hours, services, reporter, created_at) VALUES
(201, '中油福星加油站', 'gas_station', 24.1798, 120.6402, '台中市西屯區福星路100號', '04-12345678', 5.0, '提供機車專用加油車道，尖峰時間有專人引導。', 12, 0, NULL, 0, 0, 0, '24 小時營業', '["機車加油", "自助加油", "輪胎打氣", "公廁"]', '官方認證設施', '2026-06-01 12:00:00'),
(202, '台塑河南加油站', 'gas_station', 24.1712, 120.6446, '台中市西屯區河南路二段500號', '04-87654321', 4.5, '站區寬敞，機車加油動線流暢。', 8, 0, NULL, 0, 0, 0, '07:00 - 23:00', '["機車加油", "自助加油", "公廁"]', '官方認證設施', '2026-06-01 12:00:00'),
(301, '逢甲大學福星停車場', 'parking_lot', 24.1812, 120.6488, '台中市西屯區福星路與福星北路口', '', 4.8, '逢甲大學學生專用機車停車場，持學生證感應進出。', 31, 1, NULL, 0, 0, 0, '24 小時開放', '["機車停車", "遮雨棚", "電子收費"]', '官方認證設施', '2026-06-01 12:00:00'),
(302, '福星機車收費停車場', 'parking_lot', 24.1770, 120.6443, '台中市西屯區逢甲路與福星路口旁', '', 4.0, '臨近逢甲夜市核心，提供計次機車停車，每次20元。', 15, 0, NULL, 0, 0, 0, '15:00 - 24:00', '["機車停車", "計次收費"]', '官方認證設施', '2026-06-01 12:00:00'),
(401, '逢甲大學圖書館公廁', 'toilet', 24.1792, 120.6485, '圖書館一樓', '', 4.0, '圖書館一樓公廁，環境非常乾淨，校外人士可換證進入使用。校區周邊有機車格可停放。', 12, 0, 'campus', 1, 1, 1, '08:00 - 22:00', NULL, '系統管理員', '2026-06-01 12:00:00'),
(402, '中油福星加油站公廁', 'toilet', 24.1798, 120.6402, '加油站旁', '', 3.0, '加油站附設公廁，24小時開放，對深夜騎車在外的人非常方便。加油站旁有空地可暫停機車。', 24, 1, 'gas_station', 1, 0, 1, '24 小時開放', NULL, '深夜外送員', '2026-06-02 02:30:00');

-- Seed polymorphic comments
INSERT INTO comments (id, target_type, target_id, author, content, created_at) VALUES
-- Danger Zone Comments
(1, 'danger_zone', 1, '逢甲小鋼炮', '這裡每天晚上下課根本是地獄！公車、計程車、違停全部塞在一起，騎機車要超小心。', '2026-05-24 18:35:00'),
(2, 'danger_zone', 1, '安全第一', '建議晚上要過這個路口的人，速度降到30以下，隨時準備煞車！', '2026-05-25 10:15:00'),
(3, 'danger_zone', 1, 'FCU_Rider', '違停真的該檢舉，每次要右轉都被擋住視線，差點撞到過馬路的人。', '2026-05-26 12:00:00'),
(4, 'danger_zone', 2, '夜市路過客', '晚上騎進去根本是折磨，人多到動彈不得，還會被行人白眼。', '2026-05-23 20:48:00'),
(5, 'danger_zone', 2, '滑胎高手', '下雨天這條路超油超滑，輪胎抓地力不好的絕對會打滑，請各位繞道！', '2026-05-25 22:10:00'),
(6, 'danger_zone', 3, '土木系大三', '這個路口我同學已經出了兩次車禍，轉彎車都不看直行車的，超恐怖！', '2026-05-22 17:42:00'),
(7, 'danger_zone', 3, '通勤大叔', '早上上班時間河南路車速都很快，要待轉的人記得提早靠右，不要突然切過去。', '2026-05-24 08:20:00'),
(8, 'danger_zone', 3, '機車守護者', '危險指數絕對有五顆星，每次走這裡都手心冒汗。', '2026-05-25 15:30:00'),
(9, 'danger_zone', 4, '資工系學長', '待轉區常常爆滿，我都直接在後面排隊，很怕被後面直行車追撞。', '2026-05-21 12:20:00'),
(10, 'danger_zone', 4, '機車難民', '那格待轉區到底能停幾台？設計者自己來騎騎看好嗎！', '2026-05-23 18:50:00'),
(11, 'danger_zone', 5, '外送小哥', '雖然我是跑外送的，但我也覺得這裡大家迴轉很亂，大家還是多注意安全。', '2026-05-24 14:12:00'),
(12, 'danger_zone', 5, '逢大女大生', '中午時間這裡車子超多，又有很多車亂停，希望大家能騎慢點。', '2026-05-26 09:30:00'),

-- Intersection Comments
(13, 'intersection', 101, '逢甲小鋼炮', '真的！每次晚上待轉都覺得自己後半截車屁股在馬路上被車子刷卡。', '2026-05-28 13:00:00'),
(14, 'intersection', 101, '安全防禦駕駛', '建議如果車太多，可以考慮直行到下一個路口再繞回來，避開這個待轉格。', '2026-05-29 09:15:00'),
(15, 'intersection', 102, '通勤小跑車', '早上8點這裡的待轉區根本是修羅場，超多人不禮讓的。', '2026-05-27 08:45:00'),
(16, 'intersection', 102, '逢大阿甘', '起步時千萬別衝第一，一定要看清楚對向有沒有搶快的直行車！', '2026-05-28 17:50:00'),
(17, 'intersection', 103, '公車刷卡機', '每次公車切進來，我都以為我的照後鏡要被撞掉了，超可怕。', '2026-05-26 18:22:00'),
(18, 'intersection', 103, 'FCU_Rider', '這待轉格設計根本是陷阱，路那麼小還要兩段轉。', '2026-05-27 12:10:00'),
(19, 'intersection', 104, '安全騎士', '這裡的待轉區算是逢甲附近設計得最好的了，停起來很有安全感。', '2026-05-25 16:00:00'),
(20, 'intersection', 105, '中科通勤族', '半夜騎這條路大家車速都破60，待轉時要一直盯著後視鏡，很怕被追撞。', '2026-05-24 11:00:00'),
(21, 'intersection', 105, '新手保衛者', '建議把車燈維持開啟，增加夜間顯眼度。', '2026-05-25 14:20:00'),

-- POI (Toilet) Comments
(22, 'poi', 401, '逢大愛乾淨', '這真的是全校最好上、最乾淨的廁所了！大推！', '2026-06-01 12:30:00'),
(23, 'poi', 402, '深夜騎手', '晚上肚子痛救星，多虧這家加油站，大夜班外送好夥伴。', '2026-06-02 03:00:00');
