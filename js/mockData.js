/**
 * FCU Moto Map - Danger Rating System Mock Data
 * This file provides mock data points around Feng Chia University (逢甲大學) for demonstration.
 */

const mockDangerPoints = [
    {
        id: 1,
        title: "逢甲路與福星路口 (福星路麥當勞旁)",
        lat: 24.17865,
        lng: 120.64655,
        dangerLevel: 4,
        hazardType: "illegal_parking",
        hazardTypeName: "臨停違停嚴重 / 視線死角",
        reporter: "逢甲小鋼炮",
        reportTime: "2026-05-24 18:30",
        description: "此路口緊鄰麥當勞與商圈核心，上下學與夜市尖峰時間人流極大。常有大量汽機車違規臨停在紅線上購買餐點，導致機車右轉時視線嚴重受阻。且行人常闖紅燈或未走斑馬線，機車極易與行人或轉彎車輛發生擦撞。",
        upvotes: 42,
        downvotes: 3,
        comments: [
            { author: "逢甲小鋼炮", date: "2026-05-24 18:35", content: "這裡每天晚上下課根本是地獄！公車、計程車、違停全部塞在一起，騎機車要超小心。" },
            { author: "安全第一", date: "2026-05-25 10:15", content: "建議晚上要過這個路口的人，速度降到30以下，隨時準備煞車！" },
            { author: "FCU_Rider", date: "2026-05-26 12:00", content: "違停真的該檢舉，每次要右轉都被擋住視線，差點撞到過馬路的人。" }
        ]
    },
    {
        id: 2,
        title: "文華路 (逢甲夜市核心路段)",
        lat: 24.17700,
        lng: 120.64820,
        dangerLevel: 3,
        hazardType: "crowded",
        hazardTypeName: "人車交織 / 路面狹窄油滑",
        reporter: "夜市路過客",
        reportTime: "2026-05-23 20:45",
        description: "文華路為逢甲夜市主要街道，傍晚後人潮洶湧。部分時段雖有車輛管制，但仍常有機車進入，造成人車極度交織。路面狹窄且常有攤販凸出，路面也因油污容易打滑，下雨天尤為危險。",
        upvotes: 18,
        downvotes: 1,
        comments: [
            { author: "夜市路過客", date: "2026-05-23 20:48", content: "晚上騎進去根本是折磨，人多到動彈不得，還會被行人白眼。" },
            { author: "滑胎高手", date: "2026-05-25 22:10", content: "下雨天這條路超油超滑，輪胎抓地力不好的絕對會打滑，請各位繞道！" }
        ]
    },
    {
        id: 3,
        title: "河南路二段與福星路口",
        lat: 24.17510,
        lng: 120.65350,
        dangerLevel: 5,
        hazardType: "fast_lane_merge",
        hazardTypeName: "快慢車道匯流 / 轉彎未讓直行",
        reporter: "土木系大三",
        reportTime: "2026-05-22 17:40",
        description: "此路口車流量極大，為連接水湳與逢甲地區的重要樞紐。河南路直行車速極快，且福星路右轉河南路的機車常與河南路直行慢車道之機車交織。此外，尖峰時段左轉車輛常未禮讓直行車，是發生擦撞事故的極高危險路段。",
        upvotes: 67,
        downvotes: 4,
        comments: [
            { author: "土木系大三", date: "2026-05-22 17:42", content: "這個路口我同學已經出了兩次車禍，轉彎車都不看直行車的，超恐怖！" },
            { author: "通勤大叔", date: "2026-05-24 08:20", content: "早上上班時間河南路車速都很快，要待轉的人記得提早靠右，不要突然切過去。" },
            { author: "機車守護者", date: "2026-05-25 15:30", content: "危險指數絕對有五顆星，每次走這裡都手心冒汗。" }
        ]
    },
    {
        id: 4,
        title: "西屯路二段與逢甲路口",
        lat: 24.17420,
        lng: 120.64530,
        dangerLevel: 5,
        hazardType: "bad_design",
        hazardTypeName: "待轉區設計不良 / 尖峰車流擠爆",
        reporter: "資工系學長",
        reportTime: "2026-05-21 12:15",
        description: "逢甲路往西屯路方向，機車兩段式左轉待轉區設計過於狹小且位置尷尬。尖峰時間等待左轉的機車常多到溢出至西屯路直行車道，直接暴露在直行車流的危險中。且西屯路路幅較窄，大型公車切入時常逼近機車。",
        upvotes: 55,
        downvotes: 2,
        comments: [
            { author: "資工系學長", date: "2026-05-21 12:20", content: "待轉區常常爆滿，我都直接在後面排隊，很怕被後面直行車追撞。" },
            { author: "機車難民", date: "2026-05-23 18:50", content: "那格待轉區到底能停幾台？設計者自己來騎騎看好嗎！" }
        ]
    },
    {
        id: 5,
        title: "逢大路與逢甲大學側門口",
        lat: 24.17935,
        lng: 120.65080,
        dangerLevel: 3,
        hazardType: "sudden_stop",
        hazardTypeName: "外送車急停 / 學生尖峰車流大",
        reporter: "外送小哥",
        reportTime: "2026-05-24 14:10",
        description: "逢甲大學側門是許多學生進出學校的重要通道。逢大路段路面寬敞，導致車速普遍偏快。然而此處常有外送機車為了接單或送餐突然煞停、迴轉，或是學生突然從側門衝出，行車安全反應不及極易追撞。",
        upvotes: 29,
        downvotes: 0,
        comments: [
            { author: "外送小哥", date: "2026-05-24 14:12", content: "雖然我是跑外送的，但我也覺得這裡大家迴轉很亂，大家還是多注意安全。" },
            { author: "逢大女大生", date: "2026-05-26 09:30", content: "中午時間這裡車子超多，又有很多車亂停，希望大家能騎慢點。" }
        ]
    }
];

