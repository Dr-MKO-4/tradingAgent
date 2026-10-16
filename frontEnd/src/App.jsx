import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { SimulationProvider } from './contexts/SimulationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import Home from './pages/Home';
import SimulationPage from './pages/Simulation';
import Results from './pages/Results';
import History from './pages/History';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Return to the top of the page on each route change.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  const [showSidebar, setShowSidebar] = useState(false);
  const hide = useCallback(() => setShowSidebar(false), []);

  return (
    <ThemeProvider>
      <SimulationProvider>
        <BrowserRouter>
          <ScrollToTop />
          <a href="#main" className="skip-link">Aller au contenu</a>
          <div className="shell">
            {/* Sidebar desktop et tiroir mobile */}
            <Sidebar show={showSidebar} onHide={hide} />

            <div className="main">
              <Header onMenuToggle={() => setShowSidebar((v) => !v)} />
              <main id="main" className="content" tabIndex={-1}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/simulation" element={<SimulationPage />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </div>
        </BrowserRouter>
      </SimulationProvider>
    </ThemeProvider>
  );
}
