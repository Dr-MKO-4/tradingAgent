// src/pages/Simulation.jsx : configuration de simulation
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuPlay, LuCircleCheck, LuRotateCcw, LuChartLine } from 'react-icons/lu';
import CryptoSelector from '../components/Simulation/CryptoSelector';
import { useSimulation } from '../contexts/SimulationContext';
import Toast from '../components/UI/Toast';

const DEFAULTS = {
  crypto: 'BTC',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  capital: 10000,
  fee: 0.1,
  lr: 0.001,
  gamma: 0.95,
  epsilon: 1.0,
  epsilonMin: 0.01,
  epsilonDecay: 0.995,
  batchSize: 64,
  episodes: 200,
  memorySize: 10000,
  targetUpdate: 10,
};

const HYPER = [
  { key: 'lr', label: 'Learning rate', sym: 'α', step: 0.0001, min: 0, help: "Pas d'apprentissage de l'optimiseur" },
  { key: 'gamma', label: 'Gamma', sym: 'γ', step: 0.01, min: 0, max: 1, help: 'Facteur d’actualisation' },
  { key: 'batchSize', label: 'Taille de batch', step: 1, min: 1, int: true, help: 'Transitions par mise à jour' },
  { key: 'epsilon', label: 'Epsilon initial', sym: 'ε₀', step: 0.01, min: 0, max: 1, help: 'Exploration de départ' },
  { key: 'epsilonMin', label: 'Epsilon minimal', sym: 'ε min', step: 0.01, min: 0, max: 1, help: 'Plancher d’exploration' },
  { key: 'epsilonDecay', label: 'Décroissance', sym: 'ε decay', step: 0.001, min: 0, max: 1, help: 'Facteur par épisode' },
  { key: 'episodes', label: 'Épisodes', step: 1, min: 1, int: true, help: 'Nombre d’épisodes' },
  { key: 'memorySize', label: 'Replay buffer', step: 1000, min: 1, int: true, help: 'Taille de la mémoire' },
  { key: 'targetUpdate', label: 'MAJ réseau cible', step: 1, min: 1, int: true, help: 'Tous les N épisodes' },
];

