from flask import Blueprint, jsonify, request
from app.models import road, danger_zone, intersection, poi

api_bp = Blueprint('api', __name__, url_prefix='/api')

# ==========================================
# ROADS API
# ==========================================

@api_bp.route('/roads', methods=['GET'])
def get_roads():
    """Retrieve list of roads, optionally filtered by name, traffic level, and turn rules."""
    name = request.args.get('name', '').strip()
    traffic_level = request.args.get('traffic_level', '').strip()
    two_stage_turn = request.args.get('two_stage_turn', '').strip()
    
    filtered_roads = road.get_filtered_roads(
        name=name if name else None,
        traffic_level=traffic_level if traffic_level else None,
        two_stage_turn=two_stage_turn if two_stage_turn else None
    )
    return jsonify(filtered_roads)

# ==========================================
# DANGER ZONES API
# ==========================================

@api_bp.route('/danger-zones', methods=['GET'])
def get_danger_zones():
    """Retrieve all reported danger zones (with comments attached)."""
    zones = danger_zone.get_all()
    return jsonify(zones)

@api_bp.route('/danger-zones', methods=['POST'])
def create_danger_zone():
    """Create a new danger zone from JSON request body."""
    data = request.get_json() or {}
    
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    rating = data.get('rating')
    hazard_type = data.get('hazard_type', 'other').strip()
    reporter = data.get('reporter', '匿名騎士').strip()
    
    if latitude is None or longitude is None or not title or not description or rating is None:
        return jsonify({"error": "缺少必填欄位！"}), 400
        
    try:
        lat_val = float(latitude)
        lng_val = float(longitude)
        rating_val = int(rating)
        
        if not (1 <= rating_val <= 5):
            return jsonify({"error": "評分必須介於 1 到 5 星之間！"}), 400
            
    except (ValueError, TypeError):
        return jsonify({"error": "輸入的資料格式不正確！"}), 400
        
    new_id = danger_zone.create(lat_val, lng_val, title, description, rating_val, hazard_type, reporter)
    if new_id:
        return jsonify({"status": "success", "id": new_id}), 201
    else:
        return jsonify({"error": "資料庫新增失敗"}), 500

@api_bp.route('/danger-zones/<int:id>/vote', methods=['POST'])
def vote_danger_zone(id):
    """Cast a vote (upvote/downvote) for a danger zone."""
    data = request.get_json() or {}
    vote_type = data.get('type')
    
    if vote_type not in ['upvote', 'downvote']:
        return jsonify({"error": "不合法的投票類型"}), 400
        
    zone = danger_zone.get_by_id(id)
    if not zone:
        return jsonify({"error": "找不到該點位"}), 404
        
    updated = danger_zone.vote(id, vote_type)
    if updated:
        return jsonify({
            "status": "success", 
            "upvotes": updated['upvotes'], 
            "downvotes": updated['downvotes']
        })
    else:
        return jsonify({"error": "投票失敗"}), 500

@api_bp.route('/danger-zones/<int:id>/comments', methods=['POST'])
def add_danger_zone_comment(id):
    """Add a comment to a danger zone via AJAX."""
    data = request.get_json() or {}
    author = data.get('author', '匿名騎士').strip()
    content = data.get('content', '').strip()
    
    if not content:
        return jsonify({"error": "留言內容不得為空！"}), 400
        
    zone = danger_zone.get_by_id(id)
    if not zone:
        return jsonify({"error": "找不到該點位"}), 404
        
    comment_id = danger_zone.add_comment(id, author, content)
    if comment_id:
        return jsonify({"status": "success", "id": comment_id}), 201
    else:
        return jsonify({"error": "留言失敗"}), 500

# ==========================================
# INTERSECTIONS (LEFT TURN) API
# ==========================================

@api_bp.route('/intersections', methods=['GET'])
def get_intersections():
    """Retrieve all intersections turn rules."""
    items = intersection.get_all_intersections()
    return jsonify(items)

@api_bp.route('/intersections', methods=['POST'])
def create_intersection():
    """Create a new intersection configuration rule."""
    data = request.get_json() or {}
    
    name = data.get('name', '').strip()
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    requires_two_stage = data.get('requires_two_stage', 1)
    description = data.get('description', '').strip()
    waiting_area_size = data.get('waiting_area_size', '中等').strip()
    crowd_level = data.get('crowd_level', '中等').strip()
    safety_rating = data.get('safety_rating', 3)
    reporter = data.get('reporter', '系統管理員').strip()
    
    if not name or latitude is None or longitude is None:
        return jsonify({"error": "缺少必要欄位！"}), 400
        
    try:
        lat_val = float(latitude)
        lng_val = float(longitude)
        requires_two_stage_val = int(requires_two_stage)
        safety_rating_val = int(safety_rating)
    except (ValueError, TypeError):
        return jsonify({"error": "資料格式不正確！"}), 400
        
    new_id = intersection.create_intersection(
        name=name,
        latitude=lat_val,
        longitude=lng_val,
        requires_two_stage=requires_two_stage_val,
        description=description,
        waiting_area_size=waiting_area_size,
        crowd_level=crowd_level,
        safety_rating=safety_rating_val,
        reporter=reporter
    )
    
    if new_id:
        return jsonify({"success": True, "status": "success", "id": new_id}), 201
    else:
        return jsonify({"error": "資料庫新增失敗"}), 500

