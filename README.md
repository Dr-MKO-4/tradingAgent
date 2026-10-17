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
```

---

## 2. Fondements théoriques

### 2.1 Processus de Décision Markovien (MDP)
- États : indicateurs techniques et prix passés  
- Actions : \{Acheter, Vendre, Conserver\}  
- Récompenses : profit ou perte réalisés à chaque transaction  
- Facteur d’escompte γ pour valoriser les gains futurs  

### 2.2 Deep Q-Network (DQN)
- Approximation de la fonction Q par un réseau de neurones  
- Target network pour stabiliser les cibles  
- Replay buffer pour briser la corrélation temporelle  
- Stratégie ε-greedy pour équilibrer exploration/exploitation  

---

## 3. Modélisation du problème de trading

### 3.1 Formulation du trading comme un MDP
- Définition formelle des triplets (état, action, récompense)  
- Horizon temporel et contraintes du marché crypto  

### 3.2 Sélection d’indicateurs techniques
- RSI (Relative Strength Index)  
- SMA / EMA (moyennes mobiles simple et exponentielle)  
- MACD (Moving Average Convergence Divergence)  
- Normalisation et fenêtrage des données  

---

## 4. Architecture du modèle
- Structure du réseau de neurones (entrée, couches cachées, sortie)  
- Fonction de perte : erreur de Bellman  
- Optimiseur (Adam, etc.), taux d’apprentissage, batch size  
- Schéma global du DQN avec target network  

---

## 5. Implémentation

### 5.1 Préparation des données
- Récupération OHLCV via `yfinance`  
- Calcul des indicateurs (pandas_ta, TA-Lib)  
- Stockage dans PostgreSQL  

### 5.2 Environnement et agent
- Environnement OpenAI Gym personnalisé  
- Boucle d’entraînement DQN  
- Paramétrage : γ, ε initial/decay, taille du replay buffer  

### 5.3 Interface Web
- Dashboard React pour lancer les simulations  
- Visualisation des courbes de performance et indicateurs  
- Backend Flask/Express exposant des endpoints REST  

---

## ⚙️ Prérequis

- [Node.js](https://nodejs.org/) & npm  
- [Python 3.8+](https://www.python.org/downloads/)  
- [PostgreSQL](https://www.postgresql.org/)  
- `pip` (gestionnaire de paquets Python)  

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-repo> tradingAgent
cd tradingAgent


## ⚙️ Prérequis

- [Node.js](https://nodejs.org/) & npm
- [Python 3.8+](https://www.python.org/downloads/)
- [PostgreSQL](https://www.postgresql.org/)
- `pip` (gestionnaire de paquets Python)

---

## 🚀 Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-repo> tradingAgent
cd tradingAgent
```
### 2. installation frontEnd
```bash
cd frontend
npm install
npm run dev
```
### 3. Installer l’environnement Python
```bash
cd ../backend
pip install numpy pandas matplotlib torch stable-baselines3 flask yfinance psycopg2
```
### 4. Créer et connecter la base PostgreSQL

```psql
CREATE DATABASE "tradingAgent";
\c tradingAgent

```
### 5. Initialiser les tables

```bash
psql -U <utilisateur> -d tradingAgent -f db/schema.sql
```
### 📘 Explication des Tables

| Table               | Description                                                      |
|---------------------|------------------------------------------------------------------|
| `cryptos`           | Infos de base (BTC, ETH...)                                      |
| `indicators`        | Indicateurs calculés (RSI, SMA, Bollinger...)                    |
| `simulations`       | Résultats globaux des entraînements DQN                          |
| `transactions`      | Détails des trades exécutés durant une simulation                |
| `agents`            | Paramètres de chaque agent DQN                                   |
| `agent_performance` | Statistiques de performance après simulation                     |

---

### 📊 Commandes Utiles

#### 🔧 Lancer le backend Flask

```bash
cd backend
flask run
```
```python
pip install yfinance ta pandas
python data/collecte.py          # OHLCV via yfinance
python data/compute_indicators.py   # RSI, SMA, MACD

```
