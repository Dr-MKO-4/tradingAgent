// src/features/History/historyAPI.js
export async function fetchHistory() {
    const response = await fetch('/api/history');
    const data = await response.json();
    return data;
  }
  