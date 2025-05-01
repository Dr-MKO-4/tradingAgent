// src/components/DashboardNavbar.jsx

import React from 'react';
import styled from 'styled-components';
import { Navbar, Container, Nav, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import ThemeToggle from './ThemeToggle';

// Ticker styled-component
const Ticker = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 1rem;
  padding: 0.5rem 0;
  background: var(--bg-sec);
  color: var(--text-sec);
`;

export default function DashboardNavbar({
  cryptos,
  prices,
  showFilters,
  setShowFilters,
  theme,
  setTheme
}) {
  return (
    <Navbar bg="body" expand="lg" className="mb-3 shadow-sm">
      <Container>
        <Navbar.Brand>Crypto DQN</Navbar.Brand>
        <Navbar.Toggle onClick={() => setShowFilters(true)} />
        <Navbar.Collapse className="justify-content-end">
          <Ticker>
            {cryptos.map((c) => (
              <div key={c}>
                {c}: {prices[c]?.toFixed(2) || '–'}$
              </div>
            ))}
          </Ticker>
          <Nav>
            <Nav.Item className="me-3">
              <Button
                variant="outline-secondary"
                onClick={() => setShowFilters(true)}
              >
                <FontAwesomeIcon icon={faFilter} /> Filtres
              </Button>
            </Nav.Item>
            <Nav.Item className="me-3">
              <Button variant="outline-secondary">
                <FontAwesomeIcon icon={faUserCircle} /> Profil
              </Button>
            </Nav.Item>
            <Nav.Item>
              <ThemeToggle theme={theme} setTheme={setTheme} />
            </Nav.Item>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
