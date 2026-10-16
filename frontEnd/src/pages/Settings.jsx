// src/pages/Settings.jsx
import React from 'react';
import { LuMoon, LuSun, LuGithub } from 'react-icons/lu';
import { useTheme } from '../contexts/ThemeContext';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <div className="page-head enter">
        <div>
          <h1>Paramètres</h1>
          <p>Préférences d'affichage et connexion au backend.</p>
        </div>
      </div>
      <div className="grid grid-2">
        <section className="card enter enter-2" aria-labelledby="appearance-title">
          <div className="card-head"><h2 id="appearance-title">Apparence</h2></div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 550 }}>Thème</div>
              <div style={{ color: 'var(--muted)', fontSize: 12.5 }}>Sombre par défaut, mémorisé sur cet appareil.</div>
            </div>
            <div className="segmented sans" role="group" aria-label="Thème">
              <button type="button" aria-pressed={theme !== 'light'} onClick={() => setTheme('dark')}><LuMoon aria-hidden="true" style={{ verticalAlign: -2, marginRight: 6 }} />Sombre</button>
              <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><LuSun aria-hidden="true" style={{ verticalAlign: -2, marginRight: 6 }} />Clair</button>
            </div>
          </div>
        </section>
        <section className="card enter enter-3" aria-labelledby="api-title">
          <div className="card-head"><h2 id="api-title">API</h2></div>
          <div className="card-body summary">
            <dl>
              <div className="kv"><dt>Base URL</dt><dd>/api</dd></div>
              <div className="kv"><dt>Proxy de développement</dt><dd>localhost:5000</dd></div>
              <div className="kv"><dt>Code source</dt><dd><a href="https://github.com/Dr-MKO-4/tradingAgent" target="_blank" rel="noreferrer"><LuGithub aria-hidden="true" style={{ verticalAlign: -2 }} /> Dr-MKO-4/tradingAgent</a></dd></div>
            </dl>
          </div>
        </section>
      </div>
    </>
  );
}
