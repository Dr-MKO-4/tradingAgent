import gym
from gym import spaces
import numpy as np

class CryptoTradingEnv(gym.Env):
    metadata = {'render.modes': ['human']}

    def __init__(self, df_scaled, window_size=50, transaction_cost=0.001):
        super().__init__()
        self.df = df_scaled.reset_index(drop=True).values
        self.window_size = window_size
        self.transaction_cost = transaction_cost
        self.n_steps, self.n_features = self.df.shape
        # actions: 0=hold,1=buy,2=sell
        self.action_space = spaces.Discrete(3)
        # observation: window_size x (n_features + 1)
        self.observation_space = spaces.Box(
            low=0.0, high=1.0,
            shape=(self.window_size, self.n_features+1),
            dtype=np.float32
        )
        self.reset()

    def reset(self):
        self.current_step = self.window_size
        self.position = 0
        self.cash = 1.0
        self.crypto_held = 0.0
        self.initial_value = 1.0
        return self._get_observation()

    def step(self, action):
        if self.current_step >= self.n_steps - 1:
            return self._get_observation(), 0.0, True, {
                'portfolio_value': self._get_portfolio_value(
                    self.df[self.current_step-1, self._price_col_index()]
                )
            }

        price = self.df[self.current_step, self._price_col_index()]
        prev_value = self._get_portfolio_value(price)

        if action == 1 and self.position <= 0:
            self._execute_trade(price, target_position=1)
        elif action == 2 and self.position >= 0:
            self._execute_trade(price, target_position=-1)

        self.current_step += 1
        done = (self.current_step >= self.n_steps - 1)

        new_price = self.df[self.current_step, self._price_col_index()]
        new_value = self._get_portfolio_value(new_price)
        reward = new_value - prev_value

        obs = self._get_observation()
        info = {'portfolio_value': new_value}
        return obs, reward, done, info

    def _execute_trade(self, price, target_position):
        if self.position == 1:
            self.cash += self.crypto_held * price * (1 - self.transaction_cost)
            self.crypto_held = 0.0
        elif self.position == -1:
            cost = abs(self.crypto_held) * price * (1 + self.transaction_cost)
            self.cash -= cost
            self.crypto_held = 0.0

        if target_position == 1:
            amount = self.cash / (price * (1 + self.transaction_cost))
            self.crypto_held = amount
            self.cash -= amount * price * (1 + self.transaction_cost)
        elif target_position == -1:
            amount = self.cash / (price * (1 + self.transaction_cost))
            self.crypto_held = -amount
            self.cash += amount * price * (1 - self.transaction_cost)

        self.position = target_position

    def _get_portfolio_value(self, price):
        return self.cash + self.crypto_held * price

    def _get_observation(self):
        frame = self.df[self.current_step-self.window_size:self.current_step, :]
        pos_norm = (self.position + 1) / 2.0
        pos_col = np.full((self.window_size, 1), pos_norm, dtype=np.float32)
        return np.hstack([frame, pos_col]).astype(np.float32)

    def render(self, mode='human'):
        price = self.df[self.current_step, self._price_col_index()]
        val = self._get_portfolio_value(price)
        print(f"Step {self.current_step} | Price {price:.4f} | Pos {self.position} | Portf {val:.4f}")

    def _price_col_index(self):
        return 0
