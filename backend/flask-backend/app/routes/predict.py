from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import os, json, subprocess

from ..utils.db import db, History, Metric

bp = Blueprint('predict', __name__)
JSON_PATH = os.path.abspath(os.path.join('..','..','data','history.json'))

@bp.route('/', methods=['GET'])
@jwt_required()
def predict():
    symbol = request.args.get('symbol')
    if not symbol: return jsonify(error='symbol manquant'),400

    # 1) Appel du script Python predict.py
    script = os.path.abspath(os.path.join('..','..','agent','predict.py'))
    out = subprocess.run(['python', script, symbol], capture_output=True, text=True)
    if out.returncode != 0:
        return jsonify(error=out.stderr),500
    res = json.loads(out.stdout)
    action, timestamp = res['label'], datetime.utcnow()

    # 2) Stockage PostgreSQL
    hist = History(symbol=symbol, timestamp=timestamp, action=action)
    metr = Metric(symbol=symbol, timestamp=timestamp, portfolio=0.0)
    db.session.add_all([hist, metr])
    db.session.commit()

    # 3) Stockage JSON local
    data = {'history':[], 'metrics':[]}
    if os.path.exists(JSON_PATH):
        data = json.load(open(JSON_PATH))
    data['history'].append({'symbol':symbol,'timestamp':timestamp.isoformat(),'action':action})
    data['metrics'].append({'symbol':symbol,'timestamp':timestamp.isoformat(),'portfolio':0.0})
    with open(JSON_PATH,'w') as f:
        json.dump(data, f, indent=2)

    return jsonify(symbol=symbol, action=action, timestamp=timestamp.isoformat()),200
