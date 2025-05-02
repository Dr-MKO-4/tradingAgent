// src/utils/financeUtils.js
export function sharpeRatio(returns, rf = 0) {
    const mean = returns.reduce((a,b)=>a+b,0)/returns.length;
    const std = Math.sqrt(returns.map(r=>Math.pow(r-mean,2)).reduce((a,b)=>a+b,0)/returns.length);
    return std===0 ? 0 : (mean - rf)/std;
  }
  export function maxDrawdown(portfolio) {
    let peak = -Infinity, dd = 0;
    portfolio.forEach(p => {
      if (p > peak) peak = p;
      dd = Math.max(dd, (peak - p)/peak);
    });
    return dd;
  }
  