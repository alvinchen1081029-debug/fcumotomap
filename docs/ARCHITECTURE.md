# 城市機車友善地圖系統 - 系統架構設計文件 (ARCHITECTURE)

本文件定義「城市機車友善地圖系統」的系統架構、技術選型、目錄結構以及元件之間的關係，並特別包含新新增的「附近推薦功能」的架構規劃。

## 1. 技術架構說明

本系統採用傳統的 **Flask MVC (Model-View-Controller) 模式** 進行開發。為了簡化開發流程與滿足教學規範，本系統採用非前後端分離架構，由 Flask 搭配 Jinja2 模板直接渲染 HTML 頁面。

### 技術選型
- **後端 (Controller)**: **Python + Flask**
  - 原因：輕量且易於擴充，適合中小型專案快速開發。使用 Blueprint 將不同功能模組（首頁、左轉提示、危險評分、附近推薦）模組化。
- **前端 (View)**: **HTML5 + Vanilla CSS + JavaScript (Leaflet.js / OpenStreetMap)**
  - 原因：為了最大化控制力，使用純 CSS (搭配 Bootstrap 5 提供基礎佈局) 與原生 JS。使用開源 Leaflet.js 地圖庫，無須額外付費申請 API Key，且能流暢呈現地圖與標記。
- **資料庫 (Model)**: **SQLite (使用 Python sqlite3 內建函式庫)**
  - 原因：SQLite 為單一檔案資料庫，無須部署獨立的資料庫伺服器，對課堂專案最為便利。配合 `sqlite3.Row` 以鍵值對方式存取欄位。

### MVC 角色分工
1. **Model (模型)**:
   - 負責與 SQLite 資料庫互動，執行 CRUD（建立、讀取、更新、刪除）操作。
   - 例如：`poi.py` 處理推薦點的地理座標查詢；`danger.py` 處理危險路段的評分與回報。
2. **View (視圖)**:
   - 負責使用者介面的呈現。
   - 使用 **Jinja2** 模板系統繼承 `base.html`，並透過 JS 呼叫 Leaflet.js 渲染地圖。
3. **Controller (控制器/路由)**:
   - 由 Flask 的 Route（路由）負責接收 HTTP 請求。
   - 驗證輸入參數，調用對應的 Model 取得資料，最後渲染 View 模板或回傳 JSON API 資料給前端。

---

## 2. 專案資料夾結構

本專案之目錄結構設計如下，明確區分各功能模組：

```text
fcumotomap/
│
├── app/
│   ├── __init__.py          # 初始化 Flask App 與資料庫連線設定
│   │
│   ├── models/              # 資料庫模型 (Model) - 負責資料庫 CRUD
│   │   ├── __init__.py
│   │   ├── left_turn.py     # 左轉提示資料模型 (F-02)
│   │   ├── danger.py        # 危險路段資料模型 (F-03)
│   │   └── poi.py           # 機車友善點位資料模型 (附近推薦)
│   │
│   ├── routes/              # Flask 路由藍圖 (Controller)
│   │   ├── __init__.py
│   │   ├── main.py          # 首頁與地圖查詢 (F-01)
│   │   ├── left_turn.py     # 左轉提示路由 (F-02)
│   │   ├── danger.py        # 危險路段評分路由 (F-03)
│   │   └── recommendations.py # 附近推薦路由 (新增功能)
│   │
│   ├── templates/           # Jinja2 HTML 模板 (View)
│   │   ├── base.html        # 基礎共用模板 (導覽列、CDN引用)
│   │   ├── index.html       # 地圖查詢首頁
│   │   ├── left_turn/       # 左轉提示相關頁面
│   │   ├── danger/          # 危險路段回報與評分頁面
│   │   └── recommendations/ # 附近推薦列表與詳細頁面
│   │
│   └── static/              # 靜態資源 (CSS, JS, 圖片)
│       ├── css/
│       │   └── style.css    # 系統全域自訂樣式 (含現代美學暗色模式)
│       └── js/
│           ├── map.js       # 全域地圖初始化與標記共用邏輯
│           └── recommendations.js # 附近推薦的前端互動 (Geolocation 與 API 串接)
│
├── database/
│   └── schema.sql           # SQLite 建表語法
│
├── docs/                    # 專案設計文件
│   ├── PRD.md               # 產品需求文件
│   ├── ARCHITECTURE.md      # 本架構文件
│   ├── FLOWCHART.md         # 流程圖文件
│   ├── DB_DESIGN.md         # 資料庫設計文件
│   └── ROUTES.md            # 路由設計文件
│
├── instance/
│   └── database.db          # 本地 SQLite 資料庫檔案 (不提交至 Git)
│
├── .env.example             # 環境變數設定範本
├── .gitignore
├── app.py                   # 專案啟動入口點
├── README.md
└── requirements.txt         # 依賴套件清單 (flask, python-dotenv 等)
```

