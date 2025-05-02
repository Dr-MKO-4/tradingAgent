# File: agent/data_pipeline.py

import os
import pandas as pd
import ta
import psycopg2
from psycopg2.extras import RealDictCursor
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from pathlib import Path

"""
Module: data_pipeline.py

This module provides classes to fetch OHLCV data (from CSV files or a PostgreSQL database),
compute technical indicators, normalize features, and assemble these steps into a reusable
scikit-learn-style pipeline for preprocessing cryptocurrency time series data.
"""

# Determine project root directory dynamically
try:
    ROOT_DIR = Path(__file__).resolve().parents[1]
except NameError:
    # Fallback when __file__ is not defined (e.g., interactive session)
    ROOT_DIR = Path.cwd().parents[0]


class DataFetcher:
    """
    Fetch OHLCV data for a given symbol from CSV files or a PostgreSQL database.

    Parameters
    ----------
    source : str, default='csv'
        Data source: 'csv' for file-based loading, 'db' for database.
    csv_folder : Path or str, optional
        Path to the folder containing CSV exports. Can be absolute or relative to project root.
    db_config : dict, optional
        Configuration for psycopg2 connection (keys: dbname, user, password, host, port).
    """
    def __init__(self, source="csv", csv_folder: Path = None, db_config: dict = None):
        self.source = source.lower()
        self.db_config = db_config or {}

        # Resolve CSV folder path
        if csv_folder:
            p = Path(csv_folder)
            # Use absolute path directly; otherwise, treat relative to project root
            self.csv_folder = p if p.is_absolute() else ROOT_DIR / p
        else:
            # Default folder under project root
            self.csv_folder = ROOT_DIR / "data" / "exports"

    def fetch(self, symbol: str) -> pd.DataFrame:
        """
        Load data for the given symbol.

        For CSV source, expects a file named '<symbol>.csv' (with USDT->-USD conversion).
        For database source, executes a SQL query to fetch OHLCV from 'indicators' table.

        Parameters
        ----------
        symbol : str
            Cryptocurrency symbol, e.g., 'BTCUSDT' or 'ETH-USD'.

        Returns
        -------
        pd.DataFrame
            Time-indexed DataFrame with columns: ['open', 'high', 'low', 'close', 'volume'].

        Raises
        ------
        FileNotFoundError
            If CSV file is not found.
        ValueError
            If no rows are returned from the database.
        """
        def _csv_filename(sym: str) -> str:
            # Convert symbol suffix USDT to '-USD' for file naming
            return (sym.replace("USDT", "-USD") + ".csv") if sym.endswith("USDT") else sym + ".csv"

        if self.source == "csv":
            fname = _csv_filename(symbol)
            path = self.csv_folder / fname
            if not path.exists():
                raise FileNotFoundError(f"CSV introuvable : {path}")

            # Read CSV with date parsing and lowercase column names
            df = pd.read_csv(path, parse_dates=["Date"], index_col="Date")
            df.rename(columns=str.lower, inplace=True)
            return df

        elif self.source == "db":
            # Connect to PostgreSQL and fetch data
            conn = psycopg2.connect(**self.db_config)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """
                SELECT
                  ts.timestamp,
                  ts.price    AS close,
                  ts.volume,
                  ts.open,
                  ts.high,
                  ts.low
                FROM indicators ts
                JOIN cryptos c ON ts.crypto_id = c.id
                WHERE c.symbol = %s
                ORDER BY ts.timestamp
                """, (symbol,)
            )
            rows = cur.fetchall()
            conn.close()

            if not rows:
                raise ValueError(f"Aucune donnée en base pour le symbole '{symbol}'")

            # Build DataFrame and set datetime index
            df = pd.DataFrame(rows)
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df.set_index("timestamp", inplace=True)
            return df

        else:
            raise ValueError(f"Source invalide : {self.source!r}. Choisir 'csv' ou 'db'.")


