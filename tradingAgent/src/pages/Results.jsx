import React from 'react';
import { Card, Row, Col, Spinner, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useSimulation } from '../contexts/SimulationContext';
import PerformanceChart from '../components/Chart/PerformanceChart';
import TradingChart from '../components/Chart/TradingChart';

const Results = () => {
  const { status, results } = useSimulation();

  if (status === 'running') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh', backgroundColor: '#000000' }}>
        <Spinner animation="border" variant="danger" />
      </div>
    );
  }

  if (!results) {
    return <p className="m-4 text-center text-muted">Aucun résultat disponible.</p>;
  }

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh' }}>
      <Row className="m-4 g-4">
        {/* Métriques Card */}
        <Col lg={4}>
          <Card className="h-100 shadow-lg border-0 rounded-3" style={{ background: '#212121', color: '#fff' }}>
            <Card.Header className="bg-danger text-white">Métriques</Card.Header> {/* Rouge comme couleur primaire */}
            <Card.Body>
              <PerformanceChart metrics={results.metrics} />
            </Card.Body>
          </Card>
        </Col>

        {/* Courbe de Portefeuille Card */}
        <Col lg={8}>
          <Card className="h-100 shadow-lg border-0 rounded-3" style={{ background: '#212121', color: '#fff' }}>
            <Card.Header className="bg-warning text-dark">Courbe de Portefeuille</Card.Header> {/* Jaune comme couleur secondaire */}
            <Card.Body>
              <TradingChart portfolio={results.portfolio} />
              <div className="mt-3">
                <h5 className="text-light">Indications de Trading</h5>
                <ul className="list-unstyled">
                  {results.tradingSignals?.map((signal, index) => (
                    <li key={index} className="d-flex align-items-center">
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip>{signal.gainMessage}</Tooltip>}
                      >
                        <div
                          className={`d-flex align-items-center ${signal.action === 'buy' ? 'text-success' : 'text-danger'}`}
                          style={{ cursor: 'pointer' }}
                        >
                          <i
                            className={`bi bi-${signal.action === 'buy' ? 'arrow-up-circle' : 'arrow-down-circle'} fs-3 me-2`}
                          ></i>
                          <span>{signal.action === 'buy' ? 'Acheter' : 'Vendre'}</span>
                          <span className="ms-2">{signal.gain}%</span>
                        </div>
                      </OverlayTrigger>
                    </li>
                  ))}
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Results;
