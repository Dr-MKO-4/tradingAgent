// src/components/Simulation/SimulationControls.jsx
import React from 'react';
import Button from '../Controls/Button';
import { useSimulation } from '../../contexts/SimulationContext';
export default function SimulationControls() {
  const { status, progress, startSimulation, config } = useSimulation();
  return (
    <div>
      {status==='idle' && (
        <Button onClick={()=>startSimulation(config)}>
          Lancer Simulation
        </Button>
      )}
      {status==='running' && <p>En cours… {progress}%</p>}
      {status==='done' && <p>Terminé !</p>}
    </div>
  );
}
