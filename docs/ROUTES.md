# 城市機車友善地圖與車流量查詢系統 - 路由與頁面設計 (ROUTES)

本文件說明 Flask 後端的所有路由（頁面渲染路由與 AJAX JSON API 路由）設計。

## 1. 路由總覽

| 功能描述 | HTTP 方法 | URL 路徑 | 對應 HTML 模板 | 說明 |
| :--- | :---: | :--- | :--- | :--- |
| **首頁與地圖** | `GET` | `/` | `templates/index.html` | 系統入口首頁，包含 Leaflet.js 地圖與查詢控制項 |
| **危險路段列表** | `GET` | `/danger-zones` | `templates/danger_zone_list.html` | 清單模式檢視附近危險路段與危險星級 |
| **危險路段詳情** | `GET` | `/danger-zones/<id>` | `templates/danger_zone_detail.html` | 顯示單筆危險路段詳細描述、留言列表與投票 |
| **新增留言** | `POST` | `/danger-zones/<id>/comments` | — (重導向至詳情頁) | 接收留言表單資料，寫入資料庫後重導向 |
| **取得所有路段 API**| `GET` | `/api/roads` | — (JSON) | 地圖請求所有路段車流量幾何資訊的 API |
| **取得危險點 API**| `GET` | `/api/danger-zones` | — (JSON) | 地圖請求所有危險標記點經緯度的 API |
| **回報危險點 API**| `POST` | `/api/danger-zones` | — (JSON) | 地圖上點擊右鍵新增危險路段的 POST API |
| **投票 API** | `POST` | `/api/danger-zones/<id>/vote` | — (JSON) | 對特定危險點進行贊同/反對投票的 POST API |

---

## 2. 路由詳細說明

### 2.1 頁面渲染路由

#### `GET /`
*   **用途**：首頁。
*   **輸入參數**：無。
*   **處理邏輯**：渲染 `index.html`。
*   **輸出**：HTML 頁面。

#### `GET /danger-zones`
*   **用途**：以列表形式查看所有回報的危險路段。
*   **輸入參數**：無。
*   **處理邏輯**：呼叫 `DangerZone.get_all()` 獲取資料庫中所有危險點，依建立時間由新到舊排序。
*   **輸出**：渲染 `danger_zone_list.html`。

#### `GET /danger-zones/<int:id>`
*   **用途**：查看特定危險路段的詳細說明與討論。
*   **輸入參數**：URL 參數 `id`。
*   **處理邏輯**：
    1. 呼叫 `DangerZone.get_by_id(id)`。若不存在則回傳 404。
    2. 呼叫 `DangerZone.get_comments(id)` 獲取其下所有留言。
*   **輸出**：渲染 `danger_zone_detail.html`。

#### `POST /danger-zones/<int:id>/comments`
*   **用途**：在危險路段詳情頁提交新留言。
*   **輸入參數**：表單欄位 `author` (預設匿名)、`content` (必填)。
*   **處理邏輯**：
    1. 驗證 `content` 是否為空。若為空，透過 Flask `flash` 顯示錯誤，並重導向回詳情頁。
    2. 呼叫 `DangerZone.add_comment(id, author, content)` 存入資料庫。
*   **輸出**：`redirect(url_for('main.danger_zone_detail', id=id))`。

---

### 2.2 AJAX API 路由 (JSON 回傳)

#### `GET /api/roads`
*   **用途**：地圖初始化時拉取路段資料。
*   **輸入參數**：可選的 Query 參數 `name` (模糊搜尋)、`traffic_level` (車流量篩選)、`two_stage_turn` (是否待轉篩選)。
*   **處理邏輯**：根據篩選條件呼叫 `Road.get_filtered_roads(name, traffic_level, two_stage_turn)`。
*   **輸出**：JSON 陣列。
    ```json
    [
      {
        "id": 1,
        "name": "福星路",
        "traffic_level": "medium",
        "two_stage_turn": 0,
        "coordinates": [[24.1786, 120.6468], [24.1798, 120.6472]],
        "description": "主要商圈幹道，下班時間車流量多"
      }
    ]
    ```

#### `GET /api/danger-zones`
*   **用途**：地圖上標示所有危險警告紅點。
*   **輸入參數**：無。
*   **處理邏輯**：呼叫 `DangerZone.get_all()`。
*   **輸出**：JSON 陣列。
    ```json
    [
      {
        "id": 1,
        "latitude": 24.1792,
        "longitude": 120.6470,
        "title": "文華路口地面濕滑",
        "rating": 4,
        "upvotes": 12,
        "downvotes": 2
      }
    ]
    ```

#### `POST /api/danger-zones`
*   **用途**：地圖右鍵彈出表單後，以 AJAX 發送新增。
*   **輸入參數**：JSON Payload `{"latitude": 24.18, "longitude": 120.65, "title": "...", "description": "...", "rating": 5}`。
*   **處理邏輯**：
    1. 驗證欄位是否完整，經緯度是否在合理區間。
    2. 呼叫 `DangerZone.create(data)` 存入資料庫。
*   **輸出**：JSON `{ "status": "success", "id": 12 }` 或錯誤訊息。

#### `POST /api/danger-zones/<int:id>/vote`
*   **用途**：對回報點點擊贊同或反對。
*   **輸入參數**：JSON Payload `{"type": "upvote"}` 或 `{"type": "downvote"}`。
*   **處理邏輯**：呼叫 `DangerZone.vote(id, vote_type)` 增加計數。
*   **輸出**：JSON `{ "status": "success", "upvotes": 13, "downvotes": 2 }`。

---

## 3. Jinja2 模板清單

1.  `base.html`：全局基礎板型。包含 Bootstrap 5 導航列、頁尾、以及 AJAX 使用的快顯訊息框架構。
2.  `index.html`：包含左側查詢/篩選與快速搜尋欄位，右側滿版地圖容器。繼承自 `base.html`。
3.  `danger_zone_list.html`：卡片式列表頁面，顯示目前回報的所有危險路段，並提供排序或簡單搜尋。繼承自 `base.html`。
4.  `danger_zone_detail.html`：顯示該點危險標題、位置、星級與描述。右側為投票按鈕，下方為留言列表與發表留言的表單。繼承自 `base.html`。
