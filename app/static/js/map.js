// FCU Moto Map - Integrated Client Logic

// Global states
let points = [];           // Danger zones
let leftTurnPoints = [];   // Intersections
let toiletPoints = [];     // Toilet POIs
let gasStations = [];      // Gas stations POIs
let parkingLots = [];      // Parking lots POIs
let favorites = [];        // Favorited point IDs
let roadLayers = [];       // Leaflet road layers
let markers = {};          // Map danger markers {id: marker}
let leftTurnMarkers = {};  // Map intersection markers
let toiletMarkers = {};    // Map toilet markers
let gasMarkers = {};       // Map gas markers
let parkingMarkers = {};   // Map parking markers

let map;
let tileLayer = null;
let heatmapLayerGroup = null;
let gasLayerGroup = null;
let parkingLayerGroup = null;

let currentTheme = 'dark';
let currentMode = 'danger'; // 'danger' or 'toilet'
let currentDrawerTab = 'all'; // 'all' or 'fav'
let showDangerLayer = true;
let showLeftTurnLayer = true;
let showRoadLayer = true;
let showGasStations = false;
let showParkingLots = false;
let cachedRoadData = [];


let selectedPoint = null;
let isAddingMode = false;
let newPointLatLng = null;
let currentRatingInput = 5;
let userVotes = {}; // Format: { pointId: 'up' | 'down' | null }
let isHeatmapActive = false;

// Custom facility mock data (if not fully defined in POI database, fallbacks)
const mockGasStations = [
    { id: 201, title: "中油逢甲福星站", type: "gas", lat: 24.1798, lng: 120.6402, brand: "CPC", hours: "24 小時營業", description: "設有機車專用加油車道，尖峰時間加油速度快，附設公廁乾淨。", services: ["機車加油", "自助加油", "輪胎打氣", "公廁"] },
    { id: 202, title: "台塑河南加油站", type: "gas", lat: 24.1712, lng: 120.6446, brand: "FPCC", hours: "07:00 - 23:00", description: "油區寬敞，出口處視線良好，便利機車起步離站。", services: ["機車加油", "自助加油", "公廁"] }
];

const mockParkingLots = [
    { id: 301, title: "逢甲大學福星停車場", type: "parking", lat: 24.1812, lng: 120.6488, fee: "持學生證免費", spaces: "850 輛", description: "校內學生專用機車停車場，設有雨遮、監視器，安全有保障。", features: ["機車停車", "遮雨棚", "電子防盜感應"] },
    { id: 302, title: "福星機車收費停車場", type: "parking", lat: 24.1770, lng: 120.6443, fee: "每次 20 元", spaces: "150 輛", description: "緊鄰逢甲路與福星路口，適合逛夜市的騎士臨時停放。", features: ["機車停車", "計次收費"] }
];

// Helper maps for options
const hazardTypes = {
    illegal_parking: "臨停違停嚴重 / 視線死角",
    crowded: "人車交織 / 道路擁擠",
    fast_lane_merge: "快慢車道匯流 / 轉彎不讓",
    bad_design: "待轉區設計過小 / 路口標線不良",
    sudden_stop: "外送車輛多 / 常有急停迴轉",
    other: "其他道路潛在安全危險"
};

const toiletTypes = {
    gas_station: "中油加油站公廁",
    campus: "學校教學大樓公廁",
    convenience_store: "超商附設公廁",
    park: "市政公園公廁",
    other: "其他公共廁所"
};

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // Load favorites from local storage
    try {
        favorites = JSON.parse(localStorage.getItem("fcu_moto_favorites")) || [];
    } catch (e) {
        favorites = [];
    }

    initMap();
    initUIEvents();
    initStarRatingBehavior();
    loadAllData();
});

// Initialize Leaflet Map
function initMap() {
    const fcuCenter = [24.1786, 120.6466]; // Center of Feng Chia University
    
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView(fcuCenter, 15);
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    setMapStyle('dark');

    heatmapLayerGroup = L.layerGroup().addTo(map);
    gasLayerGroup = L.layerGroup().addTo(map);
    parkingLayerGroup = L.layerGroup().addTo(map);

    map.on('click', handleMapClick);
}

// Switch map style dynamically
function setMapStyle(style) {
    if (tileLayer) {
        map.removeLayer(tileLayer);
    }
    
    let url = style === 'light' 
        ? 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    
    tileLayer = L.tileLayer(url, {
        maxZoom: 19,
        subdomains: 'abcd'
    }).addTo(map);
}

// ==========================================
// DATA LOADING
// ==========================================

function loadAllData() {
    Promise.all([
        fetch('/api/roads').then(r => r.json()),
        fetch('/api/danger-zones').then(r => r.json()),
        fetch('/api/intersections').then(r => r.json()),
        fetch('/api/pois').then(r => r.json())
    ]).then(([roadData, dangerData, intersectionData, poiData]) => {
        // 1. Draw roads polylines
        cachedRoadData = roadData;
        drawRoads(cachedRoadData);

        // 2. Load Danger points
        points = dangerData.map(d => ({
            id: d.id,
            title: d.title,
            lat: d.latitude,
            lng: d.longitude,
            dangerLevel: d.rating,
            hazardType: d.hazard_type || 'other',
            hazardTypeName: hazardTypes[d.hazard_type] || '其他道路潛在安全危險',
            reporter: d.reporter || '匿名騎士',
            reportTime: d.created_at,
            description: d.description,
            upvotes: d.upvotes,
            downvotes: d.downvotes,
            comments: d.comments || []
        }));

        // 3. Load Left Turns (Intersections)
        leftTurnPoints = intersectionData.map(i => ({
            id: i.id + 10000, // Offset intersection IDs to prevent UI key conflicts
            dbId: i.id,      // Real database ID
            title: i.name,
            lat: i.latitude,
            lng: i.longitude,
            isLeftTurn: true,
            dangerLevel: i.safety_rating, 
            waitingAreaSize: i.waiting_area_size || '中等',
            crowdLevel: i.crowd_level || '中等',
            safetyRating: i.safety_rating || 3,
            reporter: i.reporter || '系統管理員',
            reportTime: i.created_at,
            description: i.description || '待轉區警示點。',
            upvotes: i.upvotes,
            downvotes: i.downvotes,
            comments: i.comments || []
        }));

        // 4. Load POI Toilets
        toiletPoints = poiData.filter(p => p.type === 'toilet').map(t => ({
            id: t.id + 20000, // Offset POI IDs
            dbId: t.id,
            title: t.name,
            lat: t.latitude,
            lng: t.longitude,
            isToilet: true,
            cleanliness: t.rating || 3,
            toiletType: t.toilet_type || 'other',
            toiletTypeName: toiletTypes[t.toilet_type] || '其他公共廁所',
            hasPaper: t.has_paper === 1,
            isAccessible: t.is_accessible === 1,
            motorcycleFriendly: t.motorcycle_friendly === 1,
            hours: t.hours || '24 小時開放',
            reporter: t.reporter || '系統管理員',
            reportTime: t.created_at,
            description: t.description || '提供公共廁所。',
            upvotes: t.upvotes,
            downvotes: t.downvotes,
            comments: t.comments || []
        }));

        // 5. Load POI Facilities
        gasStations = poiData.filter(p => p.type === 'gas_station').map(g => ({
            id: g.id,
            title: g.name,
            type: "gas",
            lat: g.latitude,
            lng: g.longitude,
            brand: g.name.includes("中油") ? "CPC" : "FPCC",
            hours: g.hours || "24 小時營業",
            description: g.description || "加油站設施",
            services: g.services ? JSON.parse(g.services) : ["機車加油"]
        }));
        if (gasStations.length === 0) gasStations = mockGasStations;

        parkingLots = poiData.filter(p => p.type === 'parking_lot').map(p => ({
            id: p.id,
            title: p.name,
            type: "parking",
            lat: p.latitude,
            lng: p.longitude,
            fee: p.description.includes("免費") ? "免費" : "每次 20 元",
            spaces: "中等",
            description: p.description || "機車停車場設施",
            features: p.services ? JSON.parse(p.services) : ["機車停車"]
        }));
        if (parkingLots.length === 0) parkingLots = mockParkingLots;

        // Render markers
        renderDangerPoints();
        updateGlobalStats();

        // Check if query params ask to focus on coordinates
        const urlParams = new URLSearchParams(window.location.search);
        const focusLat = urlParams.get('lat');
        const focusLng = urlParams.get('lng');
        if (focusLat && focusLng) {
            const fLat = parseFloat(focusLat);
            const fLng = parseFloat(focusLng);
            map.setView([fLat, fLng], 17);
            
            // Try to find matching point to show
            const matchingPoint = [...points, ...leftTurnPoints, ...toiletPoints].find(
                p => Math.abs(p.lat - fLat) < 0.0001 && Math.abs(p.lng - fLng) < 0.0001
            );
            if (matchingPoint) {
                showPointDetails(matchingPoint);
            }
        }
    }).catch(err => console.error("Error loading data from API:", err));
}

// Helper to snap coordinates to roads using OSRM API
async function getSnappedCoordinates(coordinates) {
    if (!coordinates || coordinates.length < 2) return coordinates;
    
    // OSRM coordinates are in lng,lat format, separated by semicolons
    const coordsString = coordinates.map(coord => `${coord[1]},${coord[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('OSRM API returned error');
        const data = await response.json();
        
        if (data.routes && data.routes.length > 0) {
            // OSRM returns coordinates as [lng, lat], map it back to Leaflet's [lat, lng]
            return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        }
    } catch (err) {
        console.warn('Failed to fetch snapped road coordinates, falling back to straight lines:', err);
    }
    return coordinates; // fallback
}

// Draw roads
async function drawRoads(roads) {
    roadLayers.forEach(layer => map.removeLayer(layer));
    roadLayers = [];

    if (!showRoadLayer) return;

    // Fetch snapped coordinates and draw polylines in parallel
    const drawPromises = roads.map(async (road) => {
        if (!road.coordinates || road.coordinates.length < 2) return;

        // Get actual snapped road geometry
        const snappedCoords = await getSnappedCoordinates(road.coordinates);

        let lineColor = '#10b981'; // low: Green
        let trafficText = '順暢';
        let badgeClass = 'badge-low';
        
        if (road.traffic_level === 'medium') {
            lineColor = '#f59e0b'; // medium: Orange
            trafficText = '壅塞';
        } else if (road.traffic_level === 'high') {
            lineColor = '#ef4444'; // high: Red
            trafficText = '紫爆';
        }

        const polyline = L.polyline(snappedCoords, {
            color: lineColor,
            weight: 6,
            opacity: 0.75,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(map);

        polyline.on('mouseover', () => polyline.setStyle({ weight: 9, opacity: 1.0 }));
        polyline.on('mouseout', () => polyline.setStyle({ weight: 6, opacity: 0.75 }));

        const turnText = road.two_stage_turn == 1 
            ? '<i class="fa-solid fa-redo text-danger" style="transform: rotate(90deg)"></i> 需要兩段式左轉 (待轉)' 
            : '<i class="fa-solid fa-arrow-up text-success"></i> 無需待轉 (可直接左轉)';

        const popupContent = `
            <div style="min-width: 200px; font-family: var(--font-outfit); color: white;">
                <strong style="font-size: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); display:block; padding-bottom:4px; margin-bottom:6px;">${road.name}</strong>
                <div style="margin-bottom: 8px;">
                    <span style="background: ${lineColor}33; color: ${lineColor}; border: 1px solid ${lineColor}66; padding: 2px 6px; border-radius: 4px; font-size: 0.75rem; font-weight:700;">車流量：${trafficText}</span>
                </div>
                <div style="font-size: 0.8rem; color: #cbd5e1; margin-bottom: 6px;">
                    ${turnText}
                </div>
                <div style="font-size: 0.75rem; color: #94a3b8; border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 6px;">
                    ${road.description || '無詳細說明。'}
                </div>
            </div>
        `;
        
        polyline.bindPopup(popupContent);
        roadLayers.push(polyline);
    });

    await Promise.all(drawPromises);
}

// Create animated pulsing Leaflet marker icon
function createPulsingIcon(dangerLevel, isLeftTurn = false, isToilet = false, pointId = null) {
    if (isLeftTurn) {
        return L.divIcon({
            className: `hazard-pulse-marker level-leftturn`,
            html: `
                <div class="pulse-ring"></div>
                <div class="pulse-dot" style="display: flex; justify-content: center; align-items: center;"><i class="fas fa-redo" style="color: white; font-size: 6px; transform: rotate(90deg);"></i></div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }

    if (isToilet) {
        return L.divIcon({
            className: `hazard-pulse-marker level-leftturn`,
            html: `
                <div class="pulse-ring" style="border-color: var(--accent-cyan); box-shadow: 0 0 12px var(--accent-cyan);"></div>
                <div class="pulse-dot" style="background-color: var(--accent-cyan); display: flex; justify-content: center; align-items: center;"><i class="fas fa-restroom" style="color: white; font-size: 8px;"></i></div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }
    
    let levelClass = "level-3";
    if (dangerLevel >= 5) levelClass = "level-5";
    else if (dangerLevel >= 4) levelClass = "level-4";
    
    const isFav = favorites.includes(pointId);
    const favClass = isFav ? " is-fav" : "";
    const dotContent = isFav ? `<i class="fas fa-heart" style="color: white; font-size: 8px;"></i>` : "";
    
    let borderStyle = isFav ? "border-color: #ef4444; box-shadow: 0 0 12px #ef4444;" : "";
    let dotStyle = isFav ? "background-color: #ef4444;" : "";

    return L.divIcon({
        className: `hazard-pulse-marker ${levelClass}${favClass}`,
        html: `
            <div class="pulse-ring" style="${borderStyle}"></div>
            <div class="pulse-dot" style="${dotStyle}">${dotContent}</div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
}

// Render markers on the map
function renderDangerPoints() {
    // 1. Clear existing danger markers
    for (let id in markers) {
        map.removeLayer(markers[id]);
    }
    markers = {};

    // 2. Clear existing left turn markers
    for (let id in leftTurnMarkers) {
        map.removeLayer(leftTurnMarkers[id]);
    }
    leftTurnMarkers = {};

    // 3. Clear existing toilet markers
    for (let id in toiletMarkers) {
        map.removeLayer(toiletMarkers[id]);
    }
    toiletMarkers = {};

    // Draw Danger markers
    if (currentMode === 'danger') {
        if (showDangerLayer) {
            points.forEach(point => {
                const marker = L.marker([point.lat, point.lng], {
                    icon: createPulsingIcon(point.dangerLevel, false, false, point.id)
                });

                marker.bindTooltip(`
                    <div style="background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 5px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; font-family: var(--font-outfit);">
                        <span style="color: var(--accent-red); margin-right: 5px;">★ ${point.dangerLevel}</span> ${point.title}
                    </div>
                `, {
                    direction: 'top',
                    offset: [0, -10],
                    opacity: 0.95,
                    className: 'custom-map-tooltip'
                });

                marker.on('click', () => showPointDetails(point));
                marker.addTo(map);
                markers[point.id] = marker;
            });
        }

        // Draw Intersections/Left turns markers
        if (showLeftTurnLayer) {
            leftTurnPoints.forEach(point => {
                const marker = L.marker([point.lat, point.lng], {
                    icon: createPulsingIcon(3, true, false)
                });

                marker.bindTooltip(`
                    <div style="background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 5px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; font-family: var(--font-outfit);">
                        <span style="color: var(--accent-cyan); margin-right: 5px;"><i class="fas fa-redo"></i> 待轉</span> ${point.title}
                    </div>
                `, {
                    direction: 'top',
                    offset: [0, -10],
                    opacity: 0.95,
                    className: 'custom-map-tooltip'
                });

                marker.on('click', () => showPointDetails(point));
                marker.addTo(map);
                leftTurnMarkers[point.id] = marker;
            });
        }
    } else if (currentMode === 'toilet') {
        // Draw Toilet markers
        toiletPoints.forEach(point => {
            const marker = L.marker([point.lat, point.lng], {
                icon: createPulsingIcon(3, false, true)
            });

            marker.bindTooltip(`
                <div style="background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 5px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; font-family: var(--font-outfit);">
                    <span style="color: var(--accent-cyan); margin-right: 5px;"><i class="fas fa-restroom"></i></span> ${point.title}
                </div>
            `, {
                direction: 'top',
                offset: [0, -10],
                opacity: 0.95,
                className: 'custom-map-tooltip'
            });

            marker.on('click', () => showPointDetails(point));
            marker.addTo(map);
            toiletMarkers[point.id] = marker;
        });
    }

    renderListView();
    if (isHeatmapActive) {
        drawHeatmap();
    }
}

// Update Header Stats
function updateGlobalStats() {
    const totalSpots = currentMode === 'danger'
        ? points.length + leftTurnPoints.length
        : toiletPoints.length;

    const totalVotes = currentMode === 'danger'
        ? points.reduce((s, p) => s + p.upvotes + p.downvotes, 0) + leftTurnPoints.reduce((s, p) => s + p.upvotes + p.downvotes, 0)
        : toiletPoints.reduce((s, p) => s + p.upvotes + p.downvotes, 0);

    document.getElementById("total-danger-spots").innerText = totalSpots;
    document.getElementById("total-votes-count").innerText = totalVotes;
}

// ==========================================
// LIST DRAWER & FILTERING
// ==========================================

function renderListView() {
    const listContainer = document.getElementById("drawer-items-list");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    let combined = [];
    if (currentMode === 'danger') {
        if (showDangerLayer) combined = [...combined, ...points];
        if (showLeftTurnLayer) combined = [...combined, ...leftTurnPoints];
    } else {
        combined = [...toiletPoints];
    }

    // Filter by Favorites Tab
    if (currentDrawerTab === 'fav') {
        combined = combined.filter(p => favorites.includes(p.id));
    }

    // Sort by rating / danger level descending
    combined.sort((a, b) => {
        let levelA = a.isLeftTurn ? a.safetyRating : (a.isToilet ? a.cleanliness : a.dangerLevel);
        let levelB = b.isLeftTurn ? b.safetyRating : (b.isToilet ? b.cleanliness : b.dangerLevel);
        return levelB - levelA;
    });

    if (combined.length === 0) {
        listContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1.5rem 0;">目前無符合條件的標記。</div>`;
        return;
    }

    combined.forEach(point => {
        const item = document.createElement("div");
        item.className = "drawer-item";
        
        let badgeHtml = "";
        if (point.isLeftTurn) {
            badgeHtml = `<span class="badge leftturn-badge">兩段式左轉</span>`;
        } else if (point.isToilet) {
            badgeHtml = `<span class="badge" style="background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); border: 1px solid rgba(6, 182, 212, 0.4);">乾淨度 ${point.cleanliness}</span>`;
        } else {
            badgeHtml = `<span class="badge danger-${point.dangerLevel}">危險度 ${point.dangerLevel}</span>`;
        }

        item.innerHTML = `
            <div>
                <div class="drawer-item-title">${point.title}</div>
                <div class="drawer-item-meta">
                    ${badgeHtml}
                    <span><i class="far fa-comment"></i> ${point.comments.length} 則留言</span>
                </div>
            </div>
            <div class="drawer-item-votes" style="color: ${point.isLeftTurn || point.isToilet ? 'var(--accent-cyan)' : 'var(--accent-blue)'}">
                <i class="fas fa-thumbs-up"></i> ${point.upvotes}
            </div>
        `;

        item.addEventListener("click", () => {
            map.panTo([point.lat, point.lng - 0.0015]);
            showPointDetails(point);
        });

        listContainer.appendChild(item);
    });
}

// Filter lists and markers on search
function filterMarkersAndList(query) {
    const q = query.toLowerCase().trim();

    if (currentMode === 'danger') {
        points.forEach(point => {
            const matches = showDangerLayer && (
                point.title.toLowerCase().includes(q) || 
                point.description.toLowerCase().includes(q) ||
                point.hazardTypeName.toLowerCase().includes(q)
            ) && (currentDrawerTab === 'all' || favorites.includes(point.id));

            const marker = markers[point.id];
            if (marker) {
                if (matches) { if (!map.hasLayer(marker)) marker.addTo(map); }
                else { if (map.hasLayer(marker)) map.removeLayer(marker); }
            }
        });

        leftTurnPoints.forEach(point => {
            const matches = showLeftTurnLayer && (
                point.title.toLowerCase().includes(q) || 
                point.description.toLowerCase().includes(q)
            ) && (currentDrawerTab === 'all' || favorites.includes(point.id));

            const marker = leftTurnMarkers[point.id];
            if (marker) {
                if (matches) { if (!map.hasLayer(marker)) marker.addTo(map); }
                else { if (map.hasLayer(marker)) map.removeLayer(marker); }
            }
        });
    } else {
        toiletPoints.forEach(point => {
            const matches = (
                point.title.toLowerCase().includes(q) || 
                point.description.toLowerCase().includes(q) ||
                point.toiletTypeName.toLowerCase().includes(q)
            ) && (currentDrawerTab === 'all' || favorites.includes(point.id));

            const marker = toiletMarkers[point.id];
            if (marker) {
                if (matches) { if (!map.hasLayer(marker)) marker.addTo(map); }
                else { if (map.hasLayer(marker)) map.removeLayer(marker); }
            }
        });
    }

    renderListView();
}

// ==========================================
// DETAILS VIEW, COMMENTS & VOTING
// ==========================================

function showPointDetails(point) {
    selectedPoint = point;
    isAddingMode = false;
    document.getElementById("onboarding-toast").classList.remove("show");

    const sidebar = document.getElementById("sidebar-right");
    const detailsView = document.getElementById("sidebar-details-view");
    const formView = document.getElementById("sidebar-form-view");
    const userSettingsView = document.getElementById("sidebar-settings-view");
    const facilityView = document.getElementById("sidebar-facility-view");

    detailsView.style.display = "block";
    formView.style.display = "none";
    userSettingsView.style.display = "none";
    if (facilityView) facilityView.style.display = "none";
    
    // Fill text
    document.getElementById("detail-title").innerText = point.title;
    document.getElementById("detail-description").innerText = point.description;
    document.getElementById("detail-reporter").innerText = point.reporter;
    document.getElementById("detail-time").innerText = point.reportTime;

    // Toggle favorite heart styling
    const favBtn = document.getElementById("favorite-toggle-btn");
    if (favorites.includes(point.id)) {
        favBtn.classList.add("active");
        favBtn.innerHTML = `<i class="fas fa-heart"></i>`;
    } else {
        favBtn.classList.remove("active");
        favBtn.innerHTML = `<i class="far fa-heart"></i>`;
    }

    // Toggle layouts based on type
    const toiletDetails = document.getElementById("toilet-details-card");
    const leftTurnDetails = document.getElementById("detail-left-turn-specs");
    const starContainer = document.getElementById("detail-stars");
    const hazardTagName = document.getElementById("detail-hazard-name");

    toiletDetails.style.display = "none";
    leftTurnDetails.style.display = "none";
    starContainer.style.display = "none";

    if (point.isLeftTurn) {
        leftTurnDetails.style.display = "block";
        document.getElementById("metric-waiting-size").innerText = point.waitingAreaSize;
        document.getElementById("metric-crowd-level").innerText = point.crowdLevel;
        
        const safetyContainer = document.getElementById("metric-safety-rating");
        safetyContainer.innerHTML = "";
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement("i");
            star.className = i <= point.safetyRating ? "fas fa-star" : "far fa-star";
            star.style.color = "var(--accent-cyan)";
            star.style.fontSize = "0.75rem";
            safetyContainer.appendChild(star);
        }
        
        hazardTagName.innerText = "🔄 兩段式左轉提示";
        hazardTagName.style.color = "var(--accent-cyan)";
        hazardTagName.style.borderColor = "rgba(6, 182, 212, 0.4)";
        hazardTagName.style.background = "rgba(6, 182, 212, 0.15)";
    } else if (point.isToilet) {
        toiletDetails.style.display = "block";
        toggleIndicatorCard("detail-toilet-paper", point.hasPaper);
        toggleIndicatorCard("detail-toilet-accessible", point.isAccessible);
        toggleIndicatorCard("detail-toilet-parking", point.motorcycleFriendly);
        document.getElementById("detail-toilet-hours").innerText = point.hours;

        hazardTagName.innerText = point.toiletTypeName;
        hazardTagName.style.color = "var(--accent-cyan)";
        hazardTagName.style.borderColor = "rgba(6, 182, 212, 0.3)";
        hazardTagName.style.background = "rgba(6, 182, 212, 0.15)";
        
        // Render cleanliness stars
        starContainer.style.display = "flex";
        starContainer.innerHTML = "";
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement("i");
            star.className = i <= point.cleanliness ? "fas fa-star" : "far fa-star";
            star.style.color = "var(--accent-cyan)";
            starContainer.appendChild(star);
        }
    } else {
        starContainer.style.display = "flex";
        starContainer.innerHTML = "";
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement("i");
            star.className = i <= point.dangerLevel ? "fas fa-star" : "far fa-star";
            star.style.color = "var(--accent-red)";
            starContainer.appendChild(star);
        }

        hazardTagName.innerText = point.hazardTypeName;
        hazardTagName.style.color = "";
        hazardTagName.style.borderColor = "";
        hazardTagName.style.background = "";
    }

    // Load Votes
    document.getElementById("upvote-count").innerText = point.upvotes;
    document.getElementById("downvote-count").innerText = point.downvotes;

    // Load Comments
    renderComments(point.comments);

    sidebar.classList.add("active");
}

