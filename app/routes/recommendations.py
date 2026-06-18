from flask import Blueprint, render_template, request, jsonify

recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('/recommendations', methods=['GET'])
def index():
    """
    渲染附近推薦功能的主網頁。
    提供篩選分類選項與 Leaflet.js 地圖展示區域。
    """
    pass

@recommendations_bp.route('/api/nearby', methods=['GET'])
def get_nearby():
    """
    附近推薦的核心 API。
    接收 HTTP GET 參數 lat (緯度), lng (經度), radius (半徑，公里), type (類型)。
    回傳經距離排序後的附近 POI 與危險路段列表 (JSON)。
    """
    pass
