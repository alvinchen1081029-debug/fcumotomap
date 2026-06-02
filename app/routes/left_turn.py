from flask import Blueprint, render_template, request, redirect, url_for

left_turn_bp = Blueprint('left_turn', __name__)

@left_turn_bp.route('/left_turn', methods=['GET'])
def list_left_turns():
    """
    顯示所有已標記的兩段式左轉路口清單與回報表單。
    """
    pass

@left_turn_bp.route('/left_turn/create', methods=['POST'])
def create_left_turn():
    """
    處理新增兩段式左轉路口表單資料。
    驗證輸入資訊，呼叫 Model 寫入資料庫，成功後重導向至列表頁。
    """
    pass