function toggleIndicatorCard(elementId, isActive) {
    const el = document.getElementById(elementId);
    if (el) {
        el.className = isActive ? "toilet-indicator-card active" : "toilet-indicator-card inactive";
    }
}

function renderComments(comments) {
    const list = document.getElementById("comment-list");
    list.innerHTML = "";

    if (!comments || comments.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1rem 0;">暫無留言，說點什麼吧！</div>`;
        return;
    }

    comments.forEach(comment => {
        const item = document.createElement("div");
        item.className = "comment-item";
        item.innerHTML = `
            <div class="comment-meta">
                <span class="comment-author">${comment.author || '匿名騎士'}</span>
                <span class="comment-date">${comment.created_at || comment.date || ''}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
        `;
        list.appendChild(item);
    });

    list.scrollTop = list.scrollHeight;
}

// Submit Comment via API
function submitComment() {
    if (!selectedPoint) return;
    
    const input = document.getElementById("comment-input");
    const content = input.value.trim();
    if (!content) return;

    let apiType = 'danger-zones';
    let realId = selectedPoint.id;
    if (selectedPoint.isLeftTurn) {
        apiType = 'intersections';
        realId = selectedPoint.dbId;
    } else if (selectedPoint.isToilet) {
        apiType = 'pois';
        realId = selectedPoint.dbId;
    }

    fetch(`/api/${apiType}/${realId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            author: "陳同學",
            content: content
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'success') {
            const newComment = {
                author: "陳同學",
                created_at: getCurrentDateTimeString(),
                content: content
            };
            selectedPoint.comments.push(newComment);
            renderComments(selectedPoint.comments);
            input.value = "";
            showNotificationToast("留言送出成功！");
            renderListView();
        } else {
            alert('留言失敗：' + (data.error || '未知錯誤'));
        }
    })
    .catch(err => console.error("Error submitting comment:", err));
}

// Cast Vote via API
function votePoint(type) {
    if (!selectedPoint) return;

    const voteTypeStr = type === 'up' ? 'upvote' : 'downvote';
    let apiType = 'danger-zones';
    let realId = selectedPoint.id;
    
    if (selectedPoint.isLeftTurn) {
        apiType = 'intersections';
        realId = selectedPoint.dbId;
    } else if (selectedPoint.isToilet) {
        apiType = 'pois';
        realId = selectedPoint.dbId;
    }

    fetch(`/api/${apiType}/${realId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: voteTypeStr })
    })
    .then(r => r.json())
    .then(data => {
        if (data.status === 'success') {
            selectedPoint.upvotes = data.upvotes;
            selectedPoint.downvotes = data.downvotes;
            document.getElementById("upvote-count").innerText = data.upvotes;
            document.getElementById("downvote-count").innerText = data.downvotes;
            
            showNotificationToast(type === 'up' ? "已贊同此回報！" : "已回報資訊不實。");
            renderListView();
            updateGlobalStats();
        } else {
            alert('投票失敗：' + (data.error || '未知錯誤'));
        }
    })
    .catch(err => console.error("Error casting vote:", err));
}

