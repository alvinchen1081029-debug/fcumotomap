from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from app.models.intersection import (
    create_intersection,
    get_all_intersections,
    get_intersection_by_id,
    update_intersection,
    delete_intersection
)

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Renders the main map homepage."""
    intersections = get_all_intersections()
    return render_template('index.html', intersections=intersections)

@main_bp.route('/api/intersections', methods=['GET'])
def api_get_intersections():
    """API endpoint to get all intersections in JSON format."""
    intersections = get_all_intersections()
    return jsonify(intersections)

@main_bp.route('/api/intersections', methods=['POST'])
def api_create_intersection():
    """API or form submission to report a new intersection."""
    # Check if request content type is JSON
    if request.is_json:
        data = request.get_json()
        name = data.get('name')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        requires_two_stage = data.get('requires_two_stage', 1)
        description = data.get('description', '')
    else:
        # Fallback to form data
        name = request.form.get('name')
        latitude = request.form.get('latitude')
        longitude = request.form.get('longitude')
        requires_two_stage = request.form.get('requires_two_stage', 1)
        description = request.form.get('description', '')

    # Simple validation
    if not name or latitude is None or longitude is None:
        if request.is_json:
            return jsonify({'error': 'Missing required fields: name, latitude, longitude'}), 400
        else:
            flash('請填寫所有必要欄位（名稱、經度、緯度）！', 'danger')
            return redirect(url_for('main.index'))

    # Convert values and validate
    try:
        latitude = float(latitude)
        longitude = float(longitude)
        requires_two_stage = int(requires_two_stage)
    except ValueError:
        if request.is_json:
            return jsonify({'error': 'Invalid format for latitude, longitude, or requires_two_stage'}), 400
        else:
            flash('經緯度或左轉類別格式不正確！', 'danger')
            return redirect(url_for('main.index'))

    # Insert database record
    new_id = create_intersection(name, latitude, longitude, requires_two_stage, description)
    
    if new_id:
        if request.is_json:
            return jsonify({
                'success': True,
                'message': '路口提示建立成功！',
                'id': new_id
            }), 201
        else:
            flash(f'成功新增路口「{name}」的提示設定！', 'success')
            return redirect(url_for('main.index'))
    else:
        if request.is_json:
            return jsonify({'error': 'Failed to write to database'}), 500
        else:
            flash('新增路口時發生資料庫錯誤！', 'danger')
            return redirect(url_for('main.index'))

@main_bp.route('/api/intersections/<int:id>/delete', methods=['POST'])
def api_delete_intersection(id):
    """Deletes an intersection rule. We use POST here as standard HTML forms don't support DELETE/PUT."""
    success = delete_intersection(id)
    if success:
        if request.is_json or request.args.get('format') == 'json':
            return jsonify({'success': True, 'message': '路口提示已刪除！'})
        else:
            flash('路口提示已成功刪除！', 'success')
            return redirect(url_for('main.index'))
    else:
        if request.is_json or request.args.get('format') == 'json':
            return jsonify({'error': 'Failed to delete intersection'}), 500
        else:
            flash('刪除路口提示時發生錯誤！', 'danger')
            return redirect(url_for('main.index'))
