import os
class Config:
    SECRET_KEY = os.getenv('SECRET_KEY','change-me')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY','jwt-secret')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL','postgresql://miguel:Mkomegmbdysdia4@localhost:5432/tradingAgent')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
