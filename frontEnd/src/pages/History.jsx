// src/pages/History.jsx
import React, { useEffect, useState } from 'react';
import { listSimulations } from '../services/simulation';
import Loader from '../components/UI/Loader';
import Toast from '../components/UI/Toast';
import { Card, Col, Row, Button } from 'react-bootstrap';
import { BsFillClockFill } from 'react-icons/bs'; // Icône Bootstrap

export default function History() {
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSimulations()
      .then(data => setList(data))
      .catch(err => setError(err.message || 'Erreur réseau'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />; 
  if (error) return <Toast message={`Impossible de charger : ${error}`} />;

  return (
    <div className="container py-5">
      <h2 className="text-center fw-bold mb-4">Historique des Simulations</h2>

      {/* Affichage de l'historique sous forme de cartes */}
      <Row xs={1} sm={2} md={3} lg={4} className="g-4">
        {list.map(s => (
          <Col key={s.id}>
            <Card className="shadow-sm border-0 rounded-3">
              <Card.Body>
                <div className="d-flex align-items-center mb-3">
                  <BsFillClockFill className="text-muted me-2" />
                  <Card.Title className="fs-5 mb-0">
                    Simulation ID: {s.id}
                  </Card.Title>
                </div>
                <Card.Subtitle className="text-muted mb-3">
                  {new Date(s.date).toLocaleString()}
                </Card.Subtitle>
                <Button variant="primary" className="w-100 mt-2">
                  Voir les détails
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
