import React from 'react';
import { Offcanvas, Nav, Form } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { useSimulation } from '../../contexts/SimulationContext';
import CryptoSelector from '../Simulation/CryptoSelector';

export default function Sidebar({ show, onHide }) {
  const { filters, setFilters } = useSimulation();

  // Génère dynamiquement l'agent en fonction de la crypto
  const dynamicAgent = filters.crypto ? `DQN ${filters.crypto}` : 'DQN';

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      responsive="sm"
      className="border-end shadow"
      placement="start"
      style={{
        width: '100%',
        maxWidth: '280px',
        backgroundColor: '#000000', // Noir comme couleur de fond
        color: '#ffffff' // Texte en blanc pour contraster
      }}
    >
      <Offcanvas.Header closeButton className="border-bottom" style={{ backgroundColor: '#DC3545' }}>
        <Offcanvas.Title className="fw-bold text-white d-flex align-items-center">
          <i className="bi bi-sliders fs-4 me-2" />
          <span className="fs-5">Filtres</span>
        </Offcanvas.Title>
      </Offcanvas.Header>

      <Offcanvas.Body className="px-4 pt-4 d-flex flex-column gap-4" style={{ backgroundColor: '#000000' }}>

        {/* Bloc filtre crypto */}
        <Form.Group className="d-flex flex-column">
          <Form.Label className="fw-semibold text-muted mb-1">Crypto</Form.Label>
          <CryptoSelector
            className="form-select border border-warning" // Jaune pour la bordure
            value={filters.crypto}
            onChange={c => {
              setFilters(f => ({
                ...f,
                crypto: c,
                agent: `DQN ${c}`
              }));
            }}
          />
        </Form.Group>

        {/* Bloc filtre agent (lecture seule, dépend de la crypto) */}
        <Form.Group className="d-flex flex-column">
          <Form.Label className="fw-semibold text-muted mb-1">Agent</Form.Label>
          <Form.Control
            className="form-control border border-warning bg-dark text-white" // Jaune bordure, noir fond, blanc texte
            value={dynamicAgent}
            readOnly
          />
        </Form.Group>

        <hr className="my-2" style={{ borderColor: '#DC3545' }} /> {/* Rouge pour la ligne de séparation */}

        {/* Navigation */}
        <Nav className="flex-column gap-2">
          <Nav.Link
            as={NavLink}
            to="/history"
            className="d-flex align-items-center gap-2 px-3 py-2 rounded text-white border hover-bg-light"
            style={{ color: '#DC3545' }} // Rouge pour le texte de navigation
          >
            <i className="bi bi-graph-up fs-5" style={{ color: '#DC3545' }} />
            <span className="fw-medium">Historique</span>
          </Nav.Link>

          <Nav.Link
            as={NavLink}
            to="/settings"
            className="d-flex align-items-center gap-2 px-3 py-2 rounded text-white border hover-bg-light"
            style={{ color: '#FFCC00' }} // Jaune pour le texte de navigation
          >
            <i className="bi bi-gear fs-5" style={{ color: '#FFCC00' }} />
            <span className="fw-medium">Paramètres</span>
          </Nav.Link>
        </Nav>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