@api_bp.route('/intersections/<int:id>/vote', methods=['POST'])
def vote_intersection(id):
    """Cast a vote for an intersection turn rule."""
    data = request.get_json() or {}
    vote_type = data.get('type')
    
    if vote_type not in ['upvote', 'downvote']:
        return jsonify({"error": "不合法的投票類型"}), 400
        
    item = intersection.get_intersection_by_id(id)
    if not item:
        return jsonify({"error": "找不到該點位"}), 404
        
    updated = intersection.vote(id, vote_type)
    if updated:
        return jsonify({
            "status": "success", 
            "upvotes": updated['upvotes'], 
            "downvotes": updated['downvotes']
        })
    else:
        return jsonify({"error": "投票失敗"}), 500

@api_bp.route('/intersections/<int:id>/comments', methods=['POST'])
def add_intersection_comment(id):
    """Add a comment on an intersection turn rule."""
    data = request.get_json() or {}
    author = data.get('author', '匿名騎士').strip()
    content = data.get('content', '').strip()
    
    if not content:
        return jsonify({"error": "留言內容不得為空！"}), 400
        
    item = intersection.get_intersection_by_id(id)
    if not item:
        return jsonify({"error": "找不到該點位"}), 404
        
    comment_id = intersection.add_comment(id, author, content)
    if comment_id:
        return jsonify({"status": "success", "id": comment_id}), 201
    else:
        return jsonify({"error": "留言失敗"}), 500

@api_bp.route('/intersections/<int:id>/delete', methods=['POST'])
def api_delete_intersection(id):
    """Deletes an intersection turn rule."""
    success = intersection.delete_intersection(id)
    if success:
        return jsonify({'success': True, 'message': '路口提示已刪除！'})
    else:
        return jsonify({'error': 'Failed to delete intersection'}), 500

# ==========================================
# POIs (TOILETS, GAS STATIONS, PARKING LOTS) API
# ==========================================

@api_bp.route('/pois', methods=['GET'])
def get_pois():
    """Retrieve all POI records."""
    items = poi.get_all()
    return jsonify(items)

@api_bp.route('/pois', methods=['POST'])
def create_poi():
    """Create a new POI record (like a public toilet)."""
    data = request.get_json() or {}
    
    name = data.get('name', '').strip()
    type_name = data.get('type', 'toilet').strip()
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    address = data.get('address', '').strip()
    phone = data.get('phone', '').strip()
    rating = data.get('rating', 3.0) # Cleanliness for toilet
    description = data.get('description', '').strip()
    toilet_type = data.get('toilet_type', 'other').strip()
    has_paper = data.get('has_paper', 0)
    is_accessible = data.get('is_accessible', 0)
    motorcycle_friendly = data.get('motorcycle_friendly', 0)
    hours = data.get('hours', '24 小時開放').strip()
    services = data.get('services') # JSON string for amenities
    reporter = data.get('reporter', '匿名騎士').strip()
    
    if not name or latitude is None or longitude is None:
        return jsonify({"error": "缺少必要欄位！"}), 400
        
    try:
        lat_val = float(latitude)
        lng_val = float(longitude)
        rating_val = float(rating)
        has_paper_val = int(has_paper)
        is_accessible_val = int(is_accessible)
        motorcycle_friendly_val = int(motorcycle_friendly)
    except (ValueError, TypeError):
        return jsonify({"error": "資料格式不正確！"}), 400
        
    new_id = poi.create(
        name=name,
        type=type_name,
        latitude=lat_val,
        longitude=lng_val,
        address=address,
        phone=phone,
        rating=rating_val,
        description=description,
        toilet_type=toilet_type,
        has_paper=has_paper_val,
        is_accessible=is_accessible_val,
        motorcycle_friendly=motorcycle_friendly_val,
        hours=hours,
        services=services,
        reporter=reporter
    )
    
    if new_id:
        return jsonify({"success": True, "status": "success", "id": new_id}), 201
    else:
        return jsonify({"error": "資料庫新增失敗"}), 500

@api_bp.route('/pois/<int:id>/vote', methods=['POST'])
def vote_poi(id):
    """Cast a vote for a POI."""
    data = request.get_json() or {}
    vote_type = data.get('type')
    
    if vote_type not in ['upvote', 'downvote']:
        return jsonify({"error": "不合法的投票類型"}), 400
        
    item = poi.get_by_id(id)
    if not item:
        return jsonify({"error": "找不到該點位"}), 404
        
    updated = poi.vote(id, vote_type)
    if updated:
        return jsonify({
            "status": "success", 
            "upvotes": updated['upvotes'], 
            "downvotes": updated['downvotes']
        })
    else:
        return jsonify({"error": "投票失敗"}), 500

@api_bp.route('/pois/<int:id>/comments', methods=['POST'])
def add_poi_comment(id):
    """Add a comment on a POI."""
    data = request.get_json() or {}
    author = data.get('author', '匿名騎士').strip()
    content = data.get('content', '').strip()
    
    if not content:
        return jsonify({"error": "留言內容不得為空！"}), 400
        
    item = poi.get_by_id(id)
    if not item:
        return jsonify({"error": "找不到該點位"}), 404
        
    comment_id = poi.add_comment(id, author, content)
    if comment_id:
        return jsonify({"status": "success", "id": comment_id}), 201
    else:
        return jsonify({"error": "留言失敗"}), 500
