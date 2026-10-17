import json
import psycopg2
from pathlib import Path

def save_results_to_db(db_config, symbol, metrics):
    conn = psycopg2.connect(**db_config)
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO results (symbol, cum_return, sharpe, max_drawdown, train_reward_mean, timestamp)
        VALUES (%s, %s, %s, %s, %s, now())
        """,
        (symbol, metrics["cum_return"], metrics["sharpe"],
         metrics["max_drawdown"], metrics["train_reward_mean"])
    )
    conn.commit()
    cur.close()
    conn.close()

def save_results_to_local(folder, symbol, metrics, hyperparams, history):
    path = Path(folder) / f"results_{symbol}.json"
    payload = {
        "metrics": metrics,
        "hyperparams": hyperparams,
        "train_history": history
    }
    with open(path, "w") as f:
        json.dump(payload, f, indent=4)

def load_best_hyperparams(symbol, folder):
    path = Path(folder) / f"best_hyperparams_{symbol}.json"
    if not path.exists():
        raise FileNotFoundError(f"{path} introuvable")
    data = json.load(open(path))
    return data["best_params"]