---

## 3. 元件關係圖

以下使用 Mermaid 語法描述「附近推薦功能」在系統中的資料流動關係：

```mermaid
graph TD
    %% 角色定義
    User([機車騎士 / 使用者])
    Browser[瀏覽器 / Leaflet.js 地圖]
    FlaskRoute[Flask 路由 /api/nearby]
    POIModel[POI Model poi.py]
    SQLite[(SQLite Database database.db)]
    JinjaView[Jinja2 模板 recommendations.html]

    %% 流程線
    User -->|1. 開啟頁面| Browser
    Browser -->|2. 獲取 HTML| JinjaView
    JinjaView -->|3. 顯示基礎介面| Browser
    
    Browser -->|4. HTML5 Geolocation 取得 (lat, lng)| Browser
    Browser -->|5. AJAX 請求 (GET /api/nearby?lat=xx&lng=yy)| FlaskRoute
    
    FlaskRoute -->|6. 調用 get_nearby_pois(lat, lng, radius)| POIModel
    POIModel -->|7. SQL 距離計算查詢| SQLite
    SQLite -->>|8. 回傳符合條件的 POI 與距離| POIModel
    POIModel -->>|9. 回傳 POI 列表| FlaskRoute
    
    FlaskRoute -->>|10. 回傳 JSON 資料| Browser
    Browser -->|11. 在 Leaflet 地圖繪製標記並在列表顯示項目| User
```

---

## 4. 關鍵設計決策

### 決策一：附近推薦的距離計算演算法
- **方案**：在 SQLite 中使用 **Haversine 公式** 的簡化近似版本（勾股定理/平面距離近似）或註冊自訂 Python 函數至 SQLite 連線。
- **原因**：由於推薦範圍通常在 2 公里內，在如此小範圍內，地球弧度的影響微乎其微。為了保持 SQLite 查詢的高效能，我們將在 SQLite 連線初始化時，使用 `conn.create_function` 註冊一個自訂的 `distance(lat1, lon1, lat2, lon2)` Python 函數，直接在 SQL 語法中進行距離篩選與排序：
  ```sql
  SELECT *, distance(latitude, longitude, :user_lat, :user_lng) AS dist 
  FROM pois 
  WHERE dist <= :radius 
  ORDER BY dist ASC;
  ```

### 決策二：地圖庫選用 Leaflet.js
- **方案**：使用 **Leaflet.js** 搭配 **OpenStreetMap (OSM)** 圖資。
- **原因**：相較於 Google Maps API，Leaflet + OSM 具有完全免費、開源、不需要信用卡驗證及註冊 API Key 的優點，極度適合學校專題。此外，Leaflet.js 極其輕量，在行動裝置或低階電腦上加載速度快，符合非功能需求中的效能考量。

### 決策三：前端定位降級機制 (Graceful Degradation)
- **方案**：優先使用 HTML5 Geolocation，若使用者拒絕授權或定位失敗，則降級為預設地圖中心點（例如逢甲大學週邊 `24.1786, 120.6466`）。
- **原因**：機車騎士可能在室內查詢、或者瀏覽器未開啟定位權限。若定位失敗直接報錯會極度影響體驗，因此提供合適的預設中心點，並允許使用者透過地圖點擊手動更改「中心點」以查詢周邊推薦。

### 決策四：靜態與動態結合的資料維護
- **方案**：加油站與停車場資料由後端靜態匯入（政府 Open Data 篩選）；危險路段則來自於「危險評分系統 (F-03)」使用者回報的動態資料。
- **原因**：這能同時發揮「危險評分系統」的即時群眾回報價值，又兼顧了「機車友善設施」的實用性，省去頻繁呼叫第三方即時 API 的開發難度，也保證系統能在離線或低網路頻寬下正常運作。
