// src/pages/History.jsx : historique des simulations
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuRefreshCw, LuPlay, LuHistory, LuChevronRight } from 'react-icons/lu';
import { listSimulations } from '../services/simulation';
import Loader from '../components/UI/Loader';
import { EmptyState, ErrorState } from '../components/UI/State';
import { dateTime, pct, trend, isNum } from '../lib/format';
import { IS_DEMO } from '../lib/mode';
import { loadSessions } from '../lib/sim/history';
import { useLiveSim } from '../contexts/LiveSimContext';

function errorText(err) {
  if (err?.response?.status === 404) return "La route GET /api/simulation n'existe pas sur le backend (404).";
  if (err?.response) return `Le serveur a répondu ${err.response.status}.${err.response.status >= 500 ? ' Le backend Python est-il démarré ?' : ''}`;
  if (err?.request) return "Impossible de joindre l'API. Démarrez le backend Python puis réessayez.";
  return err?.message || 'Erreur réseau';
}

export default function History() {
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [asset, setAsset] = useState('all');

  const live = useLiveSim();
  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    if (IS_DEMO) {
      // Demo mode: sessions of the live simulation, stored in this browser.
      live.persist();
      setList(loadSessions());
      setLoading(false);
      return;
    }
    listSimulations()
      .then((data) => {
        if (!Array.isArray(data)) throw new Error("Réponse inattendue de l'API (liste attendue).");
        setList(data);
      })
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const assets = useMemo(() => [...new Set(list.map((s) => s.crypto).filter(Boolean))], [list]);
  const rows = useMemo(
    () => list
      .filter((s) => asset === 'all' || s.crypto === asset)
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [list, asset],
  );

  return (
    <>
      <div className="page-head enter">
        <div>
          <h1>Historique des simulations</h1>
          <p>{IS_DEMO ? 'Sessions de simulation en direct enregistrées dans ce navigateur.' : 'Toutes les exécutions enregistrées par le backend.'}</p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={load} disabled={loading}>
            <LuRefreshCw aria-hidden="true" />Actualiser
          </button>
          <Link to="/simulation" className="btn btn-primary"><LuPlay aria-hidden="true" />Nouvelle simulation</Link>
        </div>
      </div>

      <section className="card enter enter-2" aria-labelledby="hist-title" aria-busy={loading}>
        <div className="card-head">
          <div>
            <h2 id="hist-title">Exécutions</h2>
            <div className="sub">{loading ? 'Chargement…' : error ? 'Indisponible' : `${rows.length} simulation${rows.length > 1 ? 's' : ''}`}</div>
          </div>
          {assets.length > 1 && (
            <div className="segmented sans" role="group" aria-label="Filtrer par actif">
              <button type="button" aria-pressed={asset === 'all'} onClick={() => setAsset('all')}>Tous</button>
              {assets.map((a) => (
                <button key={a} type="button" aria-pressed={asset === a} onClick={() => setAsset(a)}>{a}</button>
              ))}
            </div>
          )}
        </div>

        {loading && <Loader rows={6} label="Chargement de l'historique" />}

        {!loading && error && (
          <ErrorState
            title="Historique indisponible"
            actions={<button type="button" className="btn" onClick={load}><LuRefreshCw aria-hidden="true" />Réessayer</button>}
          >
            {error}
          </ErrorState>
        )}

        {!loading && !error && rows.length === 0 && (
          <EmptyState
            icon={LuHistory}
            title="Aucune simulation"
            actions={<Link to="/simulation" className="btn btn-primary"><LuPlay aria-hidden="true" />Lancer une simulation</Link>}
          >
            {IS_DEMO ? 'Les sessions de la simulation en direct apparaîtront ici après quelques bougies.' : "Les simulations lancées depuis l'application apparaîtront ici."}
          </EmptyState>
        )}

        {!loading && !error && rows.length > 0 && (
          <>
            <div className="table-wrap has-cards">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th><th>Date</th><th>Actif</th><th>Agent</th>{IS_DEMO && <><th className="r">Bougies</th><th className="r">Trades</th><th className="r">Buy &amp; Hold</th></>}<th className="r">Rendement</th><th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const ret = Number(s.return ?? s.returnPct ?? s.profit);
                    return (
                      <tr key={s.id}>
                        <td className="num strong">#{s.id}</td>
                        <td className="num">{dateTime(s.date)}</td>
                        <td>{s.crypto ? <span className="asset"><span className="asset-icon" aria-hidden="true">{s.crypto}</span>{s.crypto}</span> : '-'}</td>
                        <td className="mono">{s.agent || 'DQN'}</td>
                        {IS_DEMO && (
                          <>
                            <td className="r num">{s.candles ?? '-'}</td>
                            <td className="r num">{s.trades ?? '-'}</td>
                            <td className={`r num ${isNum(s.benchReturn) ? trend(s.benchReturn) : 'flat'}`}>{isNum(s.benchReturn) ? pct(s.benchReturn) : '-'}</td>
                          </>
                        )}
                        <td className={`r num ${isNum(ret) ? trend(ret) : 'flat'}`}>{isNum(ret) ? pct(ret) : '-'}</td>
                        <td className="r">
                          <Link to="/results" className="btn btn-ghost" style={{ height: 30 }} aria-label={`Voir les détails de la simulation ${s.id}`}>
                            Détails<LuChevronRight aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <ul className="sim-cards">
              {rows.map((s) => (
                <li key={s.id}>
                  <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
                      <span className="num">#{s.id}</span>
                      {s.crypto && <span className="badge badge-outline">{s.crypto}</span>}
                      <span className="mono" style={{ color: 'var(--muted)', fontSize: 12 }}>{s.agent || 'DQN'}</span>
                    </div>
                    <div className="num" style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{dateTime(s.date)}</div>
                  </div>
                  <Link to="/results" className="btn btn-ghost icon-btn" aria-label={`Voir les détails de la simulation ${s.id}`}>
                    <LuChevronRight aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </>
  );
}
