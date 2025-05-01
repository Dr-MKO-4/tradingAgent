// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';

import Layout from './components/Layout/Layout';


import SimulationPanel from './features/Simulation/SimulationPanel';
import HistoryTable   from './features/History/HistoryTable';

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        {/* Layout contient Navbar + <main> + Footer */}
        <Layout>
          <Routes>
            {/* Définis tes « écrans » ici */}
            <Route path="/"          element={<SimulationPanel />} />
            <Route path="/history"   element={<HistoryTable   />} />
            {/* tu pourras ajouter d’autres routes (About, Dashboard…) */}
          </Routes>
        </Layout>
      </BrowserRouter>
    </Provider>
  );
}
