// FCU Moto Map - Danger Rating System Mock Application Logic

let points = [];
let leftTurnPoints = [];
let map;
let markers = {};
let leftTurnMarkers = {};
let showDangerLayer = true;
let showLeftTurnLayer = true;
let selectedPoint = null;
let isAddingMode = false;
let newPointLatLng = null;
let currentRatingInput = 5;
let userVotes = {}; // Format: { pointId: 'up' | 'down' | null }
let heatmapLayerGroup = null;
let isHeatmapActive = false;
let currentTheme = 'dark';
let tileLayer = null;

// Initialize Application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Clone mock data to local array to allow in-memory modifications
    points = JSON.parse(JSON.stringify(mockDangerPoints));
    leftTurnPoints = JSON.parse(JSON.stringify(mockLeftTurnPoints));
    
    initMap();
    renderDangerPoints();
    updateGlobalStats();
    initUIEvents();
    initStarRatingBehavior();
});

// Initialize Leaflet Map
function initMap() {
    // Center of Feng Chia University
    const fcuCenter = [24.1792, 120.6485];
    
    // Initialize map
    map = L.map('map', {
        zoomControl: false, // Will position customized controls or let user zoom
        attributionControl: false
    }).setView(fcuCenter, 16);
    
    // Add custom zoom control at a nicer place
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Initial tile layer load (default to dark mode)
    setMapStyle('dark');

    heatmapLayerGroup = L.layerGroup().addTo(map);

    // Map Click Handler
    map.on('click', handleMapClick);
}

// Seamlessly switch map tile layers between day light and night dark
function setMapStyle(style) {
    if (tileLayer) {
        map.removeLayer(tileLayer);
    }
    
    let url;
    if (style === 'light') {
        url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    } else {
        url = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    }
    
    tileLayer = L.tileLayer(url, {
        maxZoom: 19,
        subdomains: 'abcd'
    }).addTo(map);
}

