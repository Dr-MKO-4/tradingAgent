import torch
import torch.nn as nn

class DuelingQNetwork(nn.Module):
    def __init__(self, input_dim, hidden_dims, action_dim):
        super().__init__()
        # trunk commun
        self.feature = nn.Sequential(
            nn.Linear(input_dim, hidden_dims[0]),
            nn.ReLU()
        )
        # Value stream
        self.value_stream = nn.Sequential(
            nn.Linear(hidden_dims[0], hidden_dims[1]),
            nn.ReLU(),
            nn.Linear(hidden_dims[1], 1)
        )
        # Advantage stream
        self.adv_stream = nn.Sequential(
            nn.Linear(hidden_dims[0], hidden_dims[1]),
            nn.ReLU(),
            nn.Linear(hidden_dims[1], action_dim)
        )

    def forward(self, x):
        f = self.feature(x)
        v = self.value_stream(f)                     # shape [B,1]
        a = self.adv_stream(f)                       # shape [B,A]
        # Q(s,a) = V(s) + (A(s,a) - mean_a A(s,a))
        return v + (a - a.mean(dim=1, keepdim=True))
