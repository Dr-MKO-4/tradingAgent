import numpy as np
import random as rd
import json
from tqdm import tqdm

from crypto_env import CryptoTradingEnv
from dqn_agent import DQNAgent


class RL_Heuristique:
    def __init__(
        self,
        param_grid: dict,
        pipeline,               # DataPipeline instance
        symbol: str,            # ex. "BTCUSDT"
        env_kwargs: dict,
        eval_episodes: int = 5,
        elite_size: int = 2,
        candidates_size: int = 4,
        tournament_size: int = 2,
        mutation_rate: float = 0.3,
        perturbation: float = 0.1,
        generations: int = 10
    ):
        """
        param_grid: dict hyper‑param → list de valeurs à tester
        pipeline: instance de DataPipeline pour produire df_scaled
        symbol: symbole à passer au pipeline
        env_kwargs: dict des args (transaction_cost, max_data)
        eval_episodes: nb d’épisodes d’évaluation par individu
        remaining args pilotent l’algorithme génétique
        """
        self.param_grid       = param_grid
        self.pipeline         = pipeline
        self.symbol           = symbol
        self.env_kwargs       = env_kwargs.copy()
        self.eval_episodes    = eval_episodes
        self.elite_size       = elite_size
        self.candidates_size  = candidates_size
        self.tournament_size  = tournament_size
        self.mutation_rate    = mutation_rate
        self.perturbation     = perturbation
        self.generations      = generations

        # historique
        self.population       = []
        self.scores           = []
        self.best_history     = []

        # population initiale
        for _ in range(self.candidates_size):
            individual = {k: rd.choice(v) for k, v in self.param_grid.items()}
            self.population.append(individual)

    def evaluate(self, individual: dict) -> float:
        """Entraîne un DQNAgent sur eval_episodes et retourne la reward moyenne."""
        rewards = []
        # préparer données une fois
        df = self.pipeline.run(self.symbol)
        max_data = self.env_kwargs.get("max_data")
        if max_data:
            df = df.iloc[:max_data]

        # initial epsilon
        eps = individual.get('INITIAL_EPS', 1.0)
        min_eps = individual.get('MIN_EPS', 0.01)
        decay = individual.get('DECAY_RATE', 0.995)

        for _ in range(self.eval_episodes):
            env = CryptoTradingEnv(
                df,
                window_size=individual['WINDOW_SIZE'],
                transaction_cost=self.env_kwargs.get('transaction_cost', 0.0)
            )
            agent = DQNAgent(
                state_dim=env.observation_space.shape[0] * env.observation_space.shape[1],
                action_dim=env.action_space.n,
                hidden_dims=[individual['HIDDEN_DIM']] * 2,
                buffer_size=individual['BUFFER_SIZE'],
                batch_size=individual['BATCH_SIZE'],
                gamma=individual['GAMMA'],
                lr=individual['LR'],
                target_update_freq=individual['TARGET_FREQ']
            )

            total_reward = 0.0
            obs = env.reset().reshape(-1)

            for step in range(individual['MAX_STEPS']):
                action = agent.select_action(obs, eps)
                next_obs, reward, done, _ = env.step(action)
                next_state = next_obs.reshape(-1)

                agent.push_transition(obs, action, reward, next_state, done)
                agent.update()

                obs = next_state
                total_reward += reward
                if done:
                    break

            rewards.append(total_reward)
            # decay epsilon after each episode
            eps = max(min_eps, eps * decay)

        return float(np.mean(rewards))

    def select_elites(self):
        idx_sorted = np.argsort(self.scores)[::-1]
        return [self.population[i].copy() for i in idx_sorted[: self.elite_size]]

    def tournament(self, k):
        selected = []
        for _ in range(k):
            participants = rd.sample(list(zip(self.population, self.scores)), self.tournament_size)
            winner = max(participants, key=lambda x: x[1])[0]
            selected.append(winner.copy())
        return selected

    def crossover(self, p1, p2):
        child = {}
        for key in p1:
            child[key] = p1[key] if rd.random() < 0.5 else p2[key]
        return child

    def mutate(self, individual):
        ind = individual.copy()
        for k, v in ind.items():
            if rd.random() < self.mutation_rate:
                if isinstance(v, (int, float)):
                    newv = v * (1 + rd.uniform(-self.perturbation, self.perturbation))
                    ind[k] = int(newv) if isinstance(v, int) else newv
                else:
                    ind[k] = rd.choice(self.param_grid[k])
        return ind

    def run(self, save_path: str = None):
        for gen in range(self.generations):
            # 1) évaluer
            self.scores = [ self.evaluate(ind) for ind in tqdm(self.population, desc=f"Gen {gen}") ]

            # 2) élites
            elites = self.select_elites()

            # 3) reproduction
            new_pop = elites.copy()
            # tournoi
            needed = (self.candidates_size - len(new_pop)) // 2
            new_pop += self.tournament(needed)
            # crossover
            while len(new_pop) < self.candidates_size:
                p1, p2 = rd.sample(elites, 2)
                new_pop.append(self.crossover(p1, p2))

            # 4) mutation
            self.population = [ self.mutate(ind) for ind in new_pop ]

            best = max(self.scores)
            self.best_history.append(best)
            print(f"→ Gen {gen} best score = {best:.4f}")

        # meilleur final
        best_idx = int(np.argmax(self.scores))
        best_params = self.population[best_idx]
        best_score = self.scores[best_idx]

        # sauvegarde des hyper-paramètres
        if save_path:
            with open(save_path, 'w') as f:
                json.dump({'best_params': best_params, 'best_score': best_score, 'history': self.best_history}, f, indent=4)
            print(f"Hyper-paramètres enregistrés dans {save_path}")

        return best_params, best_score


