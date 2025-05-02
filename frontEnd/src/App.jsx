import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SimulationProvider } from './contexts/SimulationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Home from './pages/Home';
import SimulationPage from './pages/Simulation';
import Results from './pages/Results';
import History from './pages/History';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <ThemeProvider>
      <SimulationProvider>
        <BrowserRouter>
          <Header onMenuToggle={() => setShowSidebar(v => !v)} />
          <Container fluid className="p-0">
            <Row className="g-0">
              {/* Sidebar desktop & mobile offcanvas */}
              <Sidebar show={showSidebar} onHide={() => setShowSidebar(false)} />

              {/* Main content */}
              <Col as="main" className="vh-100 overflow-auto">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/simulation" element={<SimulationPage />} />
                  <Route path="/results" element={<Results />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/settings" element={<Settings />} />
          
                </Routes>
              </Col>
            </Row>
          </Container>
        </BrowserRouter>
      </SimulationProvider>
    </ThemeProvider>
  );
}
