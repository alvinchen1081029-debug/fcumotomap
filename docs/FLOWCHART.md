# 城市機車友善地圖與車流量查詢系統 - 系統與使用者流程圖 (FLOWCHART)

本文件使用 Mermaid 流程圖語法，視覺化展示使用者的操作路徑與系統內的資料傳遞序列，並附帶路由功能對照表。

## 1. 使用者流程圖 (User Flow)

描述使用者進入系統後，如何使用查詢面板、瀏覽地圖、進行車流量篩選、查看或回報危險路段等操作。

```mermaid
flowchart TD
    Start([使用者進入網站]) --> Home[首頁：瀏覽地圖]
    
    Home --> Panel[首頁左側：查詢篩選面板]
    Home --> Map[首頁右側：Leaflet.js 互動地圖]
    
    %% 查詢與篩選路徑
    Panel --> QueryFlow{要查詢什麼？}
    QueryFlow -->|車流量等級| FilterTraffic[選擇車流量：順暢/壅塞/紫爆] --> UpdateMapLine[地圖上僅顯示相應路段]
    QueryFlow -->|兩段式左轉| FilterTurn[勾選兩段式左轉路段] --> UpdateMapTurn[地圖上標示需要待轉的路口]
    QueryFlow -->|特定路名| InputSearch[輸入路名關鍵字，如「福星路」] --> ZoomToRoad[地圖自動定位並放大該路段]
    
    %% 地圖互動路徑
    Map --> MapInteract{如何操作地圖？}
    MapInteract -->|點擊路段/路口| ShowPopup[彈出資訊視窗：顯示路名、即時車流量與待轉規則]
    MapInteract -->|點擊危險紅點| ShowDangerDetail[點擊連結進入「危險路段評分詳情頁」]
    MapInteract -->|地圖點擊右鍵| OpenReportForm[彈出「新增危險路段」表單]
    
    %% 危險路段詳情頁
    ShowDangerDetail --> DetailPage[危險路段詳情頁面]
    DetailPage --> DetailInteract{可進行什麼操作？}
    DetailInteract -->|贊同或反對| VoteAction[點擊投票按鈕] --> APIVote[送出 AJAX 請求更新票數] --> RenderVote[即時更新頁面票數]
    DetailInteract -->|發表留言| WriteComment[填寫留言表單] --> POSTComment[送出 POST 請求] --> ReloadDetail[刷新頁面並顯示新留言]
    
    %% 新增危險路段
    OpenReportForm --> FillForm[填寫危險描述與評分星級] --> SubmitReport[點擊送出] --> APICreate[發送 POST 請求存入資料庫] --> AddMarker[地圖上立即新增紅色警告圖示]
```

---

## 2. 系統序列圖 (Sequence Diagram)

以下是兩個核心情境的詳細系統序列：

### 情境 A：使用者在地圖上回報新的危險路段
```mermaid
sequenceDiagram
    actor User as 使用者
    participant Browser as 瀏覽器 (JS / Leaflet)
    participant Flask as Flask Route (api.py)
    participant DB as SQLite 資料庫

    User->>Browser: 在地圖右鍵選取地點，填寫危險描述與星級
    User->>Browser: 點擊「送出回報」
    Note over Browser: 前端 JS 進行防呆驗證<br/>(檢查欄位不可為空，緯經度是否正確)
    Browser->>Flask: POST /api/danger-zones (JSON payload)
    Flask->>Flask: 後端防重複回報與輸入清洗
    Flask->>DB: INSERT INTO danger_zones (latitude, longitude, description, rating, created_at)
    DB-->>Flask: 成功，回傳新插入資料列的 ID
    Flask-->>Browser: 回傳 JSON {status: "success", id: ID, data: ...}
    Browser->>Browser: 在 Leaflet 地圖上對應座標建立紅色的 Marker
    Browser-->>User: 顯示「回報成功」提示泡泡
```

### 情境 B：使用者對危險路段進行投票（贊同/反對）
```mermaid
sequenceDiagram
    actor User as 使用者
    participant Browser as 瀏覽器 (HTML 詳情頁)
    participant Flask as Flask Route (api.py)
    participant DB as SQLite 資料庫

    User->>Browser: 點擊「贊同 (Upvote)」按鈕
    Browser->>Flask: POST /api/danger-zones/<id>/vote (JSON: {type: 'upvote'})
    Flask->>DB: UPDATE danger_zones SET upvotes = upvotes + 1 WHERE id = <id>
    DB-->>Flask: 成功更新資料列
    Flask->>DB: SELECT upvotes, downvotes FROM danger_zones WHERE id = <id>
    DB-->>Flask: 回傳最新的投票數據
    Flask-->>Browser: 回傳 JSON {status: "success", upvotes: new_value}
    Browser->>Browser: 透過 JS 更新頁面上的「贊同數」數字與按鈕狀態
```

---

## 3. 功能清單對照表

| 功能描述 | HTTP 方法 | URL 路徑 | 對應 HTML 模板 | 後端 Controller 與處理邏輯 |
| :--- | :---: | :--- | :--- | :--- |
| **首頁與地圖瀏覽** | `GET` | `/` | `templates/index.html` | `main.py` -> 渲染主頁面 (地圖框架) |
| **危險路段詳細資訊** | `GET` | `/danger-zones/<id>` | `templates/danger_zone_detail.html` | `main.py` -> 讀取特定危險點詳細星級、描述與留言列表 |
| **新增危險路段留言** | `POST` | `/danger-zones/<id>/comments` | — (重導向至詳情頁) | `main.py` -> 接收留言表單，存入 DB，重導向回詳情頁 |
| **取得所有路段及車流量**| `GET` | `/api/roads` | — (回傳 JSON) | `api.py` -> 查詢所有道路幾何與車流量狀態 |
| **取得所有危險標記點** | `GET` | `/api/danger-zones` | — (回傳 JSON) | `api.py` -> 查詢所有危險點位置與平均星級 |
| **新增危險標記點** | `POST` | `/api/danger-zones` | — (回傳 JSON) | `api.py` -> 接收地圖點擊新增的 JSON 資料並寫入 DB |
| **對危險標記進行投票** | `POST` | `/api/danger-zones/<id>/vote`| — (回傳 JSON) | `api.py` -> 更新特定危險點的贊同/反對數 |