// ==========================================
// REPORT NEW POINT
// ==========================================

function startAddingMode() {
    isAddingMode = true;
    selectedPoint = null;
    document.getElementById("sidebar-right").classList.remove("active");
    document.getElementById("map").style.cursor = "crosshair";
    document.getElementById("onboarding-toast").classList.add("show");
}

function handleMapClick(e) {
    if (!isAddingMode) {
        document.getElementById("sidebar-right").classList.remove("active");
        document.getElementById("list-drawer").classList.remove("active");
        document.getElementById("drawer-toggle").classList.remove("hidden");
        return;
    }

    newPointLatLng = e.latlng;
    isAddingMode = false;
    document.getElementById("map").style.cursor = "";
    document.getElementById("onboarding-toast").classList.remove("show");

    openAddForm(newPointLatLng.lat, newPointLatLng.lng);
}

function openAddForm(lat, lng) {
    const sidebar = document.getElementById("sidebar-right");
    const detailsView = document.getElementById("sidebar-details-view");
    const formView = document.getElementById("sidebar-form-view");
    const userSettingsView = document.getElementById("sidebar-settings-view");
    const facilityView = document.getElementById("sidebar-facility-view");

    detailsView.style.display = "none";
    formView.style.display = "block";
    userSettingsView.style.display = "none";
    if (facilityView) facilityView.style.display = "none";

    document.getElementById("form-lat-lng").innerText = `已選座標: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    document.getElementById("form-title").value = "";
    document.getElementById("form-description").value = "";
    
    const isToilet = currentMode === 'toilet';
    document.getElementById("form-toilet-attributes").style.display = isToilet ? "block" : "none";
    document.getElementById("form-toilet-hours-group").style.display = isToilet ? "block" : "none";
    
    const starsContainer = document.getElementById("form-rating-stars");
    if (isToilet) {
        starsContainer.className = "rating-stars-input toilet-stars";
        document.getElementById("form-rating-label").innerText = "評定乾淨程度 (1為髒亂，5為極度乾淨)";
        document.getElementById("form-title-label").innerText = "公共廁所名稱";
        document.getElementById("form-title").placeholder = "例如：中油大雅加油站公廁";
        document.getElementById("form-hazard-type-label").innerText = "公廁種類分類";
        document.getElementById("form-desc-label").innerText = "公廁環境與停車描述";
        document.getElementById("form-description").placeholder = "請描述該公廁的位置指引，以及給騎士的停車建議或使用心得。";
        document.getElementById("form-submit-btn").innerHTML = '<i class="fas fa-check-circle"></i> 提交公共廁所回報';
        populateFormHazardType(toiletTypes);
    } else {
        starsContainer.className = "rating-stars-input";
        document.getElementById("form-rating-label").innerText = "評定危險星級 (1為低，5為極度危險)";
        document.getElementById("form-title-label").innerText = "危險地段/路口名稱";
        document.getElementById("form-title").placeholder = "例如：河南路二段與西安街口";
        document.getElementById("form-hazard-type-label").innerText = "危險情況分類";
        document.getElementById("form-desc-label").innerText = "具體危險路況描述";
        document.getElementById("form-description").placeholder = "請詳細說明該路段何時最危險，有什麼潛在盲點？給其他騎士的避雷建議？";
        document.getElementById("form-submit-btn").innerHTML = '<i class="fas fa-check-circle"></i> 提交危險標記回報';
        populateFormHazardType(hazardTypes);
    }
    
    resetStarRatingInput();
    sidebar.classList.add("active");
    map.panTo([lat, lng - 0.0015]);
}

function populateFormHazardType(optionsMap) {
    const select = document.getElementById("form-hazard-type");
    select.innerHTML = "";
    for (let key in optionsMap) {
        const opt = document.createElement("option");
        opt.value = key;
        opt.innerText = optionsMap[key];
        select.appendChild(opt);
    }
}

function resetStarRatingInput() {
    currentRatingInput = 5;
    highlightStars(5);
}

function submitReport(event) {
    event.preventDefault();

    const title = document.getElementById("form-title").value.trim();
    const typeKey = document.getElementById("form-hazard-type").value;
    const description = document.getElementById("form-description").value.trim();

    if (!title || !description) {
        alert("請完整填寫名稱與詳細描述！");
        return;
    }

    if (currentMode === 'danger') {
        fetch('/api/danger-zones', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                latitude: newPointLatLng.lat,
                longitude: newPointLatLng.lng,
                title: title,
                description: description,
                rating: currentRatingInput,
                hazard_type: typeKey,
                reporter: "陳同學"
            })
        })
        .then(r => r.json())
        .then(data => {
            if (data.status === 'success') {
                showNotificationToast("🎉 危險點回報成功！感謝您的守護！");
                loadAllData(); // reload datasets
                document.getElementById("sidebar-right").classList.remove("active");
            } else {
                alert('回報失敗：' + (data.error || '未知錯誤'));
            }
        })
        .catch(err => console.error("Error reporting danger zone:", err));
    } else {
        const hours = document.getElementById("form-toilet-hours").value.trim() || "24 小時開放";
        const hasPaper = document.getElementById("form-has-paper").checked ? 1 : 0;
        const isAccessible = document.getElementById("form-is-accessible").checked ? 1 : 0;
        const motorcycleFriendly = document.getElementById("form-motorcycle-friendly").checked ? 1 : 0;

        fetch('/api/pois', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: title,
                type: 'toilet',
                latitude: newPointLatLng.lat,
                longitude: newPointLatLng.lng,
                description: description,
                rating: currentRatingInput,
                toilet_type: typeKey,
                has_paper: hasPaper,
                is_accessible: isAccessible,
                motorcycle_friendly: motorcycleFriendly,
                hours: hours,
                reporter: "陳同學"
            })
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                showNotificationToast("🎉 公共廁所回報成功！騎士們感謝您！");
                loadAllData();
                document.getElementById("sidebar-right").classList.remove("active");
            } else {
                alert('回報失敗：' + (data.error || '未知錯誤'));
            }
        })
        .catch(err => console.error("Error reporting POI toilet:", err));
    }
}

// ==========================================
// HEATMAP OVERLAY
// ==========================================

function toggleHeatmap() {
    isHeatmapActive = !isHeatmapActive;
    const btn = document.getElementById("heatmap-btn");

    if (isHeatmapActive) {
        btn.classList.add("heatmap-active");
        btn.innerHTML = currentMode === 'danger' 
            ? `<i class="fas fa-layer-group"></i> 關閉危險熱點圖`
            : `<i class="fas fa-layer-group"></i> 關閉公廁分佈圖`;
        drawHeatmap();
        showNotificationToast(currentMode === 'danger' ? "🔥 已開啟危險熱點分析模式" : "🚻 已開啟公廁分佈分析模式");
    } else {
        btn.classList.remove("heatmap-active");
        btn.innerHTML = currentMode === 'danger'
            ? `<i class="fas fa-fire"></i> 開啟危險熱點圖`
            : `<i class="fas fa-fire"></i> 開啟公廁分佈圖`;
        heatmapLayerGroup.clearLayers();
        showNotificationToast("已切換回標準地圖視圖");
    }
}

function drawHeatmap() {
    heatmapLayerGroup.clearLayers();
    const activePoints = currentMode === 'danger' ? points : toiletPoints;

    activePoints.forEach(point => {
        let color, radius, opacity;
        
        if (currentMode === 'danger') {
            color = '#ef4444';
            radius = 60;
            opacity = 0.25;

            if (point.dangerLevel === 4) {
                color = '#f97316';
                radius = 50;
                opacity = 0.22;
            } else if (point.dangerLevel === 3) {
                color = '#f59e0b';
                radius = 40;
                opacity = 0.18;
            }
        } else {
            color = '#06b6d4';
            radius = 55;
            opacity = 0.22;

            if (point.cleanliness === 4) { radius = 45; opacity = 0.18; }
            else if (point.cleanliness === 3) { radius = 35; opacity = 0.15; }
        }

        L.circle([point.lat, point.lng], {
            color: color,
            fillColor: color,
            fillOpacity: opacity,
            radius: radius,
            stroke: false
        }).addTo(heatmapLayerGroup);

        L.circle([point.lat, point.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.45,
            radius: 8,
            stroke: false
        }).addTo(heatmapLayerGroup);
    });
}

// ==========================================
// MOCK SERVICES & SETTINGS
// ==========================================

function toggleFavorite(pointId) {
    const idx = favorites.indexOf(pointId);
    let isAdded = false;

    if (idx === -1) {
        favorites.push(pointId);
        isAdded = true;
        showNotificationToast("💖 已加入收藏地點！");
    } else {
        favorites.splice(idx, 1);
        isAdded = false;
        showNotificationToast("💔 已取消收藏");
    }

    try {
        localStorage.setItem("fcu_moto_favorites", JSON.stringify(favorites));
    } catch (e) {
        console.error("Failed to save favorites to local storage", e);
    }

    if (selectedPoint && selectedPoint.id === pointId) {
        const favBtn = document.getElementById("favorite-toggle-btn");
        if (favBtn) {
            favBtn.classList.toggle("active", isAdded);
            favBtn.innerHTML = isAdded ? `<i class="fas fa-heart"></i>` : `<i class="far fa-heart"></i>`;
        }
    }

    renderDangerPoints();
    renderListView();
    renderSettingsFavoritesList();
}

function renderSettingsFavoritesList() {
    const container = document.getElementById("settings-favorites-list");
    if (!container) return;
    container.innerHTML = "";

    const allCombined = [...points, ...leftTurnPoints, ...toiletPoints];
    const favPoints = allCombined.filter(p => favorites.includes(p.id));

    if (favPoints.length === 0) {
        container.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.75rem; padding: 0.5rem 0;">暫無收藏。</div>`;
        return;
    }

    favPoints.forEach(point => {
        const card = document.createElement("div");
        card.style.cssText = "background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 8px; padding: 0.5rem; margin-bottom: 0.4rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: 0.2s;";
        
        let metaText = point.isLeftTurn ? "兩段式左轉" : (point.isToilet ? point.toiletTypeName : point.hazardTypeName);
        let starBadge = point.isLeftTurn ? `★ ${point.safetyRating}` : (point.isToilet ? `★ ${point.cleanliness}` : `★ ${point.dangerLevel}`);
        let colorClass = point.isLeftTurn || point.isToilet ? "cyan" : "red";

        card.innerHTML = `
            <div>
                <div style="font-size: 0.75rem; font-weight: 600; color: white;">${point.title}</div>
                <div style="font-size: 0.65rem; color: var(--text-secondary); margin-top: 2px;">
                    <span style="color: ${colorClass === 'cyan' ? 'var(--accent-cyan)' : 'var(--accent-red)'}; font-weight: 700; margin-right: 4px;">${starBadge}</span>
                    <span>${metaText}</span>
                </div>
            </div>
            <div class="fav-del-btn" style="color: var(--text-muted); padding: 4px; cursor: pointer;"><i class="fas fa-heart-broken"></i></div>
        `;

        card.addEventListener("click", (e) => {
            if (e.target.closest(".fav-del-btn")) {
                e.stopPropagation();
                toggleFavorite(point.id);
                return;
            }
            map.panTo([point.lat, point.lng - 0.0015]);
            showPointDetails(point);
        });

        container.appendChild(card);
    });
}

