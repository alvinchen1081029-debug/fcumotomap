# 城市機車友善地圖系統 - 路由與頁面設計文件 (ROUTES)

本文件規劃 Flask 後端的路由與 API 設計，定義每個 URL 的功能、傳入參數、回傳值以及前端 Jinja2 模板對照。

## 1. 路由總覽

| 功能 | HTTP 方法 | URL 路徑 | 對應模板 | 說明 |
| :--- | :--- | :--- | :--- | :--- |
| **首頁與主地圖** | GET | `/` | `index.html` | 顯示網站首頁與基礎地圖，整合危險路段與左轉提示。 |
| **兩段式左轉列表** | GET | `/left_turn` | `left_turn/list.html` | 列表顯示所有需兩段式左轉路口。 |
| **新增左轉路口** | POST | `/left_turn/create` | — | 接收表單，新增兩段式左轉路段，重導向至列表。 |
| **危險路段列表** | GET | `/danger` | `danger/list.html` | 顯示所有危險路段與其評分星等。 |
| **新增危險路段** | POST | `/danger/create` | — | 接收使用者危險評估回報，重導向至列表。 |
| **附近推薦頁面** | GET | `/recommendations` | `recommendations/index.html` | 附近推薦功能的主頁面與互動地圖。 |
| **附近推薦 API** | GET | `/api/nearby` | — | API 端點，回傳鄰近 POI 與危險路段 (JSON)。 |

---

## 2. 路由詳細說明

### 2.1 首頁與主地圖 (`GET /`)
- **輸入**: 無。
- **處理邏輯**: 呼叫 `LeftTurn.get_all()` 與 `DangerousRoad.get_all()` 取得全域標記，傳遞給模板進行地圖初始化渲染。
- **輸出**: 渲染 `index.html`，在地圖上繪製全域標記。
- **錯誤處理**: 資料庫查詢失敗時，回傳空清單，並使用 `flash` 顯示警告訊息。

### 2.2 附近推薦頁面 (`GET /recommendations`)
- **輸入**: 無。
- **處理邏輯**: 渲染包含 Leaflet.js 地圖與類別篩選按鈕的前端頁面。頁面載入後，前端會透過 Geolocation 取得位置並呼叫 API。
- **輸出**: 渲染 `recommendations/index.html`。
- **錯誤處理**: 無。

### 2.3 附近推薦 API (`GET /api/nearby`)
- **輸入**: 
  - `lat`: float (必填，騎士緯度座標)
  - `lng`: float (必填，騎士經度座標)
  - `radius`: float (選填，搜尋半徑公里，預設 `2.0`)
  - `type`: string (選填，過濾 POI 類型: `'shop'`, `'gas'`, `'charging'`, `'parking'`, `'danger'`, `'all'`，預設 `'all'`)
- **處理邏輯**: 
  - 驗證 `lat` 與 `lng` 是否為合法經緯度。
  - 若 `type` 為 `'danger'`，呼叫 `DangerousRoad.get_nearby_dangers(lat, lng, radius)`。
  - 若 `type` 為其他，呼叫 `POI.get_nearby_pois(lat, lng, radius, type)`。
  - 若 `type` 為 `'all'`，同時取得周邊的 POI 與危險路段，並合併依距離排序。
- **輸出**: 回傳 JSON 格式列表：
  ```json
  [
    {
      "id": 1,
      "name": "逢甲機車行",
      "type": "shop",
      "latitude": 24.1791,
      "longitude": 120.6455,
      "address": "台中市西屯區...",
      "phone": "04-23456789",
      "rating": 4.5,
      "description": "營業時間: 09:00-21:00",
      "dist": 0.15
    }
  ]
  ```
- **錯誤處理**: 
  - 若缺乏 `lat` 或 `lng` 參數，回傳 HTTP 400 Bad Request 及錯誤 JSON。
  - 若格式轉換錯誤，回傳 HTTP 400。

### 2.4 新增左轉路口 (`POST /left_turn/create`)
- **輸入**: `location_name`, `latitude`, `longitude`, `description` (來自 HTML Form)。
- **處理邏輯**: 驗證必填欄位。呼叫 `LeftTurn.create(data)` 寫入資料庫。
- **輸出**: 重導向至 `GET /left_turn`。
- **錯誤處理**: 若必填欄位為空，使用 `flash` 儲存錯誤訊息，並返回原表單。

### 2.5 新增危險路段 (`POST /danger/create`)
- **輸入**: `road_name`, `latitude`, `longitude`, `danger_level`, `description`。
- **處理邏輯**: 驗證必填欄位且 `danger_level` 需在 1-5 之間。呼叫 `DangerousRoad.create(data)`。
- **輸出**: 重導向至 `GET /danger`。
- **錯誤處理**: 驗證失敗時 `flash` 錯誤訊息並返回原頁面。

---

## 3. Jinja2 模板清單

所有模板均繼承 `base.html` 基礎模板，並定義在 `app/templates/` 目錄中：

1. **`base.html`**
   - 全域版面與 CSS/JS 庫引用。
   - 引用 Bootstrap 5 CSS 與 JS。
   - 引用 Leaflet.js CSS 與 JS（供地圖頁面使用）。
   - 包含系統頂部導覽列 (Navbar) 與 `flash_messages` 顯示區。
2. **`index.html`**
   - 繼承 `base.html`。
   - 渲染首頁，中央放置 Leaflet 地圖容器。
3. **`left_turn/list.html`**
   - 繼承 `base.html`。
   - 顯示目前標記的所有左轉路口表格，並附有新增表單。
4. **`danger/list.html`**
   - 繼承 `base.html`。
   - 顯示危險路段列表、各路段的平均星級評價、回報表單。
5. **`recommendations/index.html`**
   - 繼承 `base.html`。
   - 前端採用左右二分欄佈局：左側為推薦類別切換鈕（全部、機車行、加油站、換電站、停車場、危險警示）與卡片清單；右側為 Leaflet 地圖容器。
