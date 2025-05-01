import os
import random
import numpy as np
import pandas as pd
from collections import deque
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam

# ─── 1) DQNAgent  ────────────────

class DQNAgent:
    def __init__(
        self,
        state_size,
        action_size,
        gamma=0.95,
        epsilon=1.0,
        epsilon_min=0.01,
        epsilon_decay=0.995,
        learning_rate=0.001,
        activation='relu',
        loss='mse',
        optimizer=Adam,
        epochs=1,
        memory_size=2000
    ):
        self.state_size    = state_size
        self.action_size   = action_size
        self.memory        = deque(maxlen=memory_size)
        self.gamma         = gamma
        self.epsilon       = epsilon
        self.epsilon_min   = epsilon_min
        self.epsilon_decay = epsilon_decay
        self.learning_rate= learning_rate
        self.activation   = activation
        self.loss         = loss
        self.optimizer    = optimizer
        self.epochs       = epochs

        # réseau principal et réseau cible
        self.model        = self._build_model()
        self.target_model = self._build_model()
        self.update_target_model()

    def _build_model(self):
        m = Sequential()
        m.add(Dense(64, input_dim=self.state_size, activation=self.activation))
        m.add(Dense(64, activation=self.activation))
        m.add(Dense(self.action_size, activation='linear'))
        m.compile(loss=self.loss, optimizer=self.optimizer(learning_rate=self.learning_rate))
        return m

    def update_target_model(self):
        self.target_model.set_weights(self.model.get_weights())

    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    def act(self, state):
        if np.random.rand() <= self.epsilon:
            return random.randrange(self.action_size)
        q = self.model.predict(state[np.newaxis,:], verbose=0)[0]
        return np.argmax(q)

    def replay(self, batch_size):
        batch = random.sample(self.memory, min(len(self.memory), batch_size))
        for state, action, reward, next_state, done in batch:
            target = reward
            if not done:
                future = np.max(self.target_model.predict(next_state[np.newaxis,:], verbose=0)[0])
                target = reward + self.gamma * future
            q_vals = self.model.predict(state[np.newaxis,:], verbose=0)
            q_vals[0][action] = target
            self.model.fit(state[np.newaxis,:], q_vals, epochs=self.epochs, verbose=0)
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)

    def save(self, path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.model.save(path)

    def load(self, path):
        self.model = load_model(path)
        self.update_target_model()

# ─── 2) CryptoEnv pour lecture CSV nettoyés ────────────────────────────────────


class CryptoEnv:
    def __init__(self, csv_path, window_size=10, initial_balance=1.0):
        df = pd.read_csv(csv_path, parse_dates=['Date'], index_col='Date')
        self.prices = df['Close'].values
        self.window_size = window_size
        self.initial_balance = initial_balance
        self.reset()

    def reset(self):
        self.t = self.window_size
        self.balance = self.initial_balance
        self.position = 0    # 0 = flat, 1 = long, -1 = short
        self.entry_price = 0
        return self._get_state()

    def _get_state(self):
        # vecteur des rendements sur la fenêtre
        window = self.prices[self.t-self.window_size:self.t]
        returns = np.diff(window) / window[:-1]
        # si besoin, on peut concatener position, balance, etc.
        return returns

    def step(self, action):
        """
        action: 0=hold, 1=buy(long), 2=sell(short)
        """
        price_today = self.prices[self.t]
        price_next  = self.prices[self.t+1]
        reward = 0.0

        # exécution de l’ordre
        if action == 1 and self.position == 0:  # ouverture long
            self.position = 1
            self.entry_price = price_today
        elif action == 2 and self.position == 0:  # ouverture short
            self.position = -1
            self.entry_price = price_today
        # on ne gère pas de fermeture explicite, on calcule P&L à la fin de la journée suivante
        # calcul du reward immédiat
        if self.position != 0:
            pnl = (price_next - self.entry_price) * self.position
            reward = pnl
            # on clôture chaque jour pour simplifier
            self.balance += pnl
            self.position = 0

        self.t += 1
        done = (self.t >= len(self.prices)-1)
        next_state = self._get_state()
        return next_state, reward, done

    def portfolio_value(self):
        return self.balance



if __name__ == '__main__':
    symbols = ['BTC-USD','ETH-USD','SOL-USD','BNB-USD','ADA-USD',
               'XRP-USD','DOGE-USD','AVAX-USD','MATIC-USD','LTC-USD']

    window_size = 10
    episodes = 50
    batch_size = 32

    for symbol in symbols:
        print(f"\n=== Training on {symbol} ===")
        env   = CryptoEnv(f"data/exports/{symbol}.csv", window_size=window_size)
        agent = DQNAgent(state_size=window_size-1, action_size=3)

        for e in range(episodes):
            state = env.reset()
            done = False
            total_reward = 0
            while not done:
                action = agent.act(state)
                next_state, reward, done = env.step(action)
                agent.remember(state, action, reward, next_state, done)
                state = next_state
                total_reward += reward

            agent.replay(batch_size)
            agent.update_target_model()
            print(f"Episode {e+1}/{episodes} — total_reward={total_reward:.4f} — ε={agent.epsilon:.3f}")

        # sauvegarde modèle par symbole
        agent.save(f"models/dqn_{symbol.replace('/','_')}.h5")
        print(f"Model saved for {symbol}")

    print("=== All trainings done ===")