class IndicatorTransformer(BaseEstimator, TransformerMixin):
    """
    Compute technical indicators on OHLCV data and optionally drop NaN values.

    Parameters
    ----------
    dropna : bool, default=True
        If True, drop all rows containing NaN after indicator calculations.
    """
    def __init__(self, dropna: bool = True):
        self.dropna = dropna

    def fit(self, X, y=None):
        # No fitting necessary for indicator computation
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Add columns for RSI, SMA, EMA, MACD, and Bollinger Bands.

        Parameters
        ----------
        X : pd.DataFrame
            Input DataFrame with at least a 'close' column.

        Returns
        -------
        pd.DataFrame
            DataFrame with new indicator columns, optionally NaN-free.
        """
        df = X.copy()

        # Momentum indicators
        df['RSI_14'] = ta.momentum.RSIIndicator(df['close'], 14).rsi()

        # Trend indicators
        df['SMA_50'] = ta.trend.SMAIndicator(df['close'], 50).sma_indicator()
        df['SMA_200'] = ta.trend.SMAIndicator(df['close'], 200).sma_indicator()
        df['EMA_12'] = ta.trend.EMAIndicator(df['close'], 12).ema_indicator()
        df['EMA_26'] = ta.trend.EMAIndicator(df['close'], 26).ema_indicator()

        # MACD and signal line
        macd = ta.trend.MACD(df['close'])
        df['MACD'] = macd.macd()
        df['MACD_sig'] = macd.macd_signal()
        df['MACD_diff'] = macd.macd_diff()

        # Bollinger Bands
        bb = ta.volatility.BollingerBands(df['close'], 20)
        df['BB_up'] = bb.bollinger_hband()
        df['BB_mid'] = bb.bollinger_mavg()
        df['BB_low'] = bb.bollinger_lband()

        # Optionally drop rows with NaN (initial periods)
        return df.dropna() if self.dropna else df


class Normalizer(BaseEstimator, TransformerMixin):
    """
    Scale features to [0, 1] range using min-max normalization.

    Attributes
    ----------
    min_ : dict
        Minimum value per column computed during fit.
    max_ : dict
        Maximum value per column computed during fit.
    """
    def __init__(self):
        self.min_ = {}
        self.max_ = {}

    def fit(self, X: pd.DataFrame, y=None):
        """
        Compute min and max values for each column.
        """
        for col in X.columns:
            self.min_[col] = X[col].min()
            self.max_[col] = X[col].max()
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Apply min-max scaling to each feature column.
        """
        df = X.copy()
        for col in df.columns:
            df[col] = (df[col] - self.min_[col]) / (self.max_[col] - self.min_[col] + 1e-8)
        return df


class DataPipeline:
    """
    Orchestrate data fetching, indicator computation, and normalization
    into a single scikit-learn Pipeline.
    """
    def __init__(self, fetcher: DataFetcher, transformer: IndicatorTransformer, normalizer: Normalizer):
        # Build an sklearn Pipeline for standardized API
        self.pipeline = Pipeline([
            ('fetch', fetcher),             # calls fetcher.fetch()
            ('indicators', transformer),    # calls transformer.transform()
            ('scaling', normalizer),        # calls normalizer.transform()
        ])

    def run(self, symbol: str) -> pd.DataFrame:
        """
        Execute the full pipeline: fetch raw data, add indicators, then scale.
        """
        raw      = self.pipeline.named_steps['fetch'].fetch(symbol)
        with_ind = self.pipeline.named_steps['indicators'].transform(raw)
        scaled   = self.pipeline.named_steps['scaling'].fit_transform(with_ind)
        return scaled


# Example usage
if __name__ == "__main__":  # pragma: no cover
    DB_CONFIG = {
        'dbname': 'tradingAgent', 'user': 'miguel',
        'password': 'Mkomegmbdysdia4', 'host': 'localhost', 'port': '5432'
    }
    fetcher = DataFetcher(source="csv", csv_folder="data/exports", db_config=DB_CONFIG)
    indicator_transformer = IndicatorTransformer()
    normalizer = Normalizer()
    pipeline = DataPipeline(fetcher, indicator_transformer, normalizer)
    df_ready = pipeline.run("BTCUSDT")
    print(df_ready.head())
