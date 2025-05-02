from flask import Blueprint, jsonify
import json, os
bp = Blueprint('metrics', __name__)

@bp.route('/', methods=['GET'])
def metrics():
    p = os.path.abspath(os.path.join('..','..','data','history.json'))
    return jsonify(json.load(open(p))['metrics']),200
