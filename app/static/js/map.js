// Map Management & Interactions

let map;
let roadLayers = [];
let dangerMarkers = [];

// Initialize Map when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    setupEventListeners();
    
    // Check if query parameters specify coordinates to focus on
    const urlParams = new URLSearchParams(window.location.search);
    const focusLat = urlParams.get('lat');
    const focusLng = urlParams.get('lng');
    
    if (focusLat && focusLng) {
        // Center map to focused coordinate and zoom in
        map.setView([parseFloat(focusLat), parseFloat(focusLng)], 17);
    }
});

function initMap() {
    // Default Center around Feng Chia University
    const defaultCenter = [24.1798, 120.6486];
    map = L.map('map', {
        zoomControl: false // Add it later in custom position
    }).setView(defaultCenter, 15);

    // Beautiful CartoDB Voyager map tiles (good color contrast and details)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Add Zoom Control to Top Right
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // Initial Data Fetch
    fetchRoads();
    fetchDangerZones();
}

// Fetch and draw roads
function fetchRoads() {
    // Collect Filter Values
    const searchVal = document.getElementById('searchRoad').value;
    const trafficVal = document.querySelector('input[name="trafficLevel"]:checked')?.value || 'all';
    
    // For safety, query checked input specifically
    const trafficRadios = document.getElementsByName('trafficLevel');
    let selectedTraffic = 'all';
    for (let r of trafficRadios) {
        if (r.checked) {
            selectedTraffic = r.value;
            break;
        }
    }

    const turnVal = document.getElementById('twoStageTurn').value;

    // Build Query String
    let queryParams = new URLSearchParams();
    if (searchVal) queryParams.append('name', searchVal);
    if (selectedTraffic && selectedTraffic !== 'all') queryParams.append('traffic_level', selectedTraffic);
    if (turnVal !== '') queryParams.append('two_stage_turn', turnVal);

    fetch(`/api/roads?${queryParams.toString()}`)
        .then(response => response.json())
        .then(roads => {
            clearRoadLayers();
            drawRoads(roads);
        })
        .catch(err => console.error('Error fetching roads:', err));
}

function clearRoadLayers() {
    roadLayers.forEach(layer => map.removeLayer(layer));
    roadLayers = [];
}

