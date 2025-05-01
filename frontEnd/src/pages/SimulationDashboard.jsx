// src/SimulationDashboard.jsx

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Container, Row, Col, Card, Button, Form, Accordion,
  Modal, Toast, ToastContainer, Table, ProgressBar,
  Carousel, Spinner
} from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRocket, faHistory, faDownload, faFileCsv, faImage,
  faVideo, faChartLine, faList
} from '@fortawesome/free-solid-svg-icons';
import ThemeToggle from '../components/ThemeToggle';

// --- Styled Components ---
const MediaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
`;
const MediaCard = styled(Card)`
  border-radius: 1rem;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0,0,0,0.15);
  }
`;
const LogsContainer = styled.div`
  max-height: 200px;
  overflow-y: auto;
  background: var(--card-bg);
  padding: 1rem;
  border-radius: 0.5rem;
  font-family: monospace;
  font-size: 0.9rem;
  color: var(--text);
  box-shadow: inset 0 0 8px rgba(0,0,0,0.1);
`;

// --- Register Chart.js modules ---
ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend
);

// --- Static datasets for the static curve example ---
const STATIC_DATASETS = {
  'Exemple A': {
    labels: ['Jan','Fév','Mar','Avr','Mai','Juin'],
    data:   [12, 19,  3,  5,  2,   3]
  },
  'Exemple B': {
    labels: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],
    data:   [ 5, 10,  8, 12,  9,  15,  7]
  }
};

export default function SimulationDashboard() {
  // --- State hooks ---
  const [theme, setTheme]                 = useState('light');
  const [selectedCrypto, setSelectedCrypto] = useState('BTC');
  const [startDate, setStartDate]         = useState('2021-01-01');
  const [endDate, setEndDate]             = useState('2021-12-31');
  const [episodes, setEpisodes]           = useState(100);
  const [gamma, setGamma]                 = useState(0.99);
  const [epsilonDecay, setEpsilonDecay]   = useState(0.995);

  const [chartData, setChartData]         = useState({ labels: [], datasets: [] });
  const [metrics, setMetrics]             = useState(null);
  const [media, setMedia]                 = useState({ videoUrl: null, imageUrls: [] });
  const [history, setHistory]             = useState([]);

  const [staticDataset, setStaticDataset] = useState('Exemple A');
  const [logs, setLogs]                   = useState([]);

  const [showModal, setShowModal]         = useState(false);
  const [loading, setLoading]             = useState(false);
  const [toast, setToast]                 = useState({ show: false, msg: '', variant: '' });

  const cryptos = ['BTC','ETH','LTC','XRP'];

  // Apply theme on <html> and log
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    addLog(`Thème changé : ${theme}`);
  }, [theme]);

  // Helpers: logging, toasts
  function addLog(msg) {
    setLogs(old => [...old, `${new Date().toLocaleTimeString()} – ${msg}`]);
  }
  function showToast(msg, variant = 'success') {
    setToast({ show: true, msg, variant });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }

  // Simulation API call
  async function handleSimulation() {
    addLog(`Démarrage simulation pour ${selectedCrypto}`);
    setLoading(true);
    try {
      const params = new URLSearchParams({
        crypto: selectedCrypto,
        start: startDate,
        end: endDate,
        episodes: episodes.toString(),
        gamma: gamma.toString(),
        epsilon_decay: epsilonDecay.toString()
      });
      const res = await fetch(`/api/simulate?${params.toString()}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      // Expect data: { labels, values, metrics, videoUrl, imageUrls }
      setChartData({
        labels: data.labels,
        datasets: [{ label: `${selectedCrypto} Portfolio`, data: data.values, fill: true }]
      });
      setMetrics(data.metrics);
      setMedia({ videoUrl: data.videoUrl, imageUrls: data.imageUrls });
      setHistory(h => [
        { id: Date.now(), date: new Date().toLocaleString(), crypto: selectedCrypto, metrics: data.metrics },
        ...h
      ]);
      addLog(`Simulation réussie (profit: ${data.metrics.profit})`);
      showToast('Simulation terminée !');
    } catch (err) {
      console.error(err);
      addLog(`Erreur simulation : ${err.message}`);
      showToast('Erreur durant la simulation', 'danger');
    } finally {
      setLoading(false);
    }
  }

  // Static dataset select change
  function handleStaticChange(e) {
    setStaticDataset(e.target.value);
    addLog(`Dataset statique sélectionné : ${e.target.value}`);
  }

  // Download simulation CSV
  function downloadCSV() {
    const csv = ['Date,Value', ...chartData.labels.map((d,i) => `${d},${chartData.datasets[0].data[i]}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCrypto}-simulation.csv`;
    a.click();
    addLog('CSV simulation téléchargé');
  }

  return (
    <Container className="py-4">
      {/* Top bar */}
      <Row className="mb-3 align-items-center">
        <Col><ThemeToggle theme={theme} setTheme={setTheme} /></Col>
        <Col className="text-end">
          <Button variant="outline-secondary" onClick={() => setShowModal(true)}>
            <FontAwesomeIcon icon={faHistory} /> Historique ({history.length})
          </Button>
        </Col>
      </Row>

      {/* Simulation parameters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <Card className="mb-4 shadow-sm">
          <Card.Header>Paramètres de simulation</Card.Header>
          <Card.Body>
            <Form>
              <Row className="gy-3">
                <Col md={3}>
                  <Form.Label>Crypto</Form.Label>
                  <Form.Select
                    value={selectedCrypto}
                    onChange={e => { setSelectedCrypto(e.target.value); addLog(`Crypto sélectionnée : ${e.target.value}`); }}
                  >
                    {cryptos.map(c => <option key={c}>{c}</option>)}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label>Début</Form.Label>
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={e => { setStartDate(e.target.value); addLog(`Date début : ${e.target.value}`); }}
                  />
                </Col>
                <Col md={3}>
                  <Form.Label>Fin</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={e => { setEndDate(e.target.value); addLog(`Date fin : ${e.target.value}`); }}
                  />
                </Col>
                <Col md={3} className="d-grid">
                  <Button onClick={handleSimulation} disabled={loading} variant="primary">
                    {loading
                      ? <><Spinner animation="border" size="sm" className="me-2" />Chargement…</>
                      : <><FontAwesomeIcon icon={faRocket} className="me-2" />Lancer</>
                    }
                  </Button>
                </Col>
              </Row>
              <Accordion defaultActiveKey="0" className="mt-4">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Hyperparamètres DQN</Accordion.Header>
                  <Accordion.Body>
                    <Row>
                      <Col md={4}>
                        <Form.Group controlId="episodes">
                          <Form.Label>Épisodes</Form.Label>
                          <Form.Control
                            type="number" min="1" value={episodes}
                            onChange={e => { setEpisodes(+e.target.value); addLog(`Épisodes : ${e.target.value}`); }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group controlId="gamma">
                          <Form.Label>Gamma (γ)</Form.Label>
                          <Form.Control
                            type="number" step="0.001" min="0" max="1" value={gamma}
                            onChange={e => { setGamma(+e.target.value); addLog(`Gamma : ${e.target.value}`); }}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group controlId="epsilonDecay">
                          <Form.Label>ε-decay</Form.Label>
                          <Form.Control
                            type="number" step="0.0001" min="0" max="1" value={epsilonDecay}
                            onChange={e => { setEpsilonDecay(+e.target.value); addLog(`ε-decay : ${e.target.value}`); }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Form>
          </Card.Body>
        </Card>
      </motion.div>

      {/* Metrics summary */}
      {metrics && (
        <Row className="mb-3 text-center">
          {[
            ['Profit total', metrics.profit],
            ['Max Drawdown', metrics.max_drawdown],
            ['Sharpe Ratio', metrics.sharpe_ratio.toFixed(2)]
          ].map(([label, val]) => (
            <Col md={4} key={label}>
              <Card className="p-3 mb-2 shadow-sm">
                <Card.Title>{label}</Card.Title>
                <Card.Text className="h4">{val}</Card.Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Static curve example */}
      <Card className="mb-4 shadow-sm">
        <Card.Header>
          <FontAwesomeIcon icon={faChartLine} className="me-2" />Courbe statique
          <Form.Select
            size="sm"
            className="w-auto d-inline-block ms-3"
            value={staticDataset}
            onChange={handleStaticChange}
          >
            {Object.keys(STATIC_DATASETS).map(key => (
              <option key={key} value={key}>{key}</option>
            ))}
          </Form.Select>
        </Card.Header>
        <Card.Body>
          <Line
            data={{
              labels: STATIC_DATASETS[staticDataset].labels,
              datasets: [{
                label: staticDataset,
                data: STATIC_DATASETS[staticDataset].data,
                borderColor: 'var(--primary)',
                fill: false,
                tension: 0.3
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { position: 'top' } },
              scales: {
                x: { ticks: { color: 'var(--text)' } },
                y: { ticks: { color: 'var(--text)' } }
              }
            }}
          />
        </Card.Body>
      </Card>

      {/* Dynamic results: chart + media */}
      <Row className="mb-4">
        <Col xs={12}>
          <MediaCard className="shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span><FontAwesomeIcon icon={faFileCsv} /> Résultats</span>
              <Button variant="outline-info" size="sm" onClick={downloadCSV}>
                <FontAwesomeIcon icon={faDownload} /> CSV
              </Button>
            </Card.Header>
            <Card.Body>
              {chartData.labels.length > 0 ? (
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'top' } },
                    scales: { x:{ grid:{ display:false } }, y:{} }
                  }}
                />
              ) : (
                <p className="text-center text-muted">Lancez une simulation pour voir le graphique</p>
              )}
              <MediaGrid>
                {/* Video */}
                {media.videoUrl && (
                  <MediaCard>
                    <video
                      controls
                      src={media.videoUrl}
                      style={{ width:'100%', borderRadius:'0.75rem' }}
                    />
                    <Card.Footer className="text-center">
                      <Button size="sm" variant="outline-primary" href={media.videoUrl} download>
                        <FontAwesomeIcon icon={faVideo} /> Télécharger vidéo
                      </Button>
                    </Card.Footer>
                  </MediaCard>
                )}
                {/* Image carousel */}
                {media.imageUrls.length > 0 && (
                  <MediaCard>
                    <Carousel variant={theme === 'light' ? 'light' : 'dark'}>
                      {media.imageUrls.map((src,i) => (
                        <Carousel.Item key={i}>
                          <img
                            src={src}
                            alt={`img-${i}`}
                            style={{ width:'100%', borderRadius:'0.75rem' }}
                          />
                          <Carousel.Caption><small>Image {i+1}</small></Carousel.Caption>
                        </Carousel.Item>
                      ))}
                    </Carousel>
                    <Card.Footer className="text-center">
                      {media.imageUrls.map((src,i) => (
                        <Button
                          key={i}
                          className="me-1 mb-1"
                          size="sm"
                          variant="outline-secondary"
                          href={src}
                          download={`simulation-img-${i+1}.png`}
                        >
                          <FontAwesomeIcon icon={faImage} /> {i+1}
                        </Button>
                      ))}
                    </Card.Footer>
                  </MediaCard>
                )}
              </MediaGrid>
            </Card.Body>
          </MediaCard>
        </Col>
      </Row>

      {/* Logs panel */}
      <Card className="mb-4 shadow-sm">
        <Card.Header><FontAwesomeIcon icon={faList} className="me-2" />Logs</Card.Header>
        <Card.Body>
          <LogsContainer>
            {logs.map((line,i) => <div key={i}>{line}</div>)}
          </LogsContainer>
        </Card.Body>
      </Card>

      {/* History modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>Historique des simulations</Modal.Title></Modal.Header>
        <Modal.Body style={{ maxHeight:'60vh', overflowY:'auto' }}>
          {history.length === 0 ? (
            <p className="text-center">Aucun historique.</p>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Date</th><th>Crypto</th><th>Profit</th><th>Drawdown</th><th>Sharpe</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td>{h.date}</td><td>{h.crypto}</td>
                    <td>{h.metrics.profit}</td>
                    <td>{h.metrics.max_drawdown}</td>
                    <td>{h.metrics.sharpe_ratio.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Fermer</Button>
        </Modal.Footer>
      </Modal>

      {/* Toast notifications */}
      <ToastContainer position="bottom-end" className="p-3">
        <Toast bg={toast.variant} show={toast.show}><Toast.Body>{toast.msg}</Toast.Body></Toast>
      </ToastContainer>

      {/* Full-screen loading overlay */}
      {loading && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ background:'rgba(0,0,0,0.3)', zIndex:1050 }}
        >
          <ProgressBar animated now={100} style={{ width:'50%', height:'1rem' }} />
        </div>
      )}
    </Container>
  );
}
