from flask import Blueprint, render_template

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """
    渲染系統首頁與主地圖。
    取得所有兩段式左轉路口與危險路段資料，傳入前端地圖進行標記繪製。
    """
    pass
