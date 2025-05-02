// src/components/Simulation/HyperparamEditor.jsx
import React from 'react';
import NumericInput from '../Controls/NumericInput';
export default function HyperparamEditor({ params, onChange }) {
  return (
    <div className="hyperparams">
      <label>Learning Rate:</label>
      <NumericInput
        value={params.lr}
        onChange={v=>onChange({...params,lr:v})}
      />
      <label>Gamma:</label>
      <NumericInput
        value={params.gamma}
        onChange={v=>onChange({...params,gamma:v})}
      />
    </div>
  );
}