# ----------------------
# UTILISATION EXEMPLE
# ----------------------

if __name__ == "__main__":
    from data_pipeline import DataFetcher, IndicatorTransformer, Normalizer, DataPipeline

    # pipeline et symbol
    DB_CONFIG = {
        'dbname': 'tradingAgent', 'user': 'miguel',
        'password': 'Mkomegmbdysdia4', 'host': 'localhost', 'port': '5432'
    }
    fetcher    = DataFetcher(source="csv", csv_folder="data/exports", db_config=DB_CONFIG)
    ind_tr     = IndicatorTransformer()
    normalizer = Normalizer()
    pipeline   = DataPipeline(fetcher, ind_tr, normalizer)
    SYMBOL     = "ADAUSDT"




    # grille d'hyper-paramètres
    param_grid = {
        'WINDOW_SIZE': [30,50,70,90,100],
        'MAX_STEPS':    [200,300,400,500],
        'INITIAL_EPS':  [1.0],
        'MIN_EPS':      [0.01,0.05,0.1],
        'DECAY_RATE':   [0.99,0.995,0.999],
        'BUFFER_SIZE':  [1000,2000,3000,5000],
        'BATCH_SIZE':   [32,64,128],
        'LR':           [1e-3,5e-4,1e-4],
        'GAMMA':        [0.9,0.95,0.99],
        'TARGET_FREQ':  [200,500,700,1000],
        'HIDDEN_DIM':   [32,64,128]
    }

    # tuner
    tuner = RL_Heuristique(
        param_grid=param_grid,
        pipeline=pipeline,
        symbol=SYMBOL,
        env_kwargs={'transaction_cost':0.001, 'max_data':7000},
        eval_episodes=4,
        elite_size=3,
        candidates_size=20,
        tournament_size=4,
        mutation_rate=0.15,
        perturbation=0.2,
        generations=10
    )
    
    best_params, best_score = tuner.run(save_path=f'./models/best_hyperparams_{SYMBOL}.json')

    print("\nMeilleurs hyper‑paramètres trouvés :")
    print(best_params)
    print("Score moyen :", best_score)