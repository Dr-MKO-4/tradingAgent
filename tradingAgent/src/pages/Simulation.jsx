import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Form, Spinner } from 'react-bootstrap';
import CryptoSelector from '../components/Simulation/CryptoSelector';
import { useSimulation } from '../contexts/SimulationContext';
import { FaPlay, FaCheckCircle } from 'react-icons/fa';
import { BiCog } from 'react-icons/bi'; // Icône d'engrenage de Bootstrap

export default function SimulationPage() {
  const { startSimulation, status, progress, config } = useSimulation();
  const [localCfg, setLocalCfg] = useState(config);

  useEffect(() => {
    // Générer l'agent automatiquement en fonction de la crypto choisie
    const agent = localCfg.crypto ? `DQN_${localCfg.crypto.toLowerCase()}` : 'DQN'; // Générer l'agent automatiquement
    setLocalCfg(cfg => ({ ...cfg, agent }));
  }, [localCfg.crypto]); // L'agent se met à jour dès que la crypto change

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: 'white' }}> {/* Fond noir pour la page avec texte blanc */}
      <Card className="m-4 shadow-xl border-0 rounded-lg bg-dark text-white"> {/* Fond noir pour la carte avec texte blanc */}
        <Card.Header className="bg-danger text-white fs-4 fw-bold rounded-top py-4 text-center" style={{ fontFamily: "'Poppins', sans-serif" }}>
          <BiCog className="me-2" />
          Configuration de la Simulation
        </Card.Header>
        <Card.Body className="p-5">
          <Row className="g-4">
            {/* Sélection de la Crypto */}
            <Col md={6}>
              <Form.Label className="fw-semibold text-white">Crypto</Form.Label> {/* Texte blanc */}
              <CryptoSelector
                className="form-select form-select-lg shadow-sm"
                value={localCfg.crypto}
                onChange={c => setLocalCfg(cfg => ({ ...cfg, crypto: c }))} 
              />
            </Col>
          </Row>

          <Row className="g-4 mt-3">
            {/* L'agent est automatiquement sélectionné selon la crypto choisie */}
            <Col md={6}>
              <Form.Label className="fw-semibold text-white">Agent</Form.Label> {/* Texte blanc */}
              <Form.Control
                type="text"
                value={localCfg.agent}
                readOnly
                className="form-control-lg shadow-sm border-0 rounded-pill"
              />
            </Col>

            {/* Learning Rate */}
            <Col md={6}>
              <Form.Label className="fw-semibold text-white">Learning Rate</Form.Label> {/* Texte blanc */}
              <Form.Control
                type="number"
                step="0.0001"
                value={localCfg.lr}
                onChange={e => setLocalCfg(cfg => ({ ...cfg, lr: parseFloat(e.target.value) }))} 
                className="form-control-lg shadow-sm border-0 rounded-pill"
              />
            </Col>
          </Row>

          <Row className="g-4 mt-3">
            {/* Gamma */}
            <Col md={6}>
              <Form.Label className="fw-semibold text-white">Gamma</Form.Label> {/* Texte blanc */}
              <Form.Control
                type="number"
                step="0.01"
                value={localCfg.gamma}
                onChange={e => setLocalCfg(cfg => ({ ...cfg, gamma: parseFloat(e.target.value) }))} 
                className="form-control-lg shadow-sm border-0 rounded-pill"
              />
            </Col>
          </Row>

          {/* Bouton de lancement de la simulation */}
          <div className="mt-4 d-flex justify-content-center">
            <Button
              variant="danger" // Rouge comme couleur primaire
              onClick={() => startSimulation(localCfg)}
              disabled={status === 'running'}
              className="btn-lg px-5 py-3 shadow-lg d-flex align-items-center justify-content-center transition-all duration-300 hover:scale-105"
              style={{
                fontSize: '1rem',
                borderRadius: '50px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
              }}
            >
              {status === 'idle' && (
                <>
                  <FaPlay className="me-2" />
                  Lancer la Simulation
                </>
              )}
              {status === 'running' && (
                <div className="d-flex align-items-center">
                  <Spinner animation="border" size="sm" className="me-2" />
                  En cours… {progress}%
                </div>
              )}
              {status === 'done' && (
                <>
                  <FaCheckCircle className="me-2" />
                  Terminé !
                </>
              )}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
