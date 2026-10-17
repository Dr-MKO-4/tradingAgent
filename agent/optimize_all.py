from pathlib import Path
from pipelines.data_pipeline import DataFetcher, IndicatorTransformer, Normalizer, DataPipeline
from tuning.rl_heuristique import RL_Heuristique

# 1) Configuration
SYMBOLS = ['BTC-USD','ETH-USD','SOL-USD','BNB-USD']  # etc.
DB_CONFIG = {...}
fetcher = DataFetcher(source="csv", csv_folder="data/exports", db_config=DB_CONFIG)
pipeline = DataPipeline(fetcher, IndicatorTransformer(), Normalizer())

param_grid = {
    'WINDOW_SIZE': [30,50,70],
    'MAX_STEPS':   [200,300,400],
    # … vos autres hyper‑param specs …
}

MODELS_DIR = Path("models")
MODELS_DIR.mkdir(exist_ok=True)

# 2) Pour chaque symbole, lancer le tuner
for sym in SYMBOLS:
    print(f"--- Optimizing {sym} ---")
    tuner = RL_Heuristique(
        param_grid=param_grid,
        pipeline=pipeline,
        symbol=sym,
        env_kwargs={'transaction_cost':0.001, 'max_data':5000},
        eval_episodes=3,
        elite_size=2,
        candidates_size=8,
        tournament_size=4,
        mutation_rate=0.2,
        perturbation=0.1,
        generations=5
    )
    best_params, best_score = tuner.run(
        save_path=str(MODELS_DIR/f"best_hyperparams_{sym}.json")
    )
    print(f"{sym} → best score = {best_score:.4f}")
