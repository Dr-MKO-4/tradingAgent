import pandas as pd
import numpy as np
from pathlib import Path

# On considère que le script est exécuté depuis la racine du projet
project_root = Path.cwd()

# Définit le dossier exports relatif à la racine
exports_dir = project_root / 'data' / 'exports'

names = [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'ADA-USD',
    'XRP-USD', 'DOGE-USD', 'AVAX-USD', 'MATIC-USD', 'LTC-USD'
]

for name in names:
    file_path = exports_dir / f'{name}.csv'
    
    # Lecture du CSV
    dataset = pd.read_csv(file_path)
    
    # On saute les deux premières lignes, puis on réapplique les noms de colonnes
    data = dataset.iloc[2:].copy()
    data.columns = ['Date'] + dataset.columns[1:].tolist()
    
    # Réécriture du CSV au même emplacement
    data.to_csv(file_path, index=False)
    print(f'{name} traité — OK')
