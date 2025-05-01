-- Table des cryptomonnaies
CREATE TABLE cryptos (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- Indicateurs techniques
CREATE TABLE indicators (
  id SERIAL PRIMARY KEY,
  crypto_id INT REFERENCES cryptos(id) ON DELETE CASCADE,
  timestamp TIMESTAMP NOT NULL,
  rsi FLOAT,
  macd FLOAT,
  sma_50 FLOAT,
  sma_200 FLOAT,
  bollinger_upper FLOAT,
  bollinger_lower FLOAT,
  price FLOAT
);

-- Simulations d'entraînement
CREATE TABLE simulations (
  id SERIAL PRIMARY KEY,
  crypto_id INT REFERENCES cryptos(id) ON DELETE CASCADE,
  simulation_name VARCHAR(255),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  reward DECIMAL(10,2),
  num_trades INT,
  total_profit DECIMAL(10,2),
  sharpe_ratio DECIMAL(10,2),
  max_drawdown DECIMAL(10,2)
);

-- Transactions de simulation
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  simulation_id INT REFERENCES simulations(id) ON DELETE CASCADE,
  action VARCHAR(20),
  amount DECIMAL(10,2),
  price DECIMAL(10,2),
  timestamp TIMESTAMP NOT NULL,
  profit DECIMAL(10,2)
);

-- Paramètres d'agent DQN
CREATE TABLE agents (
  id SERIAL PRIMARY KEY,
  agent_name VARCHAR(255),
  epsilon DECIMAL(5,4),
  gamma DECIMAL(5,4),
  batch_size INT,
  learning_rate DECIMAL(5,4),
  model_version VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performances des agents
CREATE TABLE agent_performance (
  id SERIAL PRIMARY KEY,
  agent_id INT REFERENCES agents(id),
  simulation_id INT REFERENCES simulations(id),
  accuracy DECIMAL(5,2),
  profit_ratio DECIMAL(10,2),
  max_profit DECIMAL(10,2),
  num_correct_trades INT,
  num_incorrect_trades INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.1 Passer tous les TIMESTAMP en timestamptz
ALTER TABLE indicators      ALTER COLUMN timestamp TYPE timestamptz USING timestamp AT TIME ZONE 'UTC';
ALTER TABLE simulations     ALTER COLUMN start_date TYPE timestamptz USING start_date AT TIME ZONE 'UTC';
ALTER TABLE simulations     ALTER COLUMN end_date   TYPE timestamptz USING end_date   AT TIME ZONE 'UTC';
ALTER TABLE transactions    ALTER COLUMN timestamp TYPE timestamptz USING timestamp AT TIME ZONE 'UTC';
ALTER TABLE agents          ALTER COLUMN created_at TYPE timestamptz DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE agent_performance ALTER COLUMN created_at TYPE timestamptz DEFAULT CURRENT_TIMESTAMP;

-- 1.2 Empêcher les doublons d’indicateurs (crypto_id + timestamp)
ALTER TABLE indicators
  ADD CONSTRAINT uq_indicators_crypto_time UNIQUE (crypto_id, timestamp);

-- 1.3 Harmoniser les types numériques pour les prix & indicateurs
--    On choisit NUMERIC pour les montants financiers (prix, profits) et FLOAT pour les ratios techniques
ALTER TABLE indicators
  ALTER COLUMN price TYPE numeric(18,8) USING price::numeric(18,8);
ALTER TABLE transactions
  ALTER COLUMN price TYPE numeric(18,8) USING price;
ALTER TABLE simulations
  ALTER COLUMN total_profit TYPE numeric(18,8) USING total_profit;
ALTER TABLE simulations
  ALTER COLUMN reward TYPE numeric(18,8) USING reward;

-- 1.4 Contrainte ENUM pour l’action de transaction
CREATE TYPE trade_action AS ENUM ('BUY','SELL');
ALTER TABLE transactions
  ALTER COLUMN action TYPE trade_action USING UPPER(action)::trade_action;
