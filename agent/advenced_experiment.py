# advanced_experiments.py

import json
from pathlib import Path
import numpy as np
import pandas as pd

from data_pipeline import DataFetcher, IndicatorTransformer, Normalizer, DataPipeline
from agent.environments.crypto_env import CryptoTradingEnv
from dqn_agent import DQNAgent
from agent.result_0 import save_results_to_db, save_results_to_local, load_best_hyperparams

# 1) Configuration générale
SYMBOLS = [ 'BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'ADA-USD',
    'XRP-USD', 'DOGE-USD', 'AVAX-USD', 'MATIC-USD', 'LTC-USD']
DB_CONFIG = {
    'dbname':'tradingAgent','user':'miguel',
    'password':'…','host':'localhost','port':'5432'
}
MODELS_DIR = Path("models")
MODELS_DIR.mkdir(exist_ok=True)

# initialisation pipeline
fetcher = DataFetcher(source="csv", csv_folder="data/exports", db_config=DB_CONFIG)
pipeline = DataPipeline(fetcher, IndicatorTransformer(), Normalizer())

def train_and_backtest(symbol, hyperparams, max_data=None):
    # 2a) préparer données
    df = pipeline.run(symbol)
    if max_data:
        df = df.iloc[:max_data]
    env = CryptoTradingEnv(df, window_size=hyperparams["WINDOW_SIZE"], transaction_cost=0.001)
    
    # 2b) instancier agent
    state_dim = env.observation_space.shape[0]*env.observation_space.shape[1]
    agent = DQNAgent(
        state_dim, env.action_space.n,
        hidden_dims=[hyperparams["HIDDEN_DIM"]]*2,
        buffer_size=hyperparams["BUFFER_SIZE"],
        batch_size=hyperparams["BATCH_SIZE"],
        gamma=hyperparams["GAMMA"],
        lr=hyperparams["LR"],
        target_update_freq=hyperparams["TARGET_FREQ"]
    )
    # 2c) entraînement
    eps = hyperparams["INITIAL_EPS"]
    rewards = []
    for ep in range(hyperparams.get("EPISODES",100)):
        obs = env.reset().reshape(-1)
        tot = 0
        for _ in range(hyperparams["MAX_STEPS"]):
            a = agent.select_action(obs, eps)
            nxt, r, done, _ = env.step(a)
            nxt = nxt.reshape(-1)
            agent.push_transition(obs, a, r, nxt, done)
            agent.update()
            obs = nxt; tot += r
            if done: break
        eps = max(hyperparams["MIN_EPS"], eps*hyperparams["DECAY_RATE"])
        rewards.append(tot)
    # sauvegarde modèle
    model_path = MODELS_DIR/f"{symbol}_dqn.pth"
    agent.save(str(model_path))
    
    # 2d) backtest en exploitation (ε=0)
    obs = env.reset().reshape(-1)
    port = []
    for _ in range(len(df)-hyperparams["WINDOW_SIZE"]):
        a = agent.select_action(obs, 0.0)
        obs, _, _, info = env.step(a)
        obs = obs.reshape(-1)
        port.append(info["portfolio_value"])
    port = np.array(port)
    ret = port[1:]/port[:-1]-1
    
    metrics = {
        "cum_return": float(port[-1]-port[0]),
        "sharpe": float(ret.mean()/(ret.std()+1e-8)*np.sqrt(252)),
        "max_drawdown": float((np.maximum.accumulate(port)-port).max()),
        "train_reward_mean": float(np.mean(rewards))
    }
    return metrics, rewards

def rolling_cv(symbol, hyperparams, n_splits=5, window_size=1000):
    """Cross‑validation temporelle en rolling windows : renvoie liste de metrics."""
    df = pipeline.run(symbol)
    metrics_list = []
    step = (len(df)-window_size)//n_splits
    for i in range(n_splits):
        train_df = df.iloc[i*step : i*step + window_size]
        env_kwargs = {"df_scaled": train_df, "window_size": hyperparams["WINDOW_SIZE"], "transaction_cost":0.001}
        m, _ = train_and_backtest(symbol, hyperparams, max_data=window_size)
        metrics_list.append(m)
    return pd.DataFrame(metrics_list)

# 3) Boucle multi‑crypto
all_results = []
for sym in SYMBOLS:
    print(f"\n=== {sym} ===")
    hp = load_best_hyperparams(sym, folder=str(MODELS_DIR))
    
    # simple train+backtest
    metrics, history = train_and_backtest(sym, hp, max_data=5000)
    print("Backtest metrics:", metrics)
    
    # cross‑validation
    cv_df = rolling_cv(sym, hp, n_splits=3, window_size=3000)
    print("Rolling CV mean:\n", cv_df.mean())

    # persist
    save_results_to_db(DB_CONFIG, sym, metrics)
    save_results_to_local(str(MODELS_DIR), sym, metrics, hp, history)

    # stocker pour comparatif multi‑crypto
    metrics["symbol"] = sym
    all_results.append(metrics)

# 4) Comparatif global
df_all = pd.DataFrame(all_results)
print("\n=== Comparatif multi‑crypto ===")
print(df_all.set_index("symbol"))
df_all.set_index("symbol")[["cum_return","sharpe","max_drawdown"]].plot.bar(subplots=True, layout=(1,3), figsize=(12,4))
