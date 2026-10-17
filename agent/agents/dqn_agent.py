import torch
import torch.nn.functional as F
import numpy as np

from networks.dueling_q_network import DuelingQNetwork
from buffers.prioritized_replay import PrioritizedReplayBuffer

class DQNAgent:
    def __init__(
        self, state_dim, action_dim,
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
        self.q_net = DuelingQNetwork(state_dim, hidden_dims, action_dim).to(self.device)
        self.target_net = DuelingQNetwork(state_dim, hidden_dims, action_dim).to(self.device)
        self.target_net.load_state_dict(self.q_net.state_dict())
        self.target_net.eval()

        self.optimizer = torch.optim.Adam(self.q_net.parameters(), lr=lr)
        # Prioritized replay
        self.buffer = PrioritizedReplayBuffer(buffer_size)
        self.batch_size = batch_size
        self.gamma = gamma
        self.target_update_freq = target_update_freq
        self.step_count = 0

    def select_action(self, state, epsilon):
        if np.random.rand() < epsilon:
            return np.random.randint(self.q_net.feature[0].in_features)  # random action
        state_v = torch.tensor(state, dtype=torch.float32).unsqueeze(0).to(self.device)
        with torch.no_grad():
            qvals = self.q_net(state_v)
        return qvals.argmax().item()

    def push_transition(self, state, action, reward, next_state, done):
        # calcul d'erreur TD initiale approximative
        state_v = torch.tensor(state, dtype=torch.float32).unsqueeze(0).to(self.device)
        next_v = torch.tensor(next_state, dtype=torch.float32).unsqueeze(0).to(self.device)
        q_val = self.q_net(state_v)[0, action].item()
        # Double DQN target selection
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

        # Q(s,a)
        q_values = self.q_net(states_v).gather(1, actions_v)

        # Double DQN target
        next_actions = self.q_net(next_states_v).argmax(dim=1, keepdim=True)
        q_next = self.target_net(next_states_v).gather(1, next_actions)
        q_target = rewards_v + self.gamma * q_next * (1 - dones_v)

        # TD errors for buffer update
        errors = (q_target - q_values).detach().cpu().numpy().squeeze()
        self.buffer.update_errors(idxs, errors)

        # loss weighted
        loss = (weights_v * F.mse_loss(q_values, q_target, reduction='none')).mean()

        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

        # update target net
        self.step_count += 1
        if self.step_count % self.target_update_freq == 0:
            self.target_net.load_state_dict(self.q_net.state_dict())