function openUserSettingsPanel() {
    isAddingMode = false;
    selectedPoint = null;
    document.getElementById("onboarding-toast").classList.remove("show");

    const sidebar = document.getElementById("sidebar-right");
    const detailsView = document.getElementById("sidebar-details-view");
    const formView = document.getElementById("sidebar-form-view");
    const userSettingsView = document.getElementById("sidebar-settings-view");
    const facilityView = document.getElementById("sidebar-facility-view");

    detailsView.style.display = "none";
    formView.style.display = "none";
    userSettingsView.style.display = "block";
    if (facilityView) facilityView.style.display = "none";

    renderSettingsFavoritesList();
    sidebar.classList.add("active");
}

function renderGasStations() {
    gasLayerGroup.clearLayers();
    if (!showGasStations) return;

    gasStations.forEach(station => {
        const marker = L.marker([station.lat, station.lng], {
            icon: L.divIcon({
                className: 'facility-marker gas-marker',
                html: `
                    <div style="border: 2px solid var(--accent-green); box-shadow: 0 0 10px var(--accent-green); border-radius:50%; width:26px; height:26px; display:flex; justify-content:center; align-items:center; background:rgba(16,185,129,0.2);">
                        <i class="fas fa-gas-pump" style="color: white; font-size: 10px;"></i>
                    </div>
                `,
                iconSize: [26, 26],
                iconAnchor: [13, 13]
            })
        });

        marker.bindTooltip(`<div style="background-color: var(--bg-secondary); color: white; border: 1px solid var(--glass-border); padding: 5px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; font-family: var(--font-outfit);"><span style="color: var(--accent-green); margin-right: 5px;"><i class="fas fa-gas-pump"></i></span> ${station.title}</div>`, { direction: 'top', offset: [0, -10], opacity: 0.9 });
        marker.on('click', () => showFacilityDetails(station));
        marker.addTo(gasLayerGroup);
    });
}

