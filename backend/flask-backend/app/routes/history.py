from flask import Blueprint, jsonify
import json, os
bp = Blueprint('history', __name__)

@bp.route('/', methods=['GET'])
def history():
    p = os.path.abspath(os.path.join('..','..','data','history.json'))
    return jsonify(json.load(open(p))['history']),200
