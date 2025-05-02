from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from ..utils.db import db, User

bp = Blueprint('auth', __name__)

@bp.route('/register', methods=['POST'])
def register():
    u = request.get_json()
    if User.query.filter_by(username=u['username']).first():
        return jsonify(msg='User exists'),409
    user = User(username=u['username'], password=generate_password_hash(u['password']))
    db.session.add(user); db.session.commit()
    return jsonify(msg='Registered'),201

@bp.route('/login', methods=['POST'])
def login():
    u = request.get_json()
    user = User.query.filter_by(username=u['username']).first()
    if not user or not check_password_hash(user.password,u['password']):
        return jsonify(msg='Bad creds'),401
    token = create_access_token(identity=user.id)
    return jsonify(access_token=token),200