function renderParkingLots() {
    parkingLayerGroup.clearLayers();
    if (!showParkingLots) return;

    parkingLots.forEach(lot => {
        const marker = L.marker([lot.lat, lot.lng], {
            icon: L.divIcon({
                className: 'facility-marker parking-marker',
                html: `
                    <div style="border: 2px solid var(--accent-cyan); box-shadow: 0 0 10px var(--accent-cyan); border-radius:50%; width:26px; height:26px; display:flex; justify-content:center; align-items:center; background:rgba(6,182,212,0.2);">
                        <i class="fas fa-parking" style="color: white; font-size: 10px;"></i>
                    </div>
                `,
                iconSize: [26, 26],
                iconAnchor: [13, 13]
            })
        });

        marker.bindTooltip(`<div style="background-color: var(--bg-secondary); color: white; border: 1px solid var(--glass-border); padding: 5px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem; font-family: var(--font-outfit);"><span style="color: var(--accent-cyan); margin-right: 5px;"><i class="fas fa-parking"></i></span> ${lot.title}</div>`, { direction: 'top', offset: [0, -10], opacity: 0.9 });
        marker.on('click', () => showFacilityDetails(lot));
        marker.addTo(parkingLayerGroup);
    });
}

function showFacilityDetails(facility) {
    selectedPoint = null;
    isAddingMode = false;
    document.getElementById("onboarding-toast").classList.remove("show");

    const sidebar = document.getElementById("sidebar-right");
    const detailsView = document.getElementById("sidebar-details-view");
    const formView = document.getElementById("sidebar-form-view");
    const userSettingsView = document.getElementById("sidebar-settings-view");
    const facilityView = document.getElementById("sidebar-facility-view");

    detailsView.style.display = "none";
    formView.style.display = "none";
    userSettingsView.style.display = "none";
    facilityView.style.display = "block";

    document.getElementById("facility-title").innerText = facility.title;
    document.getElementById("facility-description").innerText = facility.description;

    const typeNameEl = document.getElementById("facility-type-name");
    const badgeEl = document.getElementById("facility-badge");
    const extraEl = document.getElementById("facility-extra");
    const servicesContainer = document.getElementById("facility-services");

    servicesContainer.innerHTML = "";

    if (facility.type === 'gas') {
        typeNameEl.innerText = "加油站";
        typeNameEl.style.color = "var(--accent-green)";
        typeNameEl.style.borderColor = "rgba(16, 185, 129, 0.3)";
        typeNameEl.style.background = "rgba(16, 185, 129, 0.15)";
        
        badgeEl.innerText = facility.hours;
        badgeEl.style.color = "var(--accent-green)";
        badgeEl.style.borderColor = "rgba(16, 185, 129, 0.4)";
        badgeEl.style.background = "rgba(16, 185, 129, 0.15)";

        extraEl.innerText = `品牌: ${facility.brand === 'CPC' ? '台灣中油' : '台塑石油'}`;

        facility.services.forEach(service => {
            const chip = document.createElement("span");
            chip.className = "service-tag";
            chip.innerHTML = `<i class="fas fa-check-circle"></i> ${service}`;
            servicesContainer.appendChild(chip);
        });
    } else {
        typeNameEl.innerText = "機車停車場";
        typeNameEl.style.color = "var(--accent-cyan)";
        typeNameEl.style.borderColor = "rgba(6, 182, 212, 0.3)";
        typeNameEl.style.background = "rgba(6, 182, 212, 0.15)";

        badgeEl.innerText = facility.fee;
        badgeEl.style.color = "var(--accent-cyan)";
        badgeEl.style.borderColor = "rgba(6, 182, 212, 0.4)";
        badgeEl.style.background = "rgba(6, 182, 212, 0.15)";

        extraEl.innerText = `容納數量: ${facility.spaces}`;

        facility.features.forEach(feature => {
            const chip = document.createElement("span");
            chip.className = "service-tag";
            chip.innerHTML = `<i class="fas fa-motorcycle"></i> ${feature}`;
            servicesContainer.appendChild(chip);
        });
    }

    sidebar.classList.add("active");
    map.panTo([facility.lat, facility.lng - 0.0015]);
}

