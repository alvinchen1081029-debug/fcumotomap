from flask import Blueprint, jsonify, request
from app.models import road, danger_zone

api_bp = Blueprint('api', __name__, url_prefix='/api')

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

@api_bp.route('/danger-zones', methods=['GET'])
def get_danger_zones():
    """Retrieve all reported danger zones."""
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
        
    new_id = danger_zone.create(lat_val, lng_val, title, description, rating_val)
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
