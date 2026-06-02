# 城市機車友善地圖系統 - 流程圖與資料流設計 (FLOWCHART)

本文件繪製本系統的**使用者流程圖 (User Flow)**與**系統序列圖 (Sequence Diagram)**，幫助開發團隊理解功能間的跳轉關係與後端資料傳輸流程。

## 1. 使用者流程圖 (User Flow)

此圖描述使用者進入系統後，如何操作各項功能，包括地圖瀏覽、兩段式左轉查詢、危險路段評分，以及新設計的**附近推薦功能**。

```mermaid
flowchart TD
    Start([使用者開啟網頁]) --> Home[首頁 - 機車友善地圖]
    
    Home --> Choice{選擇操作功能}
    
    %% F-01/F-02/F-03
    Choice -->|瀏覽地圖| ViewMap[地圖瀏覽與縮放]
    Choice -->|左轉提示 F-02| LeftTurn[查看/標記兩段式左轉路口]
    Choice -->|危險路段 F-03| DangerSystem[查看/回報危險路段與評分]
    
    %% 新增功能: 附近推薦
    Choice -->|附近推薦| NearIntro[進入附近推薦頁面/標籤]
    NearIntro --> GetLoc{瀏覽器詢問定位權限}
    
    GetLoc -->|允許| Geolocation[取得精準 GPS 座標]
    GetLoc -->|拒絕/失敗| DefaultLoc[使用預設座標: 逢甲大學]
    
    Geolocation --> FetchPOI[向後端 API 請求周邊 POI 資料]
    DefaultLoc --> FetchPOI
    
    FetchPOI --> RenderUI[在 Leaflet 地圖繪製標記 <br> 並在側邊欄顯示推薦清單]
    
    RenderUI --> Interact{使用者互動}
    Interact -->|類別篩選| Filter[切換篩選: 機車行/加油站/停車場/危險路段]
    Filter --> FetchPOI
    
    Interact -->|點選列表項目| FocusPOI[地圖平移聚焦 POI 並彈出詳細泡泡資訊]
    Interact -->|點選地圖任意點| ManualSearch[以點擊處為中心，重新搜尋附近推薦]
    ManualSearch --> FetchPOI
```

---

## 2. 系統序列圖 (Sequence Diagram)

此序列圖展示「附近推薦功能」在前後端與資料庫之間的資料傳輸與計算流程。

```mermaid
sequenceDiagram
    actor User as 機車騎士
    participant Browser as 瀏覽器 (JS / Leaflet)
    participant Flask as Flask 路由 (recommendations.py)
    participant Model as POI Model (poi.py)
    participant DB as SQLite 資料庫

    User->>Browser: 點選「附近推薦」功能
    Browser->>Flask: GET /recommendations
    Flask-->>Browser: 渲染並回傳 recommendations.html 基礎介面
    
    Note over Browser: 瀏覽器執行 JS，呼叫 Geolocation API
    Browser->>Browser: 取得騎士座標 (lat, lng)

    Browser->>Flask: GET /api/nearby?lat=24.178&lng=120.646&type=all
    
    Note over Flask: 註冊距離計算函數 distance() 到 SQLite 連線
    Flask->>Model: get_nearby_pois(lat, lng, radius=2.0, type='all')
    Model->>DB: SELECT *, distance(lat, lng, 24.178, 120.646) AS dist FROM pois HAVING dist <= 2.0 ORDER BY dist
    DB-->>Model: 回傳符合之 POI 記錄 (機車行、加油站、危險路段等)
    Model-->>Flask: 回傳 POI 資料列表 (含計算後之距離 dist)
    
    Flask-->>Browser: 回傳 JSON 格式 POI 列表資料
    
    Note over Browser: Leaflet.js 清除舊標記，繪製新標記與側邊清單
    Browser-->>User: 顯示附近推薦點位、距離與星級評價
```

---

## 3. 功能清單與路由對照表

| 功能名稱 | HTTP 方法 | URL 路徑 | 對應 Jinja2 模板 | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| **地圖首頁** | GET | `/` | `index.html` | 系統主地圖，整合基本查詢與顯示 (F-01) |
| **左轉提示清單** | GET | `/left_turn` | `left_turn/list.html` | 列表顯示所有標記之兩段式左轉路口 (F-02) |
| **新增左轉提示** | POST | `/left_turn/create` | — | 接收使用者標記左轉路口的表單並存入 DB |
| **危險路段評價** | GET | `/danger` | `danger/list.html` | 顯示危險路段評分與星級清單頁面 (F-03) |
| **新增危險回報** | POST | `/danger/create` | — | 接收危險路段回報表單並寫入 DB (F-03) |
| **附近推薦頁面** | GET | `/recommendations` | `recommendations/index.html` | 顯示附近推薦主頁與地圖 (新增功能) |
| **獲取周邊推薦 API**| GET | `/api/nearby` | — | JSON API，依座標、半徑、類型回傳推薦點 (新增功能) |
