from flask import Blueprint, render_template, request, redirect, url_for, flash
from app.models import danger_zone, road

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Render the main index page containing the Leaflet map."""
    return render_template('index.html')

@main_bp.route('/danger-zones')
def danger_zones_list():
    """Render the page listing all reported danger zones."""
    zones = danger_zone.get_all()
    return render_template('danger_zone_list.html', zones=zones)

@main_bp.route('/danger-zones/<int:id>')
def danger_zone_detail(id):
    """Render the detail page for a specific danger zone with its comments."""
    zone = danger_zone.get_by_id(id)
    if not zone:
        flash("找不到該危險路段資訊。", "error")
        return redirect(url_for('main.index'))
    
    comments = danger_zone.get_comments(id)
    return render_template('danger_zone_detail.html', zone=zone, comments=comments)

@main_bp.route('/danger-zones/<int:id>/comments', methods=['POST'])
def add_comment(id):
    """Handle submissions of new comments on a danger zone."""
    author = request.form.get('author', '').strip()
    content = request.form.get('content', '').strip()
    
    if not content:
        flash("留言內容不得為空！", "error")
        return redirect(url_for('main.danger_zone_detail', id=id))
        
    danger_zone.add_comment(id, author, content)
    flash("留言新增成功！", "success")
    return redirect(url_for('main.danger_zone_detail', id=id))
