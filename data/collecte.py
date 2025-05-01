import yfinance as yf
import psycopg2
import pandas as pd
import os
from psycopg2.extras import execute_batch

# Informations de connexion à la base de données PostgreSQL
DB_CONFIG = {
    'dbname': 'tradingAgent',
    'user': 'miguel',
    'password': 'Mkomegmbdysdia4',
    'host': 'localhost',
    'port': '5432'
}

# Utilisation de context managers pour assurer cleanup et transactions atomiques
with psycopg2.connect(**DB_CONFIG) as conn, conn.cursor() as cursor:
    cryptos = [ 'BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'ADA-USD',
    'XRP-USD', 'DOGE-USD', 'AVAX-USD', 'MATIC-USD', 'LTC-USD']
    os.makedirs("data/exports", exist_ok=True)

    def insert_crypto(symbol, name):
        cursor.execute(
            """
            INSERT INTO cryptos (symbol, name)
            VALUES (%s, %s)
            ON CONFLICT (symbol) DO NOTHING
            """, (symbol, name)
        )

    def insert_indicators(crypto_id, df):
        # Filtrer les NaN et convertir timestamp en UTC-aware
        # df = df.dropna(subset=['Close'])
        df.index = df.index.tz_localize('UTC')
        records = [
            (crypto_id, ts.to_pydatetime(), None, None, None, None, None, None, float(row['Close']))
            for ts, row in df.iterrows()
        ]
        execute_batch(cursor,
            """
            INSERT INTO indicators
              (crypto_id, timestamp, rsi, macd, sma_50, sma_200, bollinger_upper, bollinger_lower, price)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (crypto_id, timestamp) DO NOTHING
            """,
            records
        )

    for crypto in cryptos:
        print(f"[⋯] Download {crypto}")
        data = yf.download(
            crypto,
            start='2020-01-01',
            end='2025-01-01',
            interval='1d',
            auto_adjust=False,
            progress=True
        )
        if data.empty:
            print(f"[!] Pas de données pour {crypto}, skip.")
            continue

        # CSV
        path = f"data/exports/{crypto}.csv"
        data.to_csv(path)
        print(f"[✔] CSV → {path}")

        # upsert crypto + indicators atomiquement
        insert_crypto(crypto, crypto)
        cursor.execute("SELECT id FROM cryptos WHERE symbol = %s", (crypto,))
        crypto_id = cursor.fetchone()[0]
        insert_indicators(crypto_id, data)
        conn.commit()
        print(f"[✔] DB → {crypto}")

print("[✔] Done")
