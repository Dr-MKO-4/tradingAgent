// src/features/History/HistoryTable.jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadHistory } from './historySlice';

export default function HistoryTable() {
  const dispatch = useDispatch();
  const { data, status, error } = useSelector((state) => state.history);

  useEffect(() => {
    dispatch(loadHistory());
  }, [dispatch]);

  if (status === 'loading') return <p>Chargement de l’historique…</p>;
  if (status === 'failed') return <p>Erreur : {error}</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Valeur portefeuille</th>
        </tr>
      </thead>
      <tbody>
        {data.map((entry, i) => (
          <tr key={i}>
            <td>{entry.date}</td>
            <td>{entry.portfolio_value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
