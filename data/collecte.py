import yfinance as yf
import psycopg2
import pandas as pd
import os
from psycopg2 import sql

# Informations de connexion à la base de données PostgreSQL
db_config = {
    'dbname': 'ton_nom_de_base_de_donnees',
    'user': 'ton_utilisateur',
    'password': 'ton_mot_de_passe',
    'host': 'localhost',
    'port': '5432'
}

# Connexion à la base de données PostgreSQL
conn = psycopg2.connect(**db_config)
cursor = conn.cursor()

# Liste des cryptomonnaies et des paires
cryptos = [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'ADA-USD',
    'XRP-USD', 'DOGE-USD', 'AVAX-USD', 'MATIC-USD', 'LTC-USD'
]

# Création du dossier d'export CSV si inexistant
os.makedirs("data/exports", exist_ok=True)

# Fonction pour insérer une crypto dans la base de données
def insert_crypto(symbol, name):
    cursor.execute("""
        INSERT INTO cryptos (symbol, name)
        VALUES (%s, %s)
        ON CONFLICT (symbol) DO NOTHING
    """, (symbol, name))
    conn.commit()

# Fonction pour insérer les indicateurs dans PostgreSQL
def insert_indicators(crypto_id, data):
    for index, row in data.iterrows():
        timestamp = index
        price = row['Close']
        rsi = None
        macd = None
        sma_50 = None
        sma_200 = None
        bollinger_upper = None
        bollinger_lower = None

        cursor.execute("""
            INSERT INTO indicators (crypto_id, timestamp, rsi, macd, sma_50, sma_200, bollinger_upper, bollinger_lower, price)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (crypto_id, timestamp, rsi, macd, sma_50, sma_200, bollinger_upper, bollinger_lower, price))
    conn.commit()

# Télécharger les données, insérer dans la DB et sauvegarder en CSV
for crypto in cryptos:
    print(f"[⋯] Téléchargement des données pour {crypto}")
    data = yf.download(crypto, start='2020-01-01', end='2025-01-01', interval='1d')

    # Enregistrer en CSV
    csv_path = f"data/exports/{crypto}.csv"
    data.to_csv(csv_path)
    print(f"[✔] Données enregistrées dans {csv_path}")

    # Insérer dans la table cryptos
    insert_crypto(crypto, crypto)

    # Récupérer l'ID
    cursor.execute("SELECT id FROM cryptos WHERE symbol = %s", (crypto,))
    crypto_id = cursor.fetchone()[0]

    # Insérer dans la table indicators
    insert_indicators(crypto_id, data)

    print(f"[✔] Données de {crypto} insérées dans PostgreSQL")

# Fermer la connexion
cursor.close()
conn.close()
print("[✔] Traitement terminé.")
