# File: agent/train_dqn.py

import sys
from pathlib import Path

# Ensure project root is on sys.path so we can import our module
ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / 'agent'))

import numpy as np
import torch
from collections import deque
import matplotlib.pyplot as plt

# Import the pipeline components
from data_pipeline import DataFetcher, IndicatorTransformer, Normalizer, DataPipeline
from crypto_env import CryptoTradingEnv           # votre classe Gym
from dqn_agent import DQNAgent                   # ReplayBuffer + QNetwork + Agent

# 1. Hyper‑paramètres
SYMBOL          = "BTCUSDT"
SOURCE          = "csv"
WINDOW_SIZE     = 50
EPISODES        = 50
MAX_STEPS       = 500
INITIAL_EPS     = 1.0
MIN_EPS         = 0.01
DECAY_RATE      = 0.995
BUFFER_SIZE     = 10000
BATCH_SIZE      = 64
LR              = 1e-3
GAMMA           = 0.99
TARGET_FREQ     = 1000

# 2. Charger et préparer les données via le pipeline
DB_CONFIG = {
    'dbname': 'tradingAgent', 'user': 'miguel',
    'password': 'Mkomegmbdysdia4', 'host': 'localhost', 'port': '5432'
}
fetcher    = DataFetcher(source=SOURCE, csv_folder=ROOT / "data" / "exports", db_config=DB_CONFIG)
ind_tr     = IndicatorTransformer()
normalizer = Normalizer()
pipeline   = DataPipeline(fetcher, ind_tr, normalizer)

df_scaled = pipeline.run(SYMBOL)

# 3. Créer l’environnement
env = CryptoTradingEnv(
    df_scaled,
    window_size=WINDOW_SIZE,
    transaction_cost=0.001
)
state_dim  = env.observation_space.shape[0] * env.observation_space.shape[1]
action_dim = env.action_space.n

# 4. Instancier l’agent
agent = DQNAgent(
    state_dim=state_dim,
    action_dim=action_dim,
    hidden_dims=[128,128],
    buffer_size=BUFFER_SIZE,
    batch_size=BATCH_SIZE,
    gamma=GAMMA,
    lr=LR,
    target_update_freq=TARGET_FREQ
)

# 5. Boucle d’entraînement
eps = INITIAL_EPS
reward_history = []

for ep in range(1, EPISODES+1):
    obs = env.reset()
    state = obs.reshape(-1)
    total_reward = 0

    for t in range(MAX_STEPS):
        action = agent.select_action(state, eps)
        next_obs, reward, done, _ = env.step(action)
        next_state = next_obs.reshape(-1)

        agent.push_transition(state, action, reward, next_state, done)
        agent.update()

        state = next_state
        total_reward += reward
        if done:
            break

    eps = max(MIN_EPS, eps * DECAY_RATE)
    reward_history.append(total_reward)
    print(f"Epi {ep:03d}  Reward: {total_reward:.4f}  Eps: {eps:.4f}")

# 6. Sauvegarde du modèle
agent.save(f"./models/dqn_crypto_{SYMBOL}.pth")

# 7. Affichage de la courbe de reward
plt.plot(reward_history)
plt.title("Récompense cumulée par épisode")
plt.xlabel("Episode")
plt.ylabel("Reward")
plt.show()
