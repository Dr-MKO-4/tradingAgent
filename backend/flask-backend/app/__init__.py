from flask import Flask
from flask_jwt_extended import JWTManager
from .utils.db import init_db
from .routes.auth    import bp as auth_bp
from .routes.fetch   import bp as fetch_bp
from .routes.predict import bp as pred_bp
from .routes.metrics import bp as met_bp
from .routes.history import bp as hist_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    init_db(app)
    JWTManager(app)
    app.register_blueprint(auth_bp,  url_prefix='/api/auth')
    app.register_blueprint(fetch_bp, url_prefix='/api/fetch-data')
    app.register_blueprint(pred_bp,  url_prefix='/api/predict')
    app.register_blueprint(met_bp,   url_prefix='/api/metrics')
    app.register_blueprint(hist_bp,  url_prefix='/api/history')
    return app