export default function SimulationPage() {
  const { startSimulation, status, progress, config, error, reset } = useSimulation();
  const [localCfg, setLocalCfg] = useState({ ...DEFAULTS, ...config });

  useEffect(() => {
    // Générer l'agent automatiquement en fonction de la crypto choisie
    const agent = localCfg.crypto ? `DQN_${localCfg.crypto.toLowerCase()}` : 'DQN';
    setLocalCfg((cfg) => ({ ...cfg, agent }));
  }, [localCfg.crypto]);

  const set = (key, int) => (e) => {
    const raw = e.target.value;
    const v = e.target.type === 'number' ? (raw === '' ? '' : int ? parseInt(raw, 10) : parseFloat(raw)) : raw;
    setLocalCfg((cfg) => ({ ...cfg, [key]: v }));
  };

  const periodInvalid = localCfg.startDate && localCfg.endDate && localCfg.startDate > localCfg.endDate;
  const running = status === 'running';

  const onSubmit = (e) => {
    e.preventDefault();
    if (periodInvalid || running) return;
    startSimulation(localCfg);
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="page-head enter">
        <div>
          <h1>Nouvelle simulation</h1>
          <p>Choisissez l'actif, la période de backtest et les hyperparamètres de l'agent DQN.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={() => setLocalCfg((c) => ({ ...DEFAULTS, agent: c.agent }))} disabled={running}>
            <LuRotateCcw aria-hidden="true" />Valeurs par défaut
          </button>
        </div>
      </div>

      <div className="grid grid-main">
        <section className="card enter enter-2">
          <div className="form-section">
            <h3>Marché</h3>
            <p className="hint">Actif et période de données historiques utilisées pour l'environnement.</p>
            <div className="fields">
              <div className="field">
                <label htmlFor="sim-crypto">Actif</label>
                <CryptoSelector id="sim-crypto" value={localCfg.crypto} onChange={(c) => setLocalCfg((cfg) => ({ ...cfg, crypto: c }))} />
              </div>
              <div className="field">
                <label htmlFor="sim-agent">Agent <code>auto</code></label>
                <input id="sim-agent" className="input mono" value={localCfg.agent || ''} readOnly />
              </div>
              <div className="field">
                <label htmlFor="sim-start">Début</label>
                <input id="sim-start" type="date" className="input" value={localCfg.startDate} onChange={set('startDate')} />
              </div>
              <div className="field">
                <label htmlFor="sim-end">Fin</label>
                <input
                  id="sim-end" type="date" className="input" value={localCfg.endDate} onChange={set('endDate')}
                  aria-invalid={periodInvalid || undefined} aria-describedby={periodInvalid ? 'period-err' : undefined}
                />
                {periodInvalid && <span id="period-err" className="help down">La date de fin doit suivre la date de début.</span>}
              </div>
              <div className="field">
                <label htmlFor="sim-capital">Capital initial <code>USD</code></label>
                <input id="sim-capital" type="number" className="input" min="0" step="100" value={localCfg.capital} onChange={set('capital')} />
              </div>
              <div className="field">
                <label htmlFor="sim-fee">Frais de transaction <code>%</code></label>
                <input id="sim-fee" type="number" className="input" min="0" step="0.01" value={localCfg.fee} onChange={set('fee')} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Hyperparamètres DQN</h3>
            <p className="hint">Réseau Q avec replay buffer et réseau cible.</p>
            <div className="fields three">
              {HYPER.map((h) => (
                <div className="field" key={h.key}>
                  <label htmlFor={`hp-${h.key}`}>{h.label}{h.sym && <code>{h.sym}</code>}</label>
                  <input
                    id={`hp-${h.key}`} type="number" className="input"
                    step={h.step} min={h.min} max={h.max}
                    value={localCfg[h.key] ?? ''} onChange={set(h.key, h.int)}
                    aria-describedby={`hp-${h.key}-help`}
                  />
                  <span id={`hp-${h.key}-help`} className="help">{h.help}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="stack">
          <section className="card summary enter enter-3" aria-labelledby="sum-title">
            <div className="card-head"><h2 id="sum-title">Récapitulatif</h2></div>
            <div className="card-body">
              <dl>
                <div className="kv"><dt>Actif</dt><dd>{localCfg.crypto}/USD</dd></div>
                <div className="kv"><dt>Période</dt><dd>{localCfg.startDate} → {localCfg.endDate}</dd></div>
                <div className="kv"><dt>Capital</dt><dd>{Number(localCfg.capital || 0).toLocaleString('fr-FR')} $</dd></div>
                <div className="kv"><dt>α / γ</dt><dd>{localCfg.lr} / {localCfg.gamma}</dd></div>
                <div className="kv"><dt>ε</dt><dd>{localCfg.epsilon} → {localCfg.epsilonMin}</dd></div>
                <div className="kv"><dt>Épisodes</dt><dd>{localCfg.episodes}</dd></div>
              </dl>
            </div>
            <div className="card-body" style={{ borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {running && (
                <div>
                  <div className="progress-row"><span>Entraînement en cours</span><span className="num">{Math.round(progress)} %</span></div>
                  <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)} aria-label="Progression de la simulation">
                    <span style={{ width: `${Math.max(2, progress)}%` }} />
                  </div>
                </div>
              )}
              {status === 'error' && error && <Toast message={error} />}
              {status === 'done' && (
                <div className="alert alert-success" role="status">
                  <LuCircleCheck aria-hidden="true" />
                  <span>Simulation terminée. Les résultats sont disponibles.</span>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={running || periodInvalid} data-run-sim>
                {running ? (<><span className="spinner" aria-hidden="true" />En cours… {Math.round(progress)} %</>) : (<><LuPlay aria-hidden="true" />Lancer la simulation</>)}
              </button>
              {status === 'done' && (
                <Link to="/results" className="btn btn-block"><LuChartLine aria-hidden="true" />Voir les résultats</Link>
              )}
              {status === 'error' && (
                <button type="button" className="btn btn-block" onClick={reset}>Réinitialiser</button>
              )}
            </div>
          </section>
          <p className="enter enter-4" style={{ color: 'var(--muted)', fontSize: 12.5, padding: '0 4px' }}>
            La simulation est exécutée par le backend Python (<span className="mono">POST /api/simulation/start</span>). La progression est interrogée toutes les 2 secondes.
          </p>
        </aside>
      </div>
    </form>
  );
}
