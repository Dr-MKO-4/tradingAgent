import pandas as pd
import ta
import psycopg2
from psycopg2.extras import RealDictCursor
import os

# Configuration DB (modifie avec tes valeurs)
DB_CONFIG = {
    'dbname': 'tradingAgent',
    'user': 'miguel',
    'password': 'Mkomegmbdysdia4',
    'host': 'localhost',
    'port': '5432'
}

# Fonction de récupération depuis la base PostgreSQL
def fetch_data_from_db(symbol):
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    cursor.execute("""
        SELECT ts.timestamp, ts.price
        FROM indicators ts
        JOIN cryptos c ON ts.crypto_id = c.id
        WHERE c.symbol = %s
        ORDER BY ts.timestamp ASC
    """, (symbol,))

    rows = cursor.fetchall()
    conn.close()

    if not rows:
        raise ValueError(f"Aucune donnée trouvée pour {symbol} dans la base.")

    df = pd.DataFrame(rows)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df.set_index('timestamp', inplace=True)
    return df


# Fonction de récupération depuis CSV
def fetch_data_from_csv(symbol, folder="data/exports"):
    path = os.path.join(folder, f"{symbol}.csv")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Fichier CSV non trouvé : {path}")
    
    df = pd.read_csv(path, parse_dates=['Date'], index_col='Date')
    df.rename(columns=str.lower, inplace=True)
    return df


# Calcul des indicateurs
def compute_indicators(df):
    # RSI
    df['RSI_14'] = ta.momentum.RSIIndicator(close=df['close'], window=14).rsi()

    # SMA
    df['SMA_50'] = ta.trend.SMAIndicator(close=df['close'], window=50).sma_indicator()
    df['SMA_200'] = ta.trend.SMAIndicator(close=df['close'], window=200).sma_indicator()

    # EMA
    df['EMA_12'] = ta.trend.EMAIndicator(close=df['close'], window=12).ema_indicator()
    df['EMA_26'] = ta.trend.EMAIndicator(close=df['close'], window=26).ema_indicator()

    # MACD
    macd = ta.trend.MACD(close=df['close'])
    df['MACD'] = macd.macd()
    df['MACD_signal'] = macd.macd_signal()
    df['MACD_diff'] = macd.macd_diff()

    # Bollinger Bands
    bb = ta.volatility.BollingerBands(close=df['close'], window=20)
    df['BB_upper'] = bb.bollinger_hband()
    df['BB_lower'] = bb.bollinger_lband()
    df['BB_middle'] = bb.bollinger_mavg()

    return df.dropna()


# Interface principale du module
def get_indicators(symbol, source="csv"):
    if source == "csv":
        df = fetch_data_from_csv(symbol)
    elif source == "db":
        df = fetch_data_from_db(symbol)
    else:
        raise ValueError("Source invalide. Utiliser 'csv' ou 'db'.")

    df_indicators = compute_indicators(df)
    return df_indicators