// Generate animated HTML pulsing icon based on danger level
function createPulsingIcon(dangerLevel, isLeftTurn = false) {
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
    
    let levelClass = "level-3";
    if (dangerLevel >= 5) levelClass = "level-5";
    else if (dangerLevel >= 4) levelClass = "level-4";
    
    return L.divIcon({
        className: `hazard-pulse-marker ${levelClass}`,
        html: `
            <div class="pulse-ring"></div>
            <div class="pulse-dot"></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
}

// Render danger points to Leaflet Map and List View
function renderDangerPoints() {
    // Clear existing danger markers
    for (let id in markers) {
        map.removeLayer(markers[id]);
    }
    markers = {};

    // Clear existing left turn markers
    for (let id in leftTurnMarkers) {
        map.removeLayer(leftTurnMarkers[id]);
    }
    leftTurnMarkers = {};

    // Render Danger Points if checked
    if (showDangerLayer) {
        points.forEach(point => {
            const marker = L.marker([point.lat, point.lng], {
                icon: createPulsingIcon(point.dangerLevel, false)
            });

            marker.bindTooltip(`
                <div style="background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 5px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem;">
                    <span style="color: var(--accent-red); margin-right: 5px;">★ ${point.dangerLevel}</span> ${point.title}
                </div>
            `, {
                direction: 'top',
                offset: [0, -10],
                opacity: 0.95,
                className: 'custom-map-tooltip'
            });

            marker.on('click', () => {
                showPointDetails(point);
            });

            marker.addTo(map);
            markers[point.id] = marker;
        });
    }

    // Render Left Turn Points if checked
    if (showLeftTurnLayer) {
        leftTurnPoints.forEach(point => {
            const marker = L.marker([point.lat, point.lng], {
                icon: createPulsingIcon(point.dangerLevel, true)
            });

            marker.bindTooltip(`
                <div style="background-color: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--glass-border); padding: 5px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem;">
                    <span style="color: var(--accent-cyan); margin-right: 5px;"><i class="fas fa-redo"></i> 待轉</span> ${point.title}
                </div>
            `, {
                direction: 'top',
                offset: [0, -10],
                opacity: 0.95,
                className: 'custom-map-tooltip'
            });

            marker.on('click', () => {
                showPointDetails(point);
            });

            marker.addTo(map);
            leftTurnMarkers[point.id] = marker;
        });
    }

    renderListView();
    if (isHeatmapActive) {
        drawHeatmap();
    }
}

// Update Header Stats
function updateGlobalStats() {
    document.getElementById("total-danger-spots").innerText = points.length + leftTurnPoints.length;
    
    const totalDangerVotes = points.reduce((sum, p) => sum + p.upvotes + p.downvotes, 0);
    const totalLeftTurnVotes = leftTurnPoints.reduce((sum, p) => sum + p.upvotes + p.downvotes, 0);
    document.getElementById("total-votes-count").innerText = totalDangerVotes + totalLeftTurnVotes;
}

// Render Sidebar List View
function renderListView() {
    const listContainer = document.getElementById("drawer-items-list");
    listContainer.innerHTML = "";

    let combined = [];
    if (showDangerLayer) {
        combined = [...combined, ...points];
    }
    if (showLeftTurnLayer) {
        combined = [...combined, ...leftTurnPoints];
    }

    // Sort by danger level descending
    combined.sort((a, b) => b.dangerLevel - a.dangerLevel);

    if (combined.length === 0) {
        listContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.85rem; padding: 1.5rem 0;">目前無符合篩選條件的標記。</div>`;
        return;
    }

    combined.forEach(point => {
        const item = document.createElement("div");
        item.className = "drawer-item";
        
        let badgeHtml = "";
        if (point.isLeftTurn) {
            badgeHtml = `<span class="badge leftturn-badge">兩段式左轉</span>`;
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
            <div class="drawer-item-votes" style="color: ${point.isLeftTurn ? 'var(--accent-cyan)' : 'var(--accent-blue)'}">
                <i class="fas fa-thumbs-up"></i> ${point.upvotes}
            </div>
        `;

        item.addEventListener("click", () => {
            // Focus map and show details
            map.panTo([point.lat, point.lng]);
            showPointDetails(point);
        });

        listContainer.appendChild(item);
    });
}

// Show Danger Point Details in Sidebar
function showPointDetails(point) {
    selectedPoint = point;
    isAddingMode = false;
    document.getElementById("onboarding-toast").classList.remove("show");

    // UI Elements Transition
    const sidebar = document.getElementById("sidebar-right");
    const detailsView = document.getElementById("sidebar-details-view");
    const formView = document.getElementById("sidebar-form-view");
    const userSettingsView = document.getElementById("sidebar-settings-view");

    detailsView.style.display = "block";
    formView.style.display = "none";
    userSettingsView.style.display = "none";
    
    // Fill Details
    document.getElementById("detail-title").innerText = point.title;
    document.getElementById("detail-description").innerText = point.description;
    document.getElementById("detail-reporter").innerText = point.reporter;
    document.getElementById("detail-time").innerText = point.reportTime;

    // Handle Left Turn special specs
    if (point.isLeftTurn) {
        document.getElementById("detail-left-turn-specs").style.display = "block";
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
        
        // Custom headers for two-stage left turn
        document.getElementById("detail-hazard-name").innerText = "🔄 兩段式左轉提示";
        document.getElementById("detail-hazard-name").style.color = "var(--accent-cyan)";
        document.getElementById("detail-hazard-name").style.borderColor = "rgba(6, 182, 212, 0.4)";
        document.getElementById("detail-hazard-name").style.background = "rgba(6, 182, 212, 0.15)";
        
        // Hide standard hazard stars in left turn mode
        document.getElementById("detail-stars").style.display = "none";
    } else {
        document.getElementById("detail-left-turn-specs").style.display = "none";
        
        document.getElementById("detail-hazard-name").innerText = point.hazardTypeName;
        document.getElementById("detail-hazard-name").style.color = "";
        document.getElementById("detail-hazard-name").style.borderColor = "";
        document.getElementById("detail-hazard-name").style.background = "";
        
        // Draw standard hazard Stars
        document.getElementById("detail-stars").style.display = "flex";
        const starContainer = document.getElementById("detail-stars");
        starContainer.innerHTML = "";
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement("i");
            star.className = i <= point.dangerLevel ? "fas fa-star" : "far fa-star";
            starContainer.appendChild(star);
        }
    }

    // Load Votes
    document.getElementById("upvote-count").innerText = point.upvotes;
    document.getElementById("downvote-count").innerText = point.downvotes;

    // Set Vote Button active states
    const upBtn = document.getElementById("upvote-btn");
    const downBtn = document.getElementById("downvote-btn");
    
    upBtn.classList.remove("active");
    downBtn.classList.remove("active");

    if (userVotes[point.id] === 'up') {
        upBtn.classList.add("active");
    } else if (userVotes[point.id] === 'down') {
        downBtn.classList.add("active");
    }

    // Load Comments
    renderComments(point.comments);

    // Slide sidebar in
    sidebar.classList.add("active");
    
    // Smoothly pan map center slightly to the left to avoid sidebar overlap on desktop
    const targetLng = point.lng - 0.0015; // Shift center slightly
    map.panTo([point.lat, targetLng]);
}

// Render Comments List
function renderComments(comments) {
    const list = document.getElementById("comment-list");
    list.innerHTML = "";

    if (comments.length === 0) {
        list.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1rem 0;">暫無留言，說點什麼吧！</div>`;
        return;
    }

    comments.forEach(comment => {
        const item = document.createElement("div");
        item.className = "comment-item";
        item.innerHTML = `
            <div class="comment-meta">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${comment.date}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
        `;
        list.appendChild(item);
    });

    // Auto scroll comments to the bottom
    list.scrollTop = list.scrollHeight;
}

// Submit a simulated comment
function submitComment() {
    if (!selectedPoint) return;
    
    const input = document.getElementById("comment-input");
    const content = input.value.trim();
    if (!content) return;

    const newComment = {
        author: "逢甲新鮮人",
        date: getCurrentDateTimeString(),
        content: content
    };

    // Add to in-memory model
    selectedPoint.comments.push(newComment);
    
    // Re-render Comments UI
    renderComments(selectedPoint.comments);
    
    // Clean input
    input.value = "";

    // Micro-toast notification
    showNotificationToast("留言送出成功！");
    
    // Update List view comment counts
    renderListView();
}

// Handle Like/Dislike (Vote) Simulation
function votePoint(type) {
    if (!selectedPoint) return;

    const currentVote = userVotes[selectedPoint.id];
    const upBtn = document.getElementById("upvote-btn");
    const downBtn = document.getElementById("downvote-btn");

    if (type === 'up') {
        if (currentVote === 'up') {
            // Undo upvote
            selectedPoint.upvotes--;
            userVotes[selectedPoint.id] = null;
            upBtn.classList.remove("active");
        } else {
            // If was downvoted, undo downvote first
            if (currentVote === 'down') {
                selectedPoint.downvotes--;
                downBtn.classList.remove("active");
            }
            selectedPoint.upvotes++;
            userVotes[selectedPoint.id] = 'up';
            upBtn.classList.add("active");
            showNotificationToast("已贊同此危險路段回報！");
        }
    } else if (type === 'down') {
        if (currentVote === 'down') {
            // Undo downvote
            selectedPoint.downvotes--;
            userVotes[selectedPoint.id] = null;
            downBtn.classList.remove("active");
        } else {
            // If was upvoted, undo upvote first
            if (currentVote === 'up') {
                selectedPoint.upvotes--;
                upBtn.classList.remove("active");
            }
            selectedPoint.downvotes++;
            userVotes[selectedPoint.id] = 'down';
            downBtn.classList.add("active");
            showNotificationToast("已標記此回報為不實或不適用。");
        }
    }

    // Update Counts on screen
    document.getElementById("upvote-count").innerText = selectedPoint.upvotes;
    document.getElementById("downvote-count").innerText = selectedPoint.downvotes;

    // Refresh list view counts
    renderListView();
    updateGlobalStats();
}

// Enter Danger Point Adding Mode
function startAddingMode() {
    isAddingMode = true;
    selectedPoint = null;
    
    // Close sidebar
    document.getElementById("sidebar-right").classList.remove("active");

    // Change cursor
    document.getElementById("map").style.cursor = "crosshair";

    // Show Guide Toast
    const onboarding = document.getElementById("onboarding-toast");
    onboarding.classList.add("show");
}

// Handle Map Click
function handleMapClick(e) {
    if (!isAddingMode) {
        // If sidebar is open, just close it when clicking empty map space
        document.getElementById("sidebar-right").classList.remove("active");
        document.getElementById("list-drawer").classList.remove("active");
        document.getElementById("drawer-toggle").classList.remove("hidden");
        return;
    }

    // Capture coordinates
    newPointLatLng = e.latlng;
    isAddingMode = false;
    document.getElementById("map").style.cursor = "";
    document.getElementById("onboarding-toast").classList.remove("show");

    // Open Add Form in Sidebar
    openAddForm(newPointLatLng.lat, newPointLatLng.lng);
}

// Open Form Sidebar
function openAddForm(lat, lng) {
    const sidebar = document.getElementById("sidebar-right");
    const detailsView = document.getElementById("sidebar-details-view");
    const formView = document.getElementById("sidebar-form-view");
    const userSettingsView = document.getElementById("sidebar-settings-view");

    detailsView.style.display = "none";
    formView.style.display = "block";
    userSettingsView.style.display = "none";

    // Fill form coords
    document.getElementById("form-lat-lng").innerText = `已選座標: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    
    // Reset Form fields
    document.getElementById("form-title").value = "";
    document.getElementById("form-description").value = "";
    document.getElementById("form-hazard-type").value = "illegal_parking";
    resetStarRatingInput();

    sidebar.classList.add("active");
    
    // Pan map to selection
    map.panTo([lat, lng - 0.0015]);
}

// Star Rating input handler
function initStarRatingBehavior() {
    const stars = document.querySelectorAll(".rating-stars-input i");
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
    const stars = document.querySelectorAll(".rating-stars-input i");
    stars.forEach(star => {
        const val = parseInt(star.getAttribute("data-value"));
        if (val <= count) {
            star.className = "fas fa-star active";
        } else {
            star.className = "far fa-star";
        }
    });
}

function resetStarRatingInput() {
    currentRatingInput = 5;
    highlightStars(5);
}

// Submit New Danger Point
function submitReport(event) {
    event.preventDefault();

    const title = document.getElementById("form-title").value.trim();
    const typeKey = document.getElementById("form-hazard-type").value;
    const description = document.getElementById("form-description").value.trim();

    if (!title || !description) {
        alert("請完整填寫標題與詳細描述！");
        return;
    }

    const typeNames = {
        illegal_parking: "臨停違停嚴重 / 視線死角",
        crowded: "人車交織 / 路面狹窄油滑",
        fast_lane_merge: "快慢車道匯流 / 轉彎未讓直行",
        bad_design: "待轉區設計不良 / 道路設計缺失",
        sudden_stop: "突發急停 / 外送臨停多",
        other: "其他道路潛在危險"
    };

    const newPoint = {
        id: points.length + 1,
        title: title,
        lat: newPointLatLng.lat,
        lng: newPointLatLng.lng,
        dangerLevel: currentRatingInput,
        hazardType: typeKey,
        hazardTypeName: typeNames[typeKey],
        reporter: "逢甲新鮮人",
        reportTime: getCurrentDateTimeString(),
        description: description,
        upvotes: 0,
        downvotes: 0,
        comments: []
    };

    // Push into in-memory storage
    points.push(newPoint);

    // Refresh Map and Sidebar details
    renderDangerPoints();
    updateGlobalStats();
    showPointDetails(newPoint);

    // Success Notification Toast
    showNotificationToast("🎉 危險點回報成功！感謝您的守護！");
}

// Toggle Heatmap Overlay Simulation
function toggleHeatmap() {
    isHeatmapActive = !isHeatmapActive;
    const btn = document.getElementById("heatmap-btn");

    if (isHeatmapActive) {
        btn.classList.add("heatmap-active");
        btn.innerHTML = `<i class="fas fa-layer-group"></i> 關閉熱點圖模式`;
        drawHeatmap();
        showNotificationToast("🔥 已開啟危險熱點分析模式");
    } else {
        btn.classList.remove("heatmap-active");
        btn.innerHTML = `<i class="fas fa-fire"></i> 開啟危險熱點圖`;
        heatmapLayerGroup.clearLayers();
        showNotificationToast("已切換回標準地圖視圖");
    }
}

// Render Heatmap using colored circles
function drawHeatmap() {
    heatmapLayerGroup.clearLayers();

    points.forEach(point => {
        // Danger score determines color/opacity/radius
        let color = '#ef4444'; // Red
        let radius = 60;
        let opacity = 0.25;

        if (point.dangerLevel === 4) {
            color = '#f97316'; // Orange
            radius = 50;
            opacity = 0.22;
        } else if (point.dangerLevel === 3) {
            color = '#f59e0b'; // Yellow
            radius = 40;
            opacity = 0.18;
        }

        const circle = L.circle([point.lat, point.lng], {
            color: color,
            fillColor: color,
            fillOpacity: opacity,
            radius: radius,
            stroke: false,
            className: 'heatmap-circle-element'
        });

        // Glowing center
        const innerCircle = L.circle([point.lat, point.lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.45,
            radius: 8,
            stroke: false
        });

        circle.addTo(heatmapLayerGroup);
        innerCircle.addTo(heatmapLayerGroup);
    });
}

// Setup User UI interactions and Modals
function initUIEvents() {
    // Sidebar Close Button
    document.getElementById("sidebar-close").addEventListener("click", () => {
        document.getElementById("sidebar-right").classList.remove("active");
    });

    // Day/Night Theme Toggle
    const themeBtn = document.getElementById("theme-toggle-btn");
    themeBtn.addEventListener("click", () => {
        if (currentTheme === 'dark') {
            currentTheme = 'light';
            document.documentElement.setAttribute('data-theme', 'light');
            themeBtn.innerHTML = `<i class="fas fa-moon"></i> <span>🌙 夜間高感光</span>`;
            setMapStyle('light');
            showNotificationToast("☀️ 已切換至日間清晰地圖樣式");
        } else {
            currentTheme = 'dark';
            document.documentElement.removeAttribute('data-theme');
            themeBtn.innerHTML = `<i class="fas fa-sun"></i> <span>☀️ 日間清晰</span>`;
            setMapStyle('dark');
            showNotificationToast("🌙 已切換至夜間高感光地圖樣式");
        }
    });

    // Checkboxes for toggling layers
    const dangerCheckbox = document.getElementById("toggle-danger-layer");
    const leftTurnCheckbox = document.getElementById("toggle-leftturn-layer");

    dangerCheckbox.addEventListener("change", (e) => {
        showDangerLayer = e.target.checked;
        renderDangerPoints();
        showNotificationToast(showDangerLayer ? "⚠️ 已顯示危險路段標記" : "⚠️ 已隱藏危險路段標記");
    });

    leftTurnCheckbox.addEventListener("change", (e) => {
        showLeftTurnLayer = e.target.checked;
        renderDangerPoints();
        showNotificationToast(showLeftTurnLayer ? "🔄 已顯示兩段式左轉提示" : "🔄 已隱藏兩段式左轉提示");
    });

    // List Drawer collapsible behaviour
    const drawer = document.getElementById("list-drawer");
    const drawerToggle = document.getElementById("drawer-toggle");
    
    drawerToggle.addEventListener("click", () => {
        drawer.classList.add("active");
        drawerToggle.classList.add("hidden");
    });

    document.getElementById("drawer-close").addEventListener("click", () => {
        drawer.classList.remove("active");
        drawerToggle.classList.remove("hidden");
    });

    // Handle Comment Submit Clicking & Enter Press
    document.getElementById("comment-submit").addEventListener("click", submitComment);
    document.getElementById("comment-input").addEventListener("keypress", (e) => {
        if (e.key === 'Enter') submitComment();
    });

    // Voting clicking
    document.getElementById("upvote-btn").addEventListener("click", () => votePoint('up'));
    document.getElementById("downvote-btn").addEventListener("click", () => votePoint('down'));

    // Heatmap button toggle
    document.getElementById("heatmap-btn").addEventListener("click", toggleHeatmap);

    // Form submission
    document.getElementById("hazard-report-form").addEventListener("submit", submitReport);

    // Start Add Mode clicking
    document.getElementById("add-danger-btn").addEventListener("click", startAddingMode);

    // Profile Modal clicking triggers
    document.getElementById("header-profile").addEventListener("click", openUserSettingsPanel);

    // Login simulation buttons
    document.getElementById("modal-login-btn").addEventListener("click", (e) => {
        e.preventDefault();
        hideModal("login-modal");
        showNotificationToast("🔓 登入成功！已同步您的騎乘紀錄。");
        document.getElementById("user-profile-name").innerText = "陳同學";
    });

    // Search bar functionality
    document.getElementById("search-input").addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        filterMarkersAndList(query);
    });
}

// Open and load customized account settings card inside sidebar
function openUserSettingsPanel() {
    isAddingMode = false;
    selectedPoint = null;
    document.getElementById("onboarding-toast").classList.remove("show");

    const sidebar = document.getElementById("sidebar-right");
    const detailsView = document.getElementById("sidebar-details-view");
    const formView = document.getElementById("sidebar-form-view");
    const userSettingsView = document.getElementById("sidebar-settings-view");

    detailsView.style.display = "none";
    formView.style.display = "none";
    userSettingsView.style.display = "block";

    sidebar.classList.add("active");
}

// Modal open/close actions
function showModal(modalId) {
    document.getElementById(modalId).classList.add("active");
}

// Modal hide actions
function hideModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
}

// Filter markers based on search query
function filterMarkersAndList(query) {
    // Filter Danger points
    points.forEach(point => {
        const matches = showDangerLayer && (
                        point.title.toLowerCase().includes(query) || 
                        point.description.toLowerCase().includes(query) ||
                        point.hazardTypeName.toLowerCase().includes(query));
        
        const marker = markers[point.id];
        if (marker) {
            if (matches) {
                if (!map.hasLayer(marker)) marker.addTo(map);
            } else {
                if (map.hasLayer(marker)) map.removeLayer(marker);
            }
        }
    });

    // Filter Left Turn points
    leftTurnPoints.forEach(point => {
        const matches = showLeftTurnLayer && (
                        point.title.toLowerCase().includes(query) || 
                        point.description.toLowerCase().includes(query));
        
        const marker = leftTurnMarkers[point.id];
        if (marker) {
            if (matches) {
                if (!map.hasLayer(marker)) marker.addTo(map);
            } else {
                if (map.hasLayer(marker)) map.removeLayer(marker);
            }
        }
    });

    // Refresh Drawer list with matched items
    const listContainer = document.getElementById("drawer-items-list");
    listContainer.innerHTML = "";

    let combined = [];
    if (showDangerLayer) {
        combined = [...combined, ...points];
    }
    if (showLeftTurnLayer) {
        combined = [...combined, ...leftTurnPoints];
    }

    combined.sort((a, b) => b.dangerLevel - a.dangerLevel);

    combined.forEach(point => {
        const isLeft = point.isLeftTurn;
        const matches = point.title.toLowerCase().includes(query) || 
                        point.description.toLowerCase().includes(query) ||
                        (!isLeft && point.hazardTypeName.toLowerCase().includes(query));
        
        if (!matches) return;

        const item = document.createElement("div");
        item.className = "drawer-item";
        
        let badgeHtml = "";
        if (isLeft) {
            badgeHtml = `<span class="badge leftturn-badge">兩段式左轉</span>`;
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
            <div class="drawer-item-votes" style="color: ${isLeft ? 'var(--accent-cyan)' : 'var(--accent-blue)'}">
                <i class="fas fa-thumbs-up"></i> ${point.upvotes}
            </div>
        `;

        item.addEventListener("click", () => {
            map.panTo([point.lat, point.lng]);
            showPointDetails(point);
        });

        listContainer.appendChild(item);
    });
}

// Trigger floating cyber toasts notifications
function showNotificationToast(msg) {
    const toast = document.getElementById("notification-toast");
    document.getElementById("notification-msg").innerText = msg;
    
    toast.classList.add("show");
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3200);
}

// Helper to construct timestamp strings
function getCurrentDateTimeString() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}
