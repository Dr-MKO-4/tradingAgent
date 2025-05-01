import pandas as pd
import numpy as np
names=['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'ADA-USD',
    'XRP-USD', 'DOGE-USD', 'AVAX-USD', 'MATIC-USD', 'LTC-USD']
for name in names:
    # Read the dataset
    dataset = pd.read_csv(fr'M:\Ecole\tradingAgent\data\exports\{name}.csv')
    data=dataset.iloc[2:,:].values
    data=pd.DataFrame(data=data, columns=['Date']+dataset.columns[1:].tolist())
    data.to_csv(fr'M:\Ecole\tradingAgent\data\exports\{name}.csv', index=False)
    print('OK')
    # print(data.head(5))
    # # Convert the 'Date' column to datetime format
    # data['Date'] = pd.to_datetime(data['Date'], format='%Y-%m-%d')
    # # Set the 'Date' column as the index
    # data.set_index('Date', inplace=True)
    # # Convert the data to numeric values
    # data = data.apply(pd.to_numeric, errors='coerce')
    # # Drop rows with NaN values
    # data.dropna(inplace=True)
    # data.to_csv(fr'M:\Ecole\tradingAgent\data\exports\{name}.csv', index=False)



