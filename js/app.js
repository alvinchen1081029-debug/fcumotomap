// FCU Moto Map - Danger Rating System Mock Application Logic

let points = [];
let toiletPoints = [];
let currentMode = 'danger';
let map;
let markers = {};
let selectedPoint = null;
let isAddingMode = false;
let newPointLatLng = null;
let currentRatingInput = 5;
let userVotes = {}; // Format: { pointId: 'up' | 'down' | null }
let heatmapLayerGroup = null;
let isHeatmapActive = false;

// Initialize Application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Clone mock data to local array to allow in-memory modifications
    points = JSON.parse(JSON.stringify(mockDangerPoints));
    toiletPoints = JSON.parse(JSON.stringify(mockToiletPoints));
    
    initMap();
    renderPoints();
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

    // Dark Map Style (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd'
    }).addTo(map);

    heatmapLayerGroup = L.layerGroup().addTo(map);

    // Map Click Handler
    map.on('click', handleMapClick);
}

// Generate animated HTML pulsing icon based on danger level
function createPulsingIcon(dangerLevel) {
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

// Generate animated HTML pulsing toilet icon
function createToiletIcon() {
    return L.divIcon({
        className: "hazard-pulse-marker toilet-pulse-marker",
        html: `
            <div class="pulse-ring"></div>
            <div class="pulse-dot" style="display:flex; align-items:center; justify-content:center; color:white; font-size:7px;"><i class="fas fa-restroom"></i></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
}

// Render points to Leaflet Map and List View based on currentMode
function renderPoints() {
    // Clear existing markers
    for (let id in markers) {
        map.removeLayer(markers[id]);
    }
    markers = {};

    const activePoints = currentMode === 'danger' ? points : toiletPoints;

    activePoints.forEach(point => {
        let markerIcon;
        if (currentMode === 'danger') {
            markerIcon = createPulsingIcon(point.dangerLevel);
        } else {
            markerIcon = createToiletIcon();
        }

        const marker = L.marker([point.lat, point.lng], {
            icon: markerIcon
        });

        // Tooltip text
        let tooltipHTML;
        if (currentMode === 'danger') {
            tooltipHTML = `
                <div style="background-color: var(--bg-secondary); color: white; border: 1px solid var(--glass-border); padding: 5px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem;">
                    <span style="color: var(--accent-red); margin-right: 5px;">★ ${point.dangerLevel}</span> ${point.title}
                </div>
            `;
        } else {
            tooltipHTML = `
                <div style="background-color: var(--bg-secondary); color: white; border: 1px solid var(--glass-border); padding: 5px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8rem;">
                    <span style="color: var(--accent-cyan); margin-right: 5px;"><i class="fas fa-restroom"></i></span> ${point.title}
                </div>
            `;
        }

        marker.bindTooltip(tooltipHTML, {
            direction: 'top',
            offset: [0, -10],
            opacity: 0.9,
            className: 'custom-map-tooltip'
        });

        // Click event opens sidebar details
        marker.on('click', () => {
            showPointDetails(point);
        });

        marker.addTo(map);
        markers[point.id] = marker;
    });

    renderListView();
    if (isHeatmapActive) {
        drawHeatmap();
    }
}

// Update Header Stats
function updateGlobalStats() {
    const totalPoints = currentMode === 'danger' ? points.length : toiletPoints.length;
    document.getElementById("total-danger-spots").innerText = totalPoints;
    
    // Change label text dynamically
    const labelSpan = document.querySelector(".stat-pill.spots span");
    if (labelSpan) {
        labelSpan.innerText = currentMode === 'danger' ? "危險路標:" : "公共廁所:";
    }
    
    const activePointsList = currentMode === 'danger' ? points : toiletPoints;
    const totalVotes = activePointsList.reduce((sum, p) => sum + p.upvotes + p.downvotes, 0);
    document.getElementById("total-votes-count").innerText = totalVotes;
}

// Render Sidebar List View
function renderListView() {
    const listContainer = document.getElementById("drawer-items-list");
    listContainer.innerHTML = "";

    const activePoints = currentMode === 'danger' ? points : toiletPoints;

    // Sort by level/rating descending
    let sortedPoints;
    if (currentMode === 'danger') {
        sortedPoints = [...activePoints].sort((a, b) => b.dangerLevel - a.dangerLevel);
    } else {
        sortedPoints = [...activePoints].sort((a, b) => b.cleanliness - a.cleanliness);
    }

    sortedPoints.forEach(point => {
        const item = document.createElement("div");
        item.className = "drawer-item";
        
        let metaBadge;
        if (currentMode === 'danger') {
            metaBadge = `<span class="badge danger-${point.dangerLevel}">危險度 ${point.dangerLevel}</span>`;
        } else {
            metaBadge = `<span class="badge toilet-tag">🚽 乾淨度 ${point.cleanliness}</span>`;
        }

        item.innerHTML = `
            <div>
                <div class="drawer-item-title">${point.title}</div>
                <div class="drawer-item-meta">
                    ${metaBadge}
                    <span><i class="far fa-comment"></i> ${point.comments.length} 則留言</span>
                </div>
            </div>
            <div class="drawer-item-votes">
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

// Show Danger/Toilet Point Details in Sidebar
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
    
    const isToilet = point.toiletType !== undefined;
    
    // Set titles/labels dynamically
    document.getElementById("detail-desc-label").innerText = isToilet ? "公廁環境與停車描述" : "騎士回報詳情";
    
    if (isToilet) {
        document.getElementById("detail-hazard-name").innerText = point.toiletTypeName;
        document.getElementById("detail-hazard-name").className = "hazard-type-tag toilet-tag";
        
        // Show Toilet details card
        document.getElementById("toilet-details-card").style.display = "block";
        document.getElementById("detail-toilet-hours").innerText = point.hours;
        
        // Toilet attribute indicators
        toggleIndicatorCard("detail-toilet-paper", point.hasPaper);
        toggleIndicatorCard("detail-toilet-accessible", point.isAccessible);
        toggleIndicatorCard("detail-toilet-parking", point.motorcycleFriendly);
    } else {
        document.getElementById("detail-hazard-name").innerText = point.hazardTypeName;
        document.getElementById("detail-hazard-name").className = "hazard-type-tag";
        
        // Hide Toilet details card
        document.getElementById("toilet-details-card").style.display = "none";
    }
    
    document.getElementById("detail-description").innerText = point.description;
    document.getElementById("detail-reporter").innerText = point.reporter;
    document.getElementById("detail-time").innerText = point.reportTime;

    // Draw Stars
    const starContainer = document.getElementById("detail-stars");
    starContainer.innerHTML = "";
    const ratingVal = isToilet ? point.cleanliness : point.dangerLevel;
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement("i");
        star.className = i <= ratingVal ? "fas fa-star" : "far fa-star";
        starContainer.appendChild(star);
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

// Helper to toggle detail indicators
function toggleIndicatorCard(elementId, isActive) {
    const el = document.getElementById(elementId);
    if (el) {
        if (isActive) {
            el.className = "toilet-indicator-card active";
        } else {
            el.className = "toilet-indicator-card inactive";
        }
    }
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
    
    // Toggle form attributes based on mode
    const isToilet = currentMode === 'toilet';
    
    // Toggle toilet fields
    document.getElementById("form-toilet-attributes").style.display = isToilet ? "block" : "none";
    document.getElementById("form-toilet-hours-group").style.display = isToilet ? "block" : "none";
    
    // Initialize stars style
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
        
        // Populate options with toilet types
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
        
        // Populate options with hazard types
        populateFormHazardType(hazardTypes);
    }
    
    resetStarRatingInput();

    sidebar.classList.add("active");
    
    // Pan map to selection
    map.panTo([lat, lng - 0.0015]);
}

// Populate form hazard/toilet type select dropdown
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

// Submit New Danger/Toilet Point
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

        points.push(newPoint);
        renderPoints();
        updateGlobalStats();
        showPointDetails(newPoint);
        showNotificationToast("🎉 危險點回報成功！感謝您的守護！");
    } else {
        const typeNames = {
            gas_station: "中油加油站公廁",
            campus: "學校教學大樓公廁",
            convenience_store: "超商附設公廁",
            park: "市政公園公廁",
            other: "其他公共廁所"
        };

        const hours = document.getElementById("form-toilet-hours").value.trim() || "24 小時開放";
        const hasPaper = document.getElementById("form-has-paper").checked;
        const isAccessible = document.getElementById("form-is-accessible").checked;
        const motorcycleFriendly = document.getElementById("form-motorcycle-friendly").checked;

        const newToilet = {
            id: toiletPoints.length + 101, // offset to avoid conflict
            title: title,
            lat: newPointLatLng.lat,
            lng: newPointLatLng.lng,
            cleanliness: currentRatingInput,
            toiletType: typeKey,
            toiletTypeName: typeNames[typeKey],
            hasPaper: hasPaper,
            isAccessible: isAccessible,
            motorcycleFriendly: motorcycleFriendly,
            hours: hours,
            reporter: "逢甲新鮮人",
            reportTime: getCurrentDateTimeString(),
            description: description,
            upvotes: 0,
            downvotes: 0,
            comments: []
        };

        toiletPoints.push(newToilet);
        renderPoints();
        updateGlobalStats();
        showPointDetails(newToilet);
        showNotificationToast("🎉 公共廁所回報成功！騎士們感謝您！");
    }
}

// Toggle Heatmap Overlay Simulation
function toggleHeatmap() {
    isHeatmapActive = !isHeatmapActive;
    const btn = document.getElementById("heatmap-btn");

    if (isHeatmapActive) {
        btn.classList.add("heatmap-active");
        if (currentMode === 'danger') {
            btn.innerHTML = `<i class="fas fa-layer-group"></i> 關閉危險熱點圖`;
            drawHeatmap();
            showNotificationToast("🔥 已開啟危險熱點分析模式");
        } else {
            btn.innerHTML = `<i class="fas fa-layer-group"></i> 關閉公廁分佈圖`;
            drawHeatmap();
            showNotificationToast("🚻 已開啟公廁分佈分析模式");
        }
    } else {
        btn.classList.remove("heatmap-active");
        if (currentMode === 'danger') {
            btn.innerHTML = `<i class="fas fa-fire"></i> 開啟危險熱點圖`;
        } else {
            btn.innerHTML = `<i class="fas fa-fire"></i> 開啟公廁分佈圖`;
        }
        heatmapLayerGroup.clearLayers();
        showNotificationToast("已切換回標準地圖視圖");
    }
}

// Render Heatmap using colored circles
function drawHeatmap() {
    heatmapLayerGroup.clearLayers();

    const activePoints = currentMode === 'danger' ? points : toiletPoints;

    activePoints.forEach(point => {
        let color, radius, opacity;
        
        if (currentMode === 'danger') {
            color = '#ef4444'; // Red
            radius = 60;
            opacity = 0.25;

            if (point.dangerLevel === 4) {
                color = '#f97316'; // Orange
                radius = 50;
                opacity = 0.22;
            } else if (point.dangerLevel === 3) {
                color = '#f59e0b'; // Yellow
                radius = 40;
                opacity = 0.18;
            }
        } else {
            color = '#06b6d4'; // Cyan
            radius = 55;
            opacity = 0.22;

            if (point.cleanliness === 4) {
                radius = 45;
                opacity = 0.18;
            } else if (point.cleanliness === 3) {
                radius = 35;
                opacity = 0.15;
            }
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

    // Mode Switcher clicking
    const modeDangerBtn = document.getElementById("mode-danger-btn");
    const modeToiletBtn = document.getElementById("mode-toilet-btn");

    modeDangerBtn.addEventListener("click", () => {
        if (currentMode === 'danger') return;
        switchMode('danger');
    });

    modeToiletBtn.addEventListener("click", () => {
        if (currentMode === 'toilet') return;
        switchMode('toilet');
    });
}

// Switch active map mode (Danger points vs Toilets)
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

    // Close right sidebar
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
        searchInput.placeholder = "搜尋路段、交叉路口或分類...";
        
        // Reset heatmap button text
        if (isHeatmapActive) {
            heatmapBtn.innerHTML = `<i class="fas fa-layer-group"></i> 關閉危險熱點圖`;
        } else {
            heatmapBtn.innerHTML = `<i class="fas fa-fire"></i> 開啟危險熱點圖`;
        }
    } else {
        modeDangerBtn.classList.remove("active");
        modeToiletBtn.classList.add("active");
        
        legendDanger.style.display = "none";
        legendToilet.style.display = "block";
        
        addBtn.innerHTML = `<i class="fas fa-plus-circle"></i> + 回報公共廁所`;
        addBtn.style.borderLeftColor = "var(--accent-cyan)";
        
        drawerTitle.innerText = "逢甲學區公廁清單";
        drawerToggleText.innerText = "瀏覽公廁清單";
        searchInput.placeholder = "搜尋公廁、地點、超商、公園...";
        
        // Reset heatmap button text
        if (isHeatmapActive) {
            heatmapBtn.innerHTML = `<i class="fas fa-layer-group"></i> 關閉公廁分佈圖`;
        } else {
            heatmapBtn.innerHTML = `<i class="fas fa-fire"></i> 開啟公廁分佈圖`;
        }
    }

    // Reset search
    searchInput.value = "";

    // Re-render
    renderPoints();
    updateGlobalStats();
    showNotificationToast(mode === 'danger' ? "已切換至危險路段模式" : "已切換至公廁尋找模式");
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

function hideModal(modalId) {
    document.getElementById(modalId).classList.remove("active");
}

// Filter markers based on search query
function filterMarkersAndList(query) {
    const activePoints = currentMode === 'danger' ? points : toiletPoints;

    activePoints.forEach(point => {
        let matches;
        if (currentMode === 'danger') {
            matches = point.title.toLowerCase().includes(query) || 
                      point.description.toLowerCase().includes(query) ||
                      point.hazardTypeName.toLowerCase().includes(query);
        } else {
            matches = point.title.toLowerCase().includes(query) || 
                      point.description.toLowerCase().includes(query) ||
                      point.toiletTypeName.toLowerCase().includes(query);
        }
        
        const marker = markers[point.id];
        if (marker) {
            if (matches) {
                if (!map.hasLayer(marker)) marker.addTo(map);
            } else {
                if (map.hasLayer(marker)) map.removeLayer(marker);
            }
        }
    });

    // Refresh Drawer list
    const listContainer = document.getElementById("drawer-items-list");
    let sortedPoints;
    if (currentMode === 'danger') {
        sortedPoints = [...activePoints].sort((a, b) => b.dangerLevel - a.dangerLevel);
    } else {
        sortedPoints = [...activePoints].sort((a, b) => b.cleanliness - a.cleanliness);
    }
    
    listContainer.innerHTML = "";
    sortedPoints.forEach(point => {
        let matches;
        if (currentMode === 'danger') {
            matches = point.title.toLowerCase().includes(query) || 
                      point.description.toLowerCase().includes(query) ||
                      point.hazardTypeName.toLowerCase().includes(query);
        } else {
            matches = point.title.toLowerCase().includes(query) || 
                      point.description.toLowerCase().includes(query) ||
                      point.toiletTypeName.toLowerCase().includes(query);
        }
        
        if (!matches) return;

        const item = document.createElement("div");
        item.className = "drawer-item";
        
        let metaBadge;
        if (currentMode === 'danger') {
            metaBadge = `<span class="badge danger-${point.dangerLevel}">危險度 ${point.dangerLevel}</span>`;
        } else {
            metaBadge = `<span class="badge toilet-tag">🚽 乾淨度 ${point.cleanliness}</span>`;
        }

        item.innerHTML = `
            <div>
                <div class="drawer-item-title">${point.title}</div>
                <div class="drawer-item-meta">
                    ${metaBadge}
                    <span><i class="far fa-comment"></i> ${point.comments.length} 則留言</span>
                </div>
            </div>
            <div class="drawer-item-votes">
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