const hazardTypes = {
    illegal_parking: "臨停違停嚴重 / 視線死角",
    crowded: "人車交織 / 路面狹窄油滑",
    fast_lane_merge: "快慢車道匯流 / 轉彎未讓直行",
    bad_design: "待轉區設計不良 / 道路設計缺失",
    sudden_stop: "突發急停 / 外送臨停多",
    other: "其他道路潛在危險"
};

const mockLeftTurnPoints = [
    {
        id: 101,
        title: "逢甲路與福星路口 (麥當勞旁)",
        lat: 24.17865,
        lng: 120.64655,
        isLeftTurn: true,
        dangerLevel: 4, // 用作危險度或安全度參考，為求一致，我們在危險評價系統用星級 (4)
        waitingAreaSize: "狹小 (尖峰易溢出至車道)",
        crowdLevel: "極高 (下課及夜市時段擁擠)",
        safetyRating: 2, // 待轉區安全評分 2/5 (偏低)
        reporter: "資工二乙",
        reportTime: "2026-05-28 12:10",
        description: "逢甲路往福星路方向需要兩段式左轉。待轉區格子畫得非常窄小，只要下課尖峰有5台以上機車，待轉區就會直接滿出來到福星路的直行車流中，騎士安全堪憂！建議尖峰時間放慢車速，盡量靠右停靠。",
        upvotes: 38,
        downvotes: 2,
        comments: [
            { author: "逢甲小鋼炮", date: "2026-05-28 13:00", content: "真的！每次晚上待轉都覺得自己後半截車屁股在馬路上被車子刷卡。" },
            { author: "安全防禦駕駛", date: "2026-05-29 09:15", content: "建議如果車太多，可以考慮直行到下一個路口再繞回來，避開這個待轉格。" }
        ]
    },
    {
        id: 102,
        title: "河南路二段與福星路口 (重要幹道樞紐)",
        lat: 24.17510,
        lng: 120.65350,
        isLeftTurn: true,
        dangerLevel: 5,
        waitingAreaSize: "中等 (但車流龐大，仍嫌不足)",
        crowdLevel: "極高 (通勤尖峰車滿為患)",
        safetyRating: 1, // 安全評分 1/5 (極度危險)
        reporter: "交通守護星",
        reportTime: "2026-05-27 08:30",
        description: "由福星路左轉河南路二段必須兩段式左轉。因河南路是雙向多線道且車速極快，在待轉區等待時會直接迎面承受大流量的右轉與直行車流。綠燈起步時，左轉車輛常與直行車流交織，是極易發生擦撞的交界路口。",
        upvotes: 72,
        downvotes: 1,
        comments: [
            { author: "通勤小跑車", date: "2026-05-27 08:45", content: "早上8點這裡的待轉區根本是修羅場，超多人不禮讓的。" },
            { author: "逢大阿甘", date: "2026-05-28 17:50", content: "起步時千萬別衝第一，一定要看清楚對向有沒有搶快的直行車！" }
        ]
    },
    {
        id: 103,
        title: "西屯路二段與逢甲路口 (狹窄路口待轉)",
        lat: 24.17420,
        lng: 120.64530,
        isLeftTurn: true,
        dangerLevel: 5,
        waitingAreaSize: "極度狹小 (約僅容納3台機車)",
        crowdLevel: "高 (學生與買便當人潮多)",
        safetyRating: 2,
        reporter: "機車難民",
        reportTime: "2026-05-26 18:00",
        description: "逢甲路左轉西屯路二段必須兩段式左轉。待轉區空間被壓縮在狹窄的路肩，且路口有公車站牌與違停。一旦有大型公車經過，公車車身會非常貼近待轉格，極具壓迫感。強烈建議新手骑士要特別注意車身間距。",
        upvotes: 49,
        downvotes: 3,
        comments: [
            { author: "公車刷卡機", date: "2026-05-26 18:22", content: "每次公車切進來，我都以為我的照後鏡要被撞掉了，超可怕。" },
            { author: "FCU_Rider", date: "2026-05-27 12:10", content: "這待轉格設計根本是陷阱，路那麼小還要兩段轉。" }
        ]
    },
    {
        id: 104,
        title: "河南路二段與西屯路二段路口 (大型多岔路口)",
        lat: 24.17240,
        lng: 120.64890,
        isLeftTurn: true,
        dangerLevel: 3,
        waitingAreaSize: "寬敞 (標線相對清晰)",
        crowdLevel: "中等 (路幅較大)",
        safetyRating: 4, // 安全評分 4/5 (相對安全)
        reporter: "機車大叔",
        reportTime: "2026-05-25 15:40",
        description: "此路口為大型四岔路口，往西屯路或河南路皆有清楚的兩段式左轉標誌。待轉格空間非常充沛且退縮在安全島旁，能有效避開直行車流。唯獨需注意黃燈亮起時，搶黃燈的直行車速極快，起步時應確認完全紅燈後再前行。",
        upvotes: 21,
        downvotes: 0,
        comments: [
            { author: "安全騎士", date: "2026-05-25 16:00", content: "這裡的待轉區算是逢甲附近設計得最好的了，停起來很有安全感。" }
        ]
    },
    {
        id: 105,
        title: "福星北路與黎明路三段路口 (大學城外圍幹道)",
        lat: 24.18340,
        lng: 120.64810,
        isLeftTurn: true,
        dangerLevel: 4,
        waitingAreaSize: "中等 (無安全島遮蔽)",
        crowdLevel: "高 (往僑光、中科車流大)",
        safetyRating: 3,
        reporter: "僑光機車俠",
        reportTime: "2026-05-24 10:15",
        description: "黎明路三段左轉福星北路（往逢甲大學後門/僑光科大方向）。待轉區位於馬路正中間延伸處，後方完全沒有任何防撞石柱或安全島遮蔽，機車騎士暴露於黎明路疾駛而來的直行車流前。夜市結束後或深夜車速快，需特別警惕後方來車。",
        upvotes: 35,
        downvotes: 1,
        comments: [
            { author: "中科通勤族", date: "2026-05-24 11:00", content: "半夜騎這條路大家車速都破60，待轉時要一直盯著後視鏡，很怕被追撞。" },
            { author: "新手保衛者", date: "2026-05-25 14:20", content: "建議把車燈維持開啟，增加夜間顯眼度。" }
        ]
    }
];
