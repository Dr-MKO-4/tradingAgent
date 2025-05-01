import React from 'react';
import { Routes, Route } from 'react-router-dom';
import SimulationDashboard from './pages/SimulationDashboard';



export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SimulationDashboard />} />
     
    </Routes>
  );
}
