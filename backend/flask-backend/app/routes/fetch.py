from flask import Blueprint, jsonify
import subprocess, os

bp = Blueprint('fetch', __name__)

@bp.route('/<symbol>', methods=['POST'])
def fetch_data(symbol):
    script = os.path.abspath(os.path.join('..','..','agent','fetch_and_store.py'))
    subprocess.Popen(
        ['python', script, symbol],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        cwd='.', detached=True
    ).unref()
    return jsonify(status='started', symbol=symbol)
