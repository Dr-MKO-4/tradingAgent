# Crypto Trader DQN 🚀

Un système de trading intelligent basé sur le Deep Q-Learning (DQN) pour prendre des décisions automatiques sur les marchés de crypto-monnaies.

## 🧠 Objectif
Permettre à un agent d’apprentissage par renforcement de :
- Trader des crypto-monnaies à partir de données OHLCV
- Apprendre via des indicateurs techniques
- S’améliorer en fonction de la performance du portefeuille

## 📦 Technologies
- Python, TensorFlow/PyTorch pour le DQN
- Flask/Express.js pour le backend
- React + Chart.js/Plotly pour le frontend
- PostgreSQL pour le stockage

## 📁 Structure du projet
```bash
crypto-trader-dqn/
├── agent/          # DQN agent + apprentissage
├── data/           # Scripts de collecte & traitement des données
├── backend/        # API Flask ou Express
├── frontend/       # App React
├── notebooks/      # Explorations et tests
├── docs/           # Rapport et théorie
