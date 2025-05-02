import React, { useState } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Home = () => {
  const [showAlert, setShowAlert] = useState(true);

  return (
    <Container fluid className="py-5 px-3" style={{ background: '#000000' }}> {/* Fond noir */}
      <Row className="g-4 justify-content-center">
        {/* Capital Investi */}
        <Col md={4} xs={12}>
          <Card className="shadow-lg border-0 rounded-4 bg-danger text-white"> {/* Couleur primaire rouge */}
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <Card.Title style={{ color: 'white' }}>Capital Investi</Card.Title>
                <h3 style={{ color: 'white' }}>$12,000</h3>
              </div>
              <i className="bi bi-coin fs-1 text-warning"></i>
            </Card.Body>
          </Card>
        </Col>

        {/* Profit */}
        <Col md={4} xs={12}>
          <Card className="shadow-lg border-0 rounded-4 bg-danger text-white"> {/* Couleur primaire rouge */}
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <Card.Title style={{ color: 'white' }}>Profit</Card.Title>
                <h3 style={{ color: 'white' }}>+18.5%</h3>
              </div>
              <i className="bi bi-graph-up-arrow fs-1 text-info"></i> {/* Bleu comme couleur secondaire */}
            </Card.Body>
          </Card>
        </Col>

        {/* Wallet Card */}
        <Col md={4} xs={12}>
          <Card className="shadow-lg border-0 rounded-4 bg-dark text-white">
            <Card.Body className="d-flex justify-content-between align-items-center">
              <div>
                <Card.Title>Portefeuille Électronique</Card.Title>
                <h3>$7,500</h3>
              </div>
              <Button variant="danger" className="rounded-pill px-4 py-2">Ajouter</Button> {/* Rouge pour le bouton */}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Alerts Section */}
      {showAlert && (
        <Row className="g-4 mt-4">
          <Col md={12}>
            <Alert variant="danger" onClose={() => setShowAlert(false)} dismissible>
              <h5>Transaction Réussie</h5>
              <p>Votre investissement dans le Bitcoin a généré un rendement de 10% cette semaine !</p>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Market Trends Section */}
      <Row className="g-4 mt-4">
        <Col md={6} xs={12}>
          <Card className="shadow-lg border-0 rounded-4 bg-danger text-white"> {/* Rouge comme couleur primaire */}
            <Card.Body>
              <Card.Title className="fs-4 fw-bold">Tendances du Marché</Card.Title>
              <div>
                <ul className="list-unstyled">
                  <li><i className="bi bi-arrow-up-circle text-success me-2"></i>Bitcoin surpasse $64,000</li>
                  <li><i className="bi bi-arrow-down-circle text-danger me-2"></i>Ethereum perd 5% cette semaine</li>
                  <li><i className="bi bi-arrow-up-circle text-info me-2"></i>Cardano en hausse de 12%</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Crypto Journal Section */}
        <Col md={6} xs={12}>
          <Card className="shadow-lg border-0 rounded-4" style={{ backgroundColor: '#FFD700' }}> {/* Fond jaune */}
            <Card.Body>
              <Card.Title className="fs-4 fw-bold">Journal des Cryptos</Card.Title>
              <div>
                <ul className="list-unstyled">
                  <li><i className="bi bi-newspaper text-warning me-2"></i>Bitcoin atteint un nouveau sommet historique</li>
                  <li><i className="bi bi-newspaper text-danger me-2"></i>Régulation stricte des cryptos en Chine affecte le marché</li>
                  <li><i className="bi bi-newspaper text-info me-2"></i>Lancement de la blockchain Solana 2.0 prévu pour juillet</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
