// generate-structure.mjs

import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';

const structure = {
  src: {
    assets: {},
    components: {
      Chart: {
        'PerformanceChart.jsx': '',
        'TradingChart.jsx': ''
      },
      Controls: {
        'Button.jsx': '',
        'Dropdown.jsx': '',
        'NumericInput.jsx': ''
      },
      Layout: {
        'Header.jsx': '',
        'Footer.jsx': '',
        'Sidebar.jsx': ''
      },
      Simulation: {
        'ConfigForm.jsx': '',
        'CryptoSelector.jsx': '',
        'HyperparamEditor.jsx': '',
        'SimulationControls.jsx': ''
      },
      UI: {
        'Loader.jsx': '',
        'Modal.jsx': '',
        'Toast.jsx': ''
      }
    },
    contexts: {
      'SimulationContext.jsx': '',
      'ThemeContext.jsx': '',
      'AuthContext.jsx': ''
    },
    hooks: {
      'useFetch.js': '',
      'useInterval.js': '',
      'useLocalStorage.js': ''
    },
    pages: {
      'Home.jsx': '',
      'Simulation.jsx': '',
      'Results.jsx': '',
      'History.jsx': '',
      'Settings.jsx': '',
      'NotFound.jsx': ''
    },
    services: {
      'api.js': '',
      'simulation.js': '',
      'results.js': ''
    },
    styles: {
      'variables.scss': '',
      'globals.scss': ''
    },
    utils: {
      'financeUtils.js': ''
    },
    'App.jsx': '',
    'index.jsx': '',
    'reportWebVitals.js': ''
  }
};

async function createStructure(basePath, obj) {
  for (const [name, value] of Object.entries(obj)) {
    const fullPath = path.join(basePath, name);
    if (typeof value === 'object') {
      // dossier
      if (!fs.existsSync(fullPath)) {
        await fsp.mkdir(fullPath, { recursive: true });
      }
      await createStructure(fullPath, value);
    } else {
      // fichier
      await fsp.writeFile(fullPath, value);
    }
  }
}

(async () => {
  try {
    await createStructure('.', structure);
    console.log('✅ Structure créée avec succès !');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
