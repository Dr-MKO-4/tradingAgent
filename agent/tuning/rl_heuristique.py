# dqn_rl_module.py

import torch
import torch.nn.functional as F
import numpy as np
import random as rd
import json
from tqdm import tqdm

from networks.dueling_q_network import DuelingQNetwork
from buffers.prioritized_replay import PrioritizedReplayBuffer
from environments.crypto_env import CryptoTradingEnv


class DQNAgent:
    def __init__(
        self, state_dim, action_dim,
        hidden_dims=[128, 128],
        buffer_size=10000,
        batch_size=64,
        gamma=0.99,
        lr=1e-3,
        target_update_freq=1000,
        optimizer_name='adam',
        weight_decay=0.0,
        device=None
    ):
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.q_net = DuelingQNetwork(state_dim, hidden_dims, action_dim).to(self.device)
        self.target_net = DuelingQNetwork(state_dim, hidden_dims, action_dim).to(self.device)
        self.target_net.load_state_dict(self.q_net.state_dict())
        self.target_net.eval()

        # choose optimizer
        if optimizer_name == 'adam':
            self.optimizer = torch.optim.Adam(
                self.q_net.parameters(), lr=lr, weight_decay=weight_decay)
        elif optimizer_name == 'rmsprop':
            self.optimizer = torch.optim.RMSprop(
                self.q_net.parameters(), lr=lr, weight_decay=weight_decay)
        else:
            self.optimizer = torch.optim.SGD(
                self.q_net.parameters(), lr=lr, weight_decay=weight_decay)

        self.buffer = PrioritizedReplayBuffer(buffer_size)
        self.batch_size = batch_size
        self.gamma = gamma
        self.target_update_freq = target_update_freq
        self.step_count = 0

    def select_action(self, state, epsilon):
        if np.random.rand() < epsilon:
            return np.random.randint(self.q_net.feature[0].in_features)
        state_v = torch.tensor(state, dtype=torch.float32).unsqueeze(0).to(self.device)
        with torch.no_grad():
            qvals = self.q_net(state_v)
        return qvals.argmax().item()

    def push_transition(self, state, action, reward, next_state, done):
        state_v = torch.tensor(state, dtype=torch.float32).unsqueeze(0).to(self.device)
        next_v = torch.tensor(next_state, dtype=torch.float32).unsqueeze(0).to(self.device)
        q_val = self.q_net(state_v)[0, action].item()

        next_action = self.q_net(next_v).argmax(dim=1).item()
        q_next = self.target_net(next_v)[0, next_action].item()
        td_target = reward + (1 - done) * self.gamma * q_next
        error = td_target - q_val
        self.buffer.add(error, (state, action, reward, next_state, done))

    def update(self):
        if len(self.buffer) < self.batch_size:
            return

        batch, idxs, weights = self.buffer.sample(self.batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)

        states_v = torch.tensor(states, dtype=torch.float32).to(self.device)
        actions_v = torch.tensor(actions, dtype=torch.int64).unsqueeze(1).to(self.device)
        rewards_v = torch.tensor(rewards, dtype=torch.float32).unsqueeze(1).to(self.device)
        next_states_v = torch.tensor(next_states, dtype=torch.float32).to(self.device)
        dones_v = torch.tensor(dones, dtype=torch.float32).unsqueeze(1).to(self.device)
        weights_v = torch.tensor(weights, dtype=torch.float32).unsqueeze(1).to(self.device)

        q_values = self.q_net(states_v).gather(1, actions_v)

        next_actions = self.q_net(next_states_v).argmax(dim=1, keepdim=True)
        q_next = self.target_net(next_states_v).gather(1, next_actions)
        q_target = rewards_v + self.gamma * q_next * (1 - dones_v)

        errors = (q_target - q_values).detach().cpu().numpy().squeeze()
        self.buffer.update_errors(idxs, errors)

        loss = (weights_v * F.mse_loss(q_values, q_target, reduction='none')).mean()
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

        self.step_count += 1
        if self.step_count % self.target_update_freq == 0:
            self.target_net.load_state_dict(self.q_net.state_dict())


class RL_Heuristique:
    def __init__(
        self,
        param_grid: dict,
        pipeline,
        symbol: str,
        env_kwargs: dict,
        eval_episodes: int = 5,
        elite_size: int = 2,
        candidates_size: int = 4,
        tournament_size: int = 2,
        mutation_rate: float = 0.3,
        perturbation: float = 0.1,
        generations: int = 10
    ):
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

        self.population       = []
        self.scores           = []
        self.best_history     = []

        # population initiale: discrete lists or continuous specs
        for _ in range(self.candidates_size):
            individual = {}
            for k, spec in self.param_grid.items():
                if isinstance(spec, list):
                    individual[k] = rd.choice(spec)
                else:
                    kind, a, b = spec
                    if kind == 'int':
                        individual[k] = rd.randint(a, b)
                    elif kind == 'float':
                        individual[k] = rd.uniform(a, b)
            self.population.append(individual)

    def evaluate(self, individual: dict) -> float:
        rewards = []
        df = self.pipeline.run(self.symbol)
        max_data = self.env_kwargs.get("max_data")
        if max_data:
            df = df.iloc[:max_data]

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
                state_dim=env.observation_space.shape[0]*env.observation_space.shape[1],
                action_dim=env.action_space.n,
                hidden_dims=[individual['HIDDEN_DIM']]*2,
                buffer_size=individual['BUFFER_SIZE'],
                batch_size=individual['BATCH_SIZE'],
                gamma=individual['GAMMA'],
                lr=individual['LR'],
                target_update_freq=individual['TARGET_FREQ'],
                optimizer_name=individual.get('OPTIMIZER', 'adam'),
                weight_decay=individual.get('WEIGHT_DECAY', 0.0)
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
                spec = self.param_grid[k]
                if isinstance(spec, list):
                    ind[k] = rd.choice(spec)
                else:
                    kind, a, b = spec
                    if kind == 'int':
                        ind[k] = rd.randint(a, b)
                    elif kind == 'float':
                        ind[k] = v * (1 + rd.uniform(-self.perturbation, self.perturbation))
        return ind

    def run(self, save_path: str = None):
        for gen in range(self.generations):
            self.scores = [ self.evaluate(ind) for ind in tqdm(self.population, desc=f"Gen {gen}") ]

            elites = self.select_elites()
            new_pop = elites.copy()
            needed = (self.candidates_size - len(new_pop)) // 2
            new_pop += self.tournament(needed)
            while len(new_pop) < self.candidates_size:
                p1, p2 = rd.sample(elites, 2)
                new_pop.append(self.crossover(p1, p2))

            self.population = [ self.mutate(ind) for ind in new_pop ]
            best = max(self.scores)
            self.best_history.append(best)
            print(f"→ Gen {gen} best score = {best:.4f}")

        best_idx = int(np.argmax(self.scores))
        best_params = self.population[best_idx]
        best_score = self.scores[best_idx]

        if save_path:
            with open(save_path, 'w') as f:
                json.dump({'best_params': best_params, 'best_score': best_score, 'history': self.best_history}, f, indent=4)
            print(f"Hyper‑paramètres enregistrés dans {save_path}")

        return best_params, best_score
