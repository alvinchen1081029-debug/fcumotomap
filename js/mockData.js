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

const mockToiletPoints = [
    {
        id: 101,
        title: "中油福星加油站公廁",
        lat: 24.17985,
        lng: 120.64380,
        toiletType: "gas_station",
        toiletTypeName: "中油加油站公廁",
        cleanliness: 4,
        hasPaper: true,
        isAccessible: true,
        motorcycleFriendly: true,
        hours: "24 小時開放",
        reporter: "加油小幫手",
        reportTime: "2026-05-20 10:30",
        description: "加油站附設的公廁，非常方便機車停靠（加油站旁有機車停放區）。廁所每天定時清潔，乾淨度佳，提供衛生紙，且設有無障礙空間。是機車騎士半夜急需的首選！",
        upvotes: 35,
        downvotes: 1,
        comments: [
            { author: "夜貓騎士", date: "2026-05-20 23:45", content: "半夜跑山回來肚子痛，還好有這間24小時的，救了我一命！" },
            { author: "機車外送員", date: "2026-05-22 14:20", content: "這裡機車可以直接停加油站旁，進去上廁所不用一分鐘，超推！" }
        ]
    },
    {
        id: 102,
        title: "逢甲大學積學館公廁",
        lat: 24.17890,
        lng: 120.64890,
        toiletType: "campus",
        toiletTypeName: "學校教學大樓公廁",
        cleanliness: 5,
        hasPaper: true,
        isAccessible: true,
        motorcycleFriendly: false,
        hours: "每日 07:00 - 22:00",
        reporter: "逢大糾察隊",
        reportTime: "2026-05-22 15:45",
        description: "位於逢甲大學積學館一樓，非常乾淨，有冷氣且空氣流通。學校上課時間都有清潔人員巡邏。不過校外人士需要步行進入校園，機車需停在校外停車格後走進去，稍微不便。",
        upvotes: 24,
        downvotes: 2,
        comments: [
            { author: "資工小學弟", date: "2026-05-22 16:00", content: "積學館的廁所超乾淨，而且洗手台很大，甚至還有香氛！" },
            { author: "校外遊客", date: "2026-05-24 11:30", content: "進校園上廁所很舒服，但車子要停在福星路再走進來。" }
        ]
    },
    {
        id: 103,
        title: "逢甲公園公共廁所",
        lat: 24.17380,
        lng: 120.65180,
        toiletType: "park",
        toiletTypeName: "市政公園公廁",
        cleanliness: 3,
        hasPaper: false,
        isAccessible: true,
        motorcycleFriendly: true,
        hours: "24 小時開放",
        reporter: "公園散步阿伯",
        reportTime: "2026-05-18 08:15",
        description: "逢甲公園內的公共廁所，靠近路邊，周邊有許多路邊機車停車格，十分便利。廁所是24小時的，但晚上較暗。有時候衛生紙會用完，建議自備。乾淨度普通，但有定期打掃。",
        upvotes: 19,
        downvotes: 3,
        comments: [
            { author: "休閒騎士", date: "2026-05-18 19:30", content: "路過這裡想上廁所很方便，旁邊都是機車位。但有時蚊子有點多。" },
            { author: "備用衛生紙", date: "2026-05-21 21:00", content: "上次去沒有衛生紙，大家記得自己帶喔！" }
        ]
    },
    {
        id: 104,
        title: "7-11 逢大門市公共廁所",
        lat: 24.17740,
        lng: 120.65060,
        toiletType: "convenience_store",
        toiletTypeName: "超商附設公廁",
        cleanliness: 4,
        hasPaper: true,
        isAccessible: false,
        motorcycleFriendly: true,
        hours: "24 小時開放",
        reporter: "超商常客",
        reportTime: "2026-05-24 12:00",
        description: "逢大門市內的廁所，非常方便。門口有機車臨停空間。店員打掃得很勤快，有提供衛生紙。如果不好意思直接使用，可以順便買瓶飲料。無障礙空間受限於店內空間較窄。",
        upvotes: 28,
        downvotes: 0,
        comments: [
            { author: "美食獵人", date: "2026-05-24 13:15", content: "這家超商廁所非常乾淨，上完順便買杯咖啡很方便！" }
        ]
    }
];

const toiletTypes = {
    gas_station: "中油加油站公廁",
    campus: "學校教學大樓公廁",
    convenience_store: "超商附設公廁",
    park: "市政公園公廁",
    other: "其他公共廁所"
};
