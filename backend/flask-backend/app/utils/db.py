from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

class User(db.Model):
    id       = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

class History(db.Model):
    id        = db.Column(db.Integer, primary_key=True)
    symbol    = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    action    = db.Column(db.String(10), nullable=False)

class Metric(db.Model):
    id        = db.Column(db.Integer, primary_key=True)
    symbol    = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, nullable=False)
    portfolio = db.Column(db.Float, nullable=False)

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()  # :contentReference[oaicite:7]{index=7}
