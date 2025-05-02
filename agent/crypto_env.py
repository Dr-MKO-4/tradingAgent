# crypto_env.py

import gym
from gym import spaces
import numpy as np

class CryptoTradingEnv(gym.Env):
    """
    Environnement de trading pour DQN.
    - df_scaled : DataFrame normalisé issu de votre pipeline (index time, colonnes indicateurs)
    - window_size : taille de la fenêtre d'observation
    - transaction_cost : coût proportionnel appliqué aux montants tradés
    """
    metadata = {'render.modes': ['human']}
    

    def __init__(self, df_scaled, window_size=50, transaction_cost=0.001):
        super().__init__()

        # stocker les données et paramètres
        self.df = df_scaled.reset_index(drop=True).values
        self.window_size = window_size
        self.transaction_cost = transaction_cost

        # dimensions
        self.n_steps, self.n_features = self.df.shape

        # action: 0 = hold, 1 = buy, 2 = sell
        self.action_space = spaces.Discrete(3)

        # observation: window_size × (n_features + 1 position)
        self.observation_space = spaces.Box(
            low=0.0, high=1.0,
            shape=(self.window_size, self.n_features + 1),
            dtype=np.float32
        )

        self.reset()

    def reset(self):
        # pointer de temps au début de la fenêtre
        self.current_step = self.window_size
        # position : 0 = neutral, 1 = long, -1 = short
        self.position = 0
        # cash et actif (unités de crypto)
        self.cash = 1.0
        self.crypto_held = 0.0
        # valeur initiale du portefeuille
        self.initial_value = 1.0

        return self._get_observation()

    def step(self, action):
        # Si on a déjà épuisé les données, on termine l'épisode sans erreur
        if self.current_step >= self.n_steps - 1:
            # on renvoie l’observation courante, reward=0, done=True
            return self._get_observation(), 0.0, True, {
                'portfolio_value': self._get_portfolio_value(
                    self.df[self.current_step-1, self._price_col_index()]
                )
            }

        # prix au pas courant (avant exécution de l’action)
        price = self.df[self.current_step, self._price_col_index()]
        prev_value = self._get_portfolio_value(price)

        # exécution de l’action
        if action == 1 and self.position <= 0:
            # passer long: acheter avec tout le cash
            self._execute_trade(price, target_position=1)
        elif action == 2 and self.position >= 0:
            # passer short: vendre à découvert ou liquider long
            self._execute_trade(price, target_position=-1)
        # action == 0 : hold

        # avancer d’un pas
        self.current_step += 1
        done = (self.current_step >= self.n_steps - 1)

        # prix au pas suivant (pour calcul reward)
        new_price = self.df[self.current_step, self._price_col_index()]
        new_value = self._get_portfolio_value(new_price)
        reward = new_value - prev_value

        obs = self._get_observation()
        info = {'portfolio_value': new_value}

        return obs, reward, done, info

    def _execute_trade(self, price, target_position):
        """
        Ajuste self.position vers target_position en utilisant tout le capital,
        applique les coûts de transaction.
        """
        # clôture de la position existante
        if self.position == 1:
            # vendre crypto held
            self.cash += self.crypto_held * price * (1 - self.transaction_cost)
            self.crypto_held = 0.0
        elif self.position == -1:
            # racheter la position short
            cost = abs(self.crypto_held) * price * (1 + self.transaction_cost)
            self.cash -= cost
            self.crypto_held = 0.0

        # ouverture de la nouvelle position
        if target_position == 1:
            # acheter autant que possible
            amount = self.cash / (price * (1 + self.transaction_cost))
            self.crypto_held = amount
            self.cash -= amount * price * (1 + self.transaction_cost)
        elif target_position == -1:
            # vente à découvert
            amount = self.cash / (price * (1 + self.transaction_cost))
            self.crypto_held = -amount
            self.cash += amount * price * (1 - self.transaction_cost)

        self.position = target_position

    def _get_portfolio_value(self, price):
        return self.cash + self.crypto_held * price

    def _get_observation(self):
        """
        Construit la matrice d'observation de forme
        (window_size, n_features+1), où la dernière colonne est la position normalisée.
        """
        frame = self.df[self.current_step - self.window_size : self.current_step, :]
        # normalisation de la position : -1→0.0, 0→0.5, 1→1.0
        pos_norm = (self.position + 1) / 2.0
        pos_col = np.full((self.window_size, 1), pos_norm, dtype=np.float32)
        obs = np.hstack([frame, pos_col])
        return obs.astype(np.float32)

    def render(self, mode='human'):
        price = self.df[self.current_step, self._price_col_index()]
        value = self._get_portfolio_value(price)
        print(f"Step: {self.current_step} | Price: {price:.4f} | "
              f"Position: {self.position} | Portfolio: {value:.4f}")

    def _price_col_index(self):
        """
        Retourne l’indice de la colonne 'close' dans self.df.
        On suppose que 'close' était la première colonne avant transformation.
        """
        return 0
