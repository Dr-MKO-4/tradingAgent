import random
from collections import deque
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

# 1) Replay memory
class ReplayBuffer:
    def __init__(self, capacity):
        self.buffer = deque(maxlen=capacity)

    def push(self, state, action, reward, next_state, done):
        """Ajoute une transition à la mémoire."""
        self.buffer.append((state, action, reward, next_state, done))

    def sample(self, batch_size):
        """Échantillonne un batch aléatoire."""
        batch = random.sample(self.buffer, batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)
        return (
            np.array(states),
            np.array(actions),
            np.array(rewards, dtype=np.float32),
            np.array(next_states),
            np.array(dones, dtype=np.uint8)
        )

    def __len__(self):
        return len(self.buffer)


# 2) Q-Network (MLP simple)
class QNetwork(nn.Module):
    def __init__(self, input_dim, hidden_dims, output_dim):
        super().__init__()
        layers = []
        prev_dim = input_dim
        # construction dynamique des couches cachées
        for h in hidden_dims:
            layers.append(nn.Linear(prev_dim, h))
            layers.append(nn.ReLU())
            prev_dim = h
        layers.append(nn.Linear(prev_dim, output_dim))
        self.net = nn.Sequential(*layers)

    def forward(self, x):
        return self.net(x)


# 3) Agent DQN
class DQNAgent:
    def __init__(
        self,
        state_dim,
        action_dim,
        hidden_dims=[128,128],
        buffer_size=10000,
        batch_size=64,
        gamma=0.99,
        lr=1e-3,
        target_update_freq=1000,
        device=None
    ):
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # réseaux principal et cible
        self.q_net = QNetwork(state_dim, hidden_dims, action_dim).to(self.device)
        self.target_net = QNetwork(state_dim, hidden_dims, action_dim).to(self.device)
        self.target_net.load_state_dict(self.q_net.state_dict())
        self.target_net.eval()

        self.optimizer = optim.Adam(self.q_net.parameters(), lr=lr)
        self.replay_buffer = ReplayBuffer(buffer_size)

        self.batch_size = batch_size
        self.gamma = gamma
        self.target_update_freq = target_update_freq
        self.train_steps = 0

    def select_action(self, state, epsilon):
        """Epsilon-greedy action selection."""
        if random.random() < epsilon:
            return random.randrange(self.q_net.net[-1].out_features)
        state_t = torch.tensor(state, dtype=torch.float32).unsqueeze(0).to(self.device)
        with torch.no_grad():
            qvals = self.q_net(state_t)
        return qvals.argmax().item()

    def push_transition(self, state, action, reward, next_state, done):
        self.replay_buffer.push(state, action, reward, next_state, done)

    def update(self):
        """Tire un batch et applique un gradient step sur le loss DQN."""
        if len(self.replay_buffer) < self.batch_size:
            return

        states, actions, rewards, next_states, dones = self.replay_buffer.sample(self.batch_size)

        # convertir en tenseurs
        states_v      = torch.tensor(states, dtype=torch.float32).to(self.device)
        actions_v     = torch.tensor(actions, dtype=torch.int64).unsqueeze(1).to(self.device)
        rewards_v     = torch.tensor(rewards).unsqueeze(1).to(self.device)
        next_states_v = torch.tensor(next_states, dtype=torch.float32).to(self.device)
        dones_v       = torch.tensor(dones, dtype=torch.float32).unsqueeze(1).to(self.device)

        # Q(s,a)
        q_values = self.q_net(states_v).gather(1, actions_v)

        # max_a' Q_target(s',a')
        with torch.no_grad():
            q_next = self.target_net(next_states_v).max(1)[0].unsqueeze(1)
            q_target = rewards_v + self.gamma * q_next * (1 - dones_v)

        # loss MSE
        loss = nn.functional.mse_loss(q_values, q_target)

        # backprop
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

        # update target network
        self.train_steps += 1
        if self.train_steps % self.target_update_freq == 0:
            self.target_net.load_state_dict(self.q_net.state_dict())

    def save(self, path):
        torch.save(self.q_net.state_dict(), path)

    def load(self, path):
        self.q_net.load_state_dict(torch.load(path))
        self.target_net.load_state_dict(self.q_net.state_dict())