// ==========================================
// INTERACTIVE UI EVENTS
// ==========================================

function initUIEvents() {
    // Sidebar Close Buttons
    document.getElementById("sidebar-close").addEventListener("click", () => {
        document.getElementById("sidebar-right").classList.remove("active");
    });
    document.getElementById("drawer-close").addEventListener("click", () => {
        document.getElementById("list-drawer").classList.remove("active");
        document.getElementById("drawer-toggle").classList.remove("hidden");
    });
    document.getElementById("drawer-toggle").addEventListener("click", () => {
        document.getElementById("list-drawer").classList.add("active");
        document.getElementById("drawer-toggle").classList.add("hidden");
    });

    // Theme Toggle Day/Night
    const themeBtn = document.getElementById("theme-toggle-btn");
    themeBtn.addEventListener("click", () => {
        if (currentTheme === 'dark') {
            currentTheme = 'light';
            document.documentElement.setAttribute('data-theme', 'light');
            themeBtn.innerHTML = `<i class="fas fa-moon"></i> <span>🌙 夜間黑曜</span>`;
            setMapStyle('light');
        } else {
            currentTheme = 'dark';
            document.documentElement.removeAttribute('data-theme');
            themeBtn.innerHTML = `<i class="fas fa-sun"></i> <span>☀️ 日間清晰</span>`;
            setMapStyle('dark');
        }
    });

    // Switch mode Danger vs Toilet
    document.getElementById("mode-danger-btn").addEventListener("click", () => {
        if (currentMode === 'danger') return;
        switchMode('danger');
    });
    document.getElementById("mode-toilet-btn").addEventListener("click", () => {
        if (currentMode === 'toilet') return;
        switchMode('toilet');
    });

    // Layer selection checkboxes
    document.getElementById("toggle-danger-layer").addEventListener("change", (e) => {
        showDangerLayer = e.target.checked;
        renderDangerPoints();
    });
    document.getElementById("toggle-leftturn-layer").addEventListener("change", (e) => {
        showLeftTurnLayer = e.target.checked;
        renderDangerPoints();
    });
    document.getElementById("toggle-road-layer").addEventListener("change", (e) => {
        showRoadLayer = e.target.checked;
        drawRoads(cachedRoadData);
    });

    // Facility toggles
    const gasBtn = document.getElementById("toggle-gas-stations");
    gasBtn.addEventListener("click", () => {
        showGasStations = !showGasStations;
        gasBtn.classList.toggle("active", showGasStations);
        renderGasStations();
    });

    const parkingBtn = document.getElementById("toggle-parking-lots");
    parkingBtn.addEventListener("click", () => {
        showParkingLots = !showParkingLots;
        parkingBtn.classList.toggle("active", showParkingLots);
        renderParkingLots();
    });

    // Heatmap Button
    document.getElementById("heatmap-btn").addEventListener("click", toggleHeatmap);

    // Add new report trigger
    document.getElementById("add-danger-btn").addEventListener("click", startAddingMode);

    // Form submit listener
    document.getElementById("hazard-report-form").addEventListener("submit", submitReport);

    // Comments submission listener
    document.getElementById("comment-submit").addEventListener("click", submitComment);
    document.getElementById("comment-input").addEventListener("keypress", (e) => {
        if (e.key === 'Enter') submitComment();
    });

    // Vote button listeners
    document.getElementById("upvote-btn").addEventListener("click", () => votePoint('up'));
    document.getElementById("downvote-btn").addEventListener("click", () => votePoint('down'));

    // Favorites click listeners
    document.getElementById("favorite-toggle-btn").addEventListener("click", () => {
        if (selectedPoint) toggleFavorite(selectedPoint.id);
    });

    // Header Profile click to show user achievements panel
    document.getElementById("header-profile").addEventListener("click", openUserSettingsPanel);

    // List Drawer tabs
    const tabAll = document.getElementById("tab-all-spots");
    const tabFav = document.getElementById("tab-fav-spots");
    tabAll.addEventListener("click", () => {
        currentDrawerTab = 'all';
        tabAll.className = "drawer-tab active";
        tabFav.className = "drawer-tab";
        renderListView();
    });
    tabFav.addEventListener("click", () => {
        currentDrawerTab = 'fav';
        tabAll.className = "drawer-tab";
        tabFav.className = "drawer-tab active";
        renderListView();
    });

    // Live search filter input
    document.getElementById("search-input").addEventListener("input", (e) => {
        filterMarkersAndList(e.target.value);
    });
}

