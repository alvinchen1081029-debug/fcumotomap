from flask import Blueprint, render_template, request, redirect, url_for

danger_bp = Blueprint('danger', __name__)

@danger_bp.route('/danger', methods=['GET'])
def list_dangers():
    """
    顯示所有危險路段評分列表與回報表單。
    """
    pass

@danger_bp.route('/danger/create', methods=['POST'])
def create_danger():
    """
    處理新增危險路段回報的表單資料。
    驗證輸入資訊與危險星等 (1-5)，成功後寫入 DB 並重導向至列表頁。
    """
    pass
