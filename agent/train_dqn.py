# File: agent/train_dqn.py

import sys
from pathlib import Path
import json
import numpy as np
import torch
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT / 'agent'))

from data_pipeline import DataFetcher, IndicatorTransformer, Normalizer, DataPipeline
from crypto_env import CryptoTradingEnv
from dqn_agent import DQNAgent
from result import save_results_to_db, load_best_hyperparams, save_results_to_local

# 1) hyper‑params
SYMBOL = "ADAUSDT"
best_config = load_best_hyperparams(SYMBOL, folder=str(ROOT / 'models'))

# destructuration…
WINDOW_SIZE, MAX_STEPS, INITIAL_EPS, MIN_EPS = \
  best_config['WINDOW_SIZE'], best_config['MAX_STEPS'], best_config['INITIAL_EPS'], best_config['MIN_EPS']
DECAY_RATE, BUFFER_SIZE, BATCH_SIZE = \
  best_config['DECAY_RATE'], best_config['BUFFER_SIZE'], best_config['BATCH_SIZE']
LR, GAMMA, TARGET_FREQ, HIDDEN_DIM = \
  best_config['LR'], best_config['GAMMA'], best_config['TARGET_FREQ'], best_config['HIDDEN_DIM']
EPISODES = 200

# 2) pipeline
DB_CONFIG = { 'dbname':'tradingAgent','user':'miguel','password':'Mkomegmbdysdia4','host':'localhost','port':'5432' }
fetcher = DataFetcher(source="csv", csv_folder=ROOT/"data"/"exports", db_config=DB_CONFIG)
pipeline = DataPipeline(fetcher, IndicatorTransformer(), Normalizer())
df_scaled = pipeline.run(SYMBOL)

# 3) env & agent
env = CryptoTradingEnv(df_scaled, window_size=WINDOW_SIZE, transaction_cost=0.001)
state_dim = env.observation_space.shape[0]*env.observation_space.shape[1]
agent = DQNAgent(state_dim, env.action_space.n, [HIDDEN_DIM,HIDDEN_DIM], BUFFER_SIZE, BATCH_SIZE, GAMMA, LR, TARGET_FREQ)

# 4) training
eps = INITIAL_EPS; reward_hist=[]
for ep in range(1,EPISODES+1):
    obs = env.reset().reshape(-1); total=0
    for _ in range(MAX_STEPS):
        a=agent.select_action(obs,eps)
        nxt, r, done, _ = env.step(a)
        nxt=nxt.reshape(-1)
        agent.push_transition(obs,a,r,nxt,done); agent.update()
        obs= nxt; total+=r
        if done: break
    eps=max(MIN_EPS,eps*DECAY_RATE); reward_hist.append(total)
    print(f"Epi {ep:03d} R={total:.4f} ε={eps:.4f}")

# 5) save model
models_dir=ROOT/"models"; models_dir.mkdir(exist_ok=True)
model_path=models_dir/f"dqn_{SYMBOL}.pth"; agent.save(str(model_path))

# 6) backtest exploitation
obs=env.reset().reshape(-1); port=[]
for _ in range(len(df_scaled)-WINDOW_SIZE):
    a=agent.select_action(obs,0.0); nxt,_,_,info=env.step(a); obs=nxt.reshape(-1); port.append(info['portfolio_value'])
port=np.array(port); rets=port[1:]/port[:-1]-1
metrics={'cum_return':float(port[-1]-port[0]),
         'sharpe':float(rets.mean()/(rets.std()+1e-8)*np.sqrt(252)),
         'max_drawdown':float((np.maximum.accumulate(port)-port).max()),
         'train_rewards_mean':float(np.mean(reward_hist))}

# 7a) en base
save_results_to_db(DB_CONFIG,SYMBOL,metrics)
# 7b) local
local_path = save_results_to_local(str(models_dir), SYMBOL, metrics, best_config, reward_hist)

print(f"Modèle→{model_path}")
print(f"csv{local_path}")
print(f"DB→{metrics}")

# 8) plot
plt.plot(reward_hist); plt.title(f"Reward ({SYMBOL})"); plt.xlabel("Ep"); plt.ylabel("R"); plt.show()