function drawRoads(roads) {
    roads.forEach(road => {
        if (!road.coordinates || road.coordinates.length < 2) return;

        // Determine Line Color based on Traffic Level
        let lineColor = '#10b981'; // Default: Success (green)
        let trafficText = '順暢';
        let badgeClass = 'badge-low';
        
        if (road.traffic_level === 'medium') {
            lineColor = '#f59e0b'; // Warning (orange)
            trafficText = '壅塞';
            badgeClass = 'badge-medium';
        } else if (road.traffic_level === 'high') {
            lineColor = '#ef4444'; // Danger (red)
            trafficText = '紫爆';
            badgeClass = 'badge-high';
        }

        // Draw Polyline
        const polyline = L.polyline(road.coordinates, {
            color: lineColor,
            weight: 6,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(map);

        // Hover animation
        polyline.on('mouseover', function(e) {
            polyline.setStyle({
                weight: 9,
                opacity: 1.0
            });
        });

        polyline.on('mouseout', function(e) {
            polyline.setStyle({
                weight: 6,
                opacity: 0.8
            });
        });

        // Popup Content
        const turnText = road.two_stage_turn == 1 
            ? '<i class="bi bi-arrow-repeat text-danger"></i> 需要兩段式左轉 (待轉)' 
            : '<i class="bi bi-arrow-right text-success"></i> 無需待轉 (可直接左轉)';

        const popupContent = `
            <div style="min-width: 200px;">
                <div class="popup-road-title">${road.name}</div>
                <span class="popup-traffic-badge ${badgeClass}">車流量：${trafficText}</span>
                <div class="small text-light-custom mb-2">
                    <strong>道路規則：</strong><br>
                    ${turnText}
                </div>
                <div class="small text-muted border-top pt-2">
                    ${road.description || '無詳細說明。'}
                </div>
            </div>
        `;
        
        polyline.bindPopup(popupContent);
        roadLayers.push(polyline);
    });
}

// Fetch and draw danger zone markers
function fetchDangerZones() {
    fetch('/api/danger-zones')
        .then(response => response.json())
        .then(zones => {
            clearDangerMarkers();
            drawDangerMarkers(zones);
        })
        .catch(err => console.error('Error fetching danger zones:', err));
}

function clearDangerMarkers() {
    dangerMarkers.forEach(marker => map.removeLayer(marker));
    dangerMarkers = [];
}

function drawDangerMarkers(zones) {
    zones.forEach(zone => {
        // Custom Pulsing Danger Spot HTML Icon
        const dangerIcon = L.divIcon({
            html: `
                <div class="danger-marker-wrapper animate-pulse" style="
                    background: rgba(239, 68, 68, 0.25);
                    border: 2px solid #ef4444;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
                ">
                    <i class="bi bi-exclamation-triangle-fill" style="color: #ef4444; font-size: 14px;"></i>
                </div>
            `,
            className: 'custom-danger-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        // Add Marker
        const marker = L.marker([zone.latitude, zone.longitude], { icon: dangerIcon }).addTo(map);

        // Generate stars markup
        let starsHtml = '';
        for (let i = 0; i < 5; i++) {
            if (i < zone.rating) {
                starsHtml += '<i class="bi bi-star-fill text-warning"></i>';
            } else {
                starsHtml += '<i class="bi bi-star text-warning"></i>';
            }
        }

        const popupContent = `
            <div style="min-width: 220px; font-family: 'Outfit', 'Noto Sans TC', sans-serif;">
                <div class="fw-bold text-light mb-1 d-flex align-items-center gap-1">
                    <i class="bi bi-exclamation-octagon-fill text-danger"></i> ${zone.title}
                </div>
                <div class="mb-2 text-warning small">
                    ${starsHtml} <span class="text-muted">(${zone.rating}星級)</span>
                </div>
                <div class="text-muted small mb-2 text-truncate-3">
                    ${zone.description}
                </div>
                <div class="d-flex justify-content-between text-light-custom small mb-3 border-top pt-2">
                    <span><i class="bi bi-hand-thumbs-up-fill text-success me-1"></i> ${zone.upvotes}</span>
                    <span><i class="bi bi-hand-thumbs-down-fill text-danger me-1"></i> ${zone.downvotes}</span>
                </div>
                <a href="/danger-zones/${zone.id}" class="btn btn-primary btn-sm rounded-pill text-white w-100 font-outfit" style="font-size: 0.75rem;">
                    查看討論與投票 <i class="bi bi-chat-fill ms-1"></i>
                </a>
            </div>
        `;

        marker.bindPopup(popupContent);
        dangerMarkers.push(marker);
    });
}

function setupEventListeners() {
    // 1. Inputs triggers re-fetch of roads
    document.getElementById('searchRoad').addEventListener('input', debounce(fetchRoads, 300));
    
    const trafficRadios = document.getElementsByName('trafficLevel');
    trafficRadios.forEach(radio => {
        radio.addEventListener('change', fetchRoads);
    });

    document.getElementById('twoStageTurn').addEventListener('change', fetchRoads);

    // Reset Filters button
    document.getElementById('resetFilters').addEventListener('click', function() {
        document.getElementById('searchRoad').value = '';
        document.getElementById('trafficAll').checked = true;
        document.getElementById('twoStageTurn').value = '';
        fetchRoads();
    });

    // 2. Map Context Menu (Right Click) to Report Danger Zone
    map.on('contextmenu', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        openReportModal(lat, lng);
    });

    // 3. Modal Star Rating Buttons Selection
    const starLabels = document.querySelectorAll('.rating-select label');
    starLabels.forEach(label => {
        label.addEventListener('click', function() {
            // Remove active from all labels
            starLabels.forEach(l => {
                l.classList.remove('active');
                // Replace filled icon with empty icon
                const icon = l.querySelector('i');
                if (icon) {
                    icon.className = 'bi bi-star';
                }
            });
            // Add active to clicked and all stars before it (optional, let's keep it simple: just highlight current button)
            this.classList.add('active');
            const clickedIcon = this.querySelector('i');
            if (clickedIcon) {
                clickedIcon.className = 'bi bi-star-fill';
            }
        });
    });

    // 4. Modal Submit Form Click Handler
    document.getElementById('submitReportBtn').addEventListener('click', submitReport);
}

// Open Report Modal at clicked coordinates
function openReportModal(lat, lng) {
    // Fill coordinates
    document.getElementById('reportLat').value = lat;
    document.getElementById('reportLng').value = lng;
    document.getElementById('displayCoords').textContent = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    
    // Clear inputs
    document.getElementById('reportTitle').value = '';
    document.getElementById('reportDesc').value = '';
    
    // Reset star rating to 3
    document.getElementById('star3').checked = true;
    const starLabels = document.querySelectorAll('.rating-select label');
    starLabels.forEach(l => {
        l.classList.remove('active');
        const icon = l.querySelector('i');
        if (icon) icon.className = 'bi bi-star';
    });
    const star3Label = document.querySelector('label[for="star3"]');
    if (star3Label) {
        star3Label.classList.add('active');
        const icon = star3Label.querySelector('i');
        if (icon) icon.className = 'bi bi-star-fill';
    }

    // Open Modal
    const reportModal = new bootstrap.Modal(document.getElementById('reportModal'));
    reportModal.show();
}

// Submit Danger Report Form
function submitReport() {
    const lat = document.getElementById('reportLat').value;
    const lng = document.getElementById('reportLng').value;
    const title = document.getElementById('reportTitle').value.trim();
    const description = document.getElementById('reportDesc').value.trim();
    
    // Get Checked Rating value
    const ratingRadios = document.getElementsByName('rating');
    let rating = 3;
    for (let r of ratingRadios) {
        if (r.checked) {
            rating = r.value;
            break;
        }
    }

    if (!title || !description) {
        alert('請填寫所有必要欄位！');
        return;
    }

    // Disable button to prevent double tap
    const submitBtn = document.getElementById('submitReportBtn');
    submitBtn.disabled = true;

    fetch('/api/danger-zones', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            title: title,
            description: description,
            rating: rating
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error || '回報失敗') });
        }
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            // Close Modal
            const reportModalEl = document.getElementById('reportModal');
            const modalInstance = bootstrap.Modal.getInstance(reportModalEl);
            if (modalInstance) {
                modalInstance.hide();
            }

            // Refresh markers
            fetchDangerZones();
            
            // Show successful message in float alert
            showToastMessage('回報成功！已在地圖上標記此危險路段。', 'success');
        }
    })
    .catch(err => {
        alert('回報出錯：' + err.message);
    })
    .finally(() => {
        submitBtn.disabled = false;
    });
}

// Toast Notification Helper
function showToastMessage(message, type) {
    const container = document.querySelector('.flash-messages-container');
    if (!container) return;

    const category = type === 'success' ? 'success' : 'danger';
    const iconClass = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-octagon-fill';
    
    const toastHTML = `
        <div class="alert alert-custom alert-${category} alert-dismissible fade show shadow-lg" role="alert">
            <div class="d-flex align-items-center">
                <i class="bi ${iconClass} me-2 fs-5"></i>
                <div>${message}</div>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    
    const toastElement = document.createElement('div');
    toastElement.innerHTML = toastHTML;
    const alertEl = toastElement.firstElementChild;
    container.appendChild(alertEl);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertEl);
        bsAlert.close();
    }, 4000);
}

// Debounce helper to reduce DB queries on typing
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}
