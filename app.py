from flask import Flask, jsonify

app = Flask(__name__)

# 資料庫模擬：儲存你負責的「機車引道與地下道入口實景指引」數據
RAMPS_DATA = {
    1: {
        "name": "台灣大道民權路口機車地下道",
        "lat": 24.1486,
        "lng": 120.6738,
        "image_url": "https://images.unsplash.com/photo-1519074002996-a69e7ac46a42?w=500", 
        "guide_text": "【安全指引】此地下道入口位於慢車道右側。請騎士於前一個路口提前靠右行駛，切勿行駛於內側快車道，避免違規及來不及切換車道！"
    },
    2: {
        "name": "某某大橋機車專用引道",
        "lat": 24.1700,
        "lng": 120.6500,
        "image_url": "https://images.unsplash.com/photo-1541414779316-956a5084c0d4?w=500", 
        "guide_text": "【安全指引】上橋機車引道與汽車道有實體分隔。請在接近橋頭 100 公尺處注意右側機車專用標誌，提早切入專用引道，上橋後請勿任意變換車道。"
    }
}

# 路由 1：提供全台已建檔引道的座標給前端地圖標記
@app.route('/api/ramps', methods=['GET'])
def get_all_ramps():
    ramps_list = [{"id": k, "name": v["name"], "lat": v["lat"], "lng": v["lng"]} for k, v in RAMPS_DATA.items()]
    return jsonify(ramps_list)

# 路由 2：根據前端傳來的引道 ID，回傳該路口的實景照片與防呆指南
@app.route('/api/ramp/<int:ramp_id>', methods=['GET'])
def get_ramp_detail(ramp_id):
    ramp = RAMPS_DATA.get(ramp_id)
    if ramp:
        return jsonify(ramp)
    return jsonify({"error": "找不到該引道資料"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
