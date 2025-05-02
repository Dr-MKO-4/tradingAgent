# Updated agent/result.py with CSV saving functionality

import psycopg2
from psycopg2.extras import RealDictCursor
import os, json, csv
from datetime import datetime

def save_results_to_db(db_config: dict, symbol: str, metrics: dict):
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS backtest_results (
            id SERIAL PRIMARY KEY,
            symbol TEXT,
            cum_return DOUBLE PRECISION,
            sharpe DOUBLE PRECISION,
            max_drawdown DOUBLE PRECISION,
            train_reward_mean DOUBLE PRECISION,
            run_timestamp TIMESTAMP DEFAULT now()
        )
    """)
    cur.execute(
        "INSERT INTO backtest_results(symbol, cum_return, sharpe, max_drawdown, train_reward_mean) VALUES (%s,%s,%s,%s,%s)",
        (symbol, metrics['cum_return'], metrics['sharpe'], metrics['max_drawdown'], metrics['train_rewards_mean'])
    )
    conn.commit()
    cur.close()
    conn.close()

def load_best_hyperparams(symbol: str, folder: str = None) -> dict:
    folder = folder or os.getcwd()
    path = os.path.join(folder, f"best_hyperparams_{symbol}.json")
    if not os.path.exists(path):
        raise FileNotFoundError(f"{path} introuvable")
    return json.load(open(path))['best_params']

def save_results_to_local(folder: str, symbol: str, metrics: dict, hyperparams: dict=None, history: list=None) -> str:
    """
    Sauvegarde les résultats et hyperparams dans un horodaté JSON et CSV local.
    Retourne le chemin du fichier JSON créé.
    """
    os.makedirs(folder, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # JSON
    json_fname = f"results_{symbol}_{ts}.json"
    json_payload = {'symbol': symbol, 'metrics': metrics}
    if hyperparams is not None:
        json_payload['hyperparams'] = hyperparams
    if history is not None:
        json_payload['history'] = history
    json_path = os.path.join(folder, json_fname)
    with open(json_path, 'w') as f:
        json.dump(json_payload, f, indent=4)
    
    # CSV
    csv_fname = f"results_{symbol}_{ts}.csv"
    csv_path = os.path.join(folder, csv_fname)
    # Flatten payload for CSV: one row
    row = {'symbol': symbol}
    row.update(metrics)
    if hyperparams:
        # prefix hyperparams keys
        for k, v in hyperparams.items():
            row[f"hp_{k}"] = v
    if history:
        # save history as semicolon-separated string
        row['history'] = ';'.join(map(str, history))
    # write header if file not exists
    with open(csv_path, 'w', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=list(row.keys()))
        writer.writeheader()
        writer.writerow(row)
    
    return json_path