function switchMode(mode) {
    currentMode = mode;
    
    const modeDangerBtn = document.getElementById("mode-danger-btn");
    const modeToiletBtn = document.getElementById("mode-toilet-btn");
    const legendDanger = document.getElementById("legend-danger");
    const legendToilet = document.getElementById("legend-toilet");
    const addBtn = document.getElementById("add-danger-btn");
    const drawerTitle = document.getElementById("drawer-list-title");
    const drawerToggleText = document.getElementById("drawer-toggle-text");
    const searchInput = document.getElementById("search-input");
    const heatmapBtn = document.getElementById("heatmap-btn");

    document.getElementById("sidebar-right").classList.remove("active");

    if (mode === 'danger') {
        modeDangerBtn.classList.add("active");
        modeToiletBtn.classList.remove("active");
        legendDanger.style.display = "block";
        legendToilet.style.display = "none";
        addBtn.innerHTML = `<i class="fas fa-plus-circle"></i> + 回報危險路段`;
        addBtn.style.borderLeftColor = "var(--accent-red)";
        drawerTitle.innerText = "逢甲學區危險路段清單";
        drawerToggleText.innerText = "瀏覽危險清單";
        searchInput.placeholder = "搜尋路段、交叉路口、或待轉區...";
    } else {
        modeDangerBtn.classList.remove("active");
        modeToiletBtn.classList.add("active");
        legendDanger.style.display = "none";
        legendToilet.style.display = "block";
        addBtn.innerHTML = `<i class="fas fa-plus-circle"></i> + 回報公共廁所`;
        addBtn.style.borderLeftColor = "var(--accent-cyan)";
        drawerTitle.innerText = "逢甲學區公廁清單";
        drawerToggleText.innerText = "瀏覽公廁清單";
        searchInput.placeholder = "搜尋公廁、超商、學校公廁...";
    }

    searchInput.value = "";
    if (isHeatmapActive) {
        heatmapBtn.innerHTML = mode === 'danger'
            ? `<i class="fas fa-layer-group"></i> 關閉危險熱點圖`
            : `<i class="fas fa-layer-group"></i> 關閉公廁分佈圖`;
    } else {
        heatmapBtn.innerHTML = mode === 'danger'
            ? `<i class="fas fa-fire"></i> 開啟危險熱點圖`
            : `<i class="fas fa-fire"></i> 開啟公廁分佈圖`;
    }

    renderDangerPoints();
    updateGlobalStats();
    showNotificationToast(mode === 'danger' ? "已切換至危險路段模式" : "已切換至公廁尋找模式");
}

// Star Rating input behavior
function initStarRatingBehavior() {
    const stars = document.querySelectorAll("#form-rating-stars i");
    stars.forEach(star => {
        star.addEventListener("mouseover", () => {
            const val = parseInt(star.getAttribute("data-value"));
            highlightStars(val);
        });

        star.addEventListener("mouseout", () => {
            highlightStars(currentRatingInput);
        });

        star.addEventListener("click", () => {
            currentRatingInput = parseInt(star.getAttribute("data-value"));
            highlightStars(currentRatingInput);
        });
    });
}

function highlightStars(count) {
    const stars = document.querySelectorAll("#form-rating-stars i");
    stars.forEach(star => {
        const val = parseInt(star.getAttribute("data-value"));
        if (val <= count) {
            star.className = "fas fa-star active";
        } else {
            star.className = "far fa-star";
        }
    });
}

// Notification Toast helper
function showNotificationToast(msg) {
    const toast = document.getElementById("notification-toast");
    const msgEl = document.getElementById("notification-msg");
    if (toast && msgEl) {
        msgEl.innerText = msg;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 3000);
    }
}

function getCurrentDateTimeString() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// Modal open/close helpers
function showModal(modalId) {
    document.getElementById(modalId).classList.add("active");
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
}
