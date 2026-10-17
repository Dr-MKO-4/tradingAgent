import os
import pandas as pd
import ta
import psycopg2
from psycopg2.extras import RealDictCursor
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline
from pathlib import Path

try:
    ROOT_DIR = Path(__file__).resolve().parents[2]
except NameError:
    ROOT_DIR = Path.cwd().parents[0]
print(ROOT_DIR)

class DataFetcher:
    def __init__(self, source="csv", csv_folder: Path = None, db_config: dict = None):
        self.source = source.lower()
        self.db_config = db_config or {}
        if csv_folder:
            p = Path(csv_folder)
            self.csv_folder = p if p.is_absolute() else ROOT_DIR / p
        else:
            self.csv_folder = ROOT_DIR / "data" / "exports"

    def fetch(self, symbol: str) -> pd.DataFrame:
        def _csv_filename(sym):
            return (sym.replace("USDT", "-USD") + ".csv") if sym.endswith("USDT") else sym + ".csv"
        if self.source == "csv":
            path = self.csv_folder / _csv_filename(symbol)
            if not path.exists():
                raise FileNotFoundError(f"CSV introuvable: {path}")
            df = pd.read_csv(path, parse_dates=["Date"], index_col="Date")
            df.rename(columns=str.lower, inplace=True)
            return df
        elif self.source == "db":
            conn = psycopg2.connect(**self.db_config)
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(
                """
                SELECT ts.timestamp, ts.price AS close, ts.volume, ts.open, ts.high, ts.low
                FROM indicators ts
                JOIN cryptos c ON ts.crypto_id = c.id
                WHERE c.symbol = %s
                ORDER BY ts.timestamp
                """, (symbol,)
            )
            rows = cur.fetchall()
            conn.close()
            if not rows:
                raise ValueError(f"Aucune donnée pour '{symbol}'")
            df = pd.DataFrame(rows)
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df.set_index("timestamp", inplace=True)
            return df
        else:
            raise ValueError(f"Source invalide: {self.source}")

class IndicatorTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, dropna: bool = True):
        self.dropna = dropna

    def fit(self, X, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        df = X.copy()
        df['RSI_14'] = ta.momentum.RSIIndicator(df['close'], 14).rsi()
        df['SMA_50'] = ta.trend.SMAIndicator(df['close'], 50).sma_indicator()
        df['SMA_200'] = ta.trend.SMAIndicator(df['close'], 200).sma_indicator()
        df['EMA_12'] = ta.trend.EMAIndicator(df['close'], 12).ema_indicator()
        df['EMA_26'] = ta.trend.EMAIndicator(df['close'], 26).ema_indicator()
        macd = ta.trend.MACD(df['close'])
        df['MACD'] = macd.macd()
        df['MACD_sig'] = macd.macd_signal()
        df['MACD_diff'] = macd.macd_diff()
        bb = ta.volatility.BollingerBands(df['close'], 20)
        df['BB_up'] = bb.bollinger_hband()
        df['BB_mid'] = bb.bollinger_mavg()
        df['BB_low'] = bb.bollinger_lband()
        return df.dropna() if self.dropna else df

class Normalizer(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.min_, self.max_ = {}, {}

    def fit(self, X: pd.DataFrame, y=None):
        for col in X.columns:
            self.min_[col] = X[col].min()
            self.max_[col] = X[col].max()
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        df = X.copy()
        for col in df.columns:
            df[col] = (df[col] - self.min_[col]) / (self.max_[col] - self.min_[col] + 1e-8)
        return df

class DataPipeline:
    def __init__(self, fetcher: DataFetcher, transformer: IndicatorTransformer, normalizer: Normalizer):
        self.pipeline = Pipeline([
            ('fetch', fetcher),
            ('indicators', transformer),
            ('scaling', normalizer),
        ])

    def run(self, symbol: str) -> pd.DataFrame:
        raw      = self.pipeline.named_steps['fetch'].fetch(symbol)
        with_ind = self.pipeline.named_steps['indicators'].transform(raw)
        scaled   = self.pipeline.named_steps['scaling'].fit_transform(with_ind)
        return scaled
