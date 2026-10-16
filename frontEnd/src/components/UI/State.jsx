// src/components/UI/State.jsx : empty and error states
import React from 'react';
import { LuInbox, LuTriangleAlert } from 'react-icons/lu';

export function EmptyState({ icon: Icon = LuInbox, title, children, actions }) {
  return (
    <div className="state" role="status">
      <div className="state-icon"><Icon aria-hidden="true" /></div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Données indisponibles', children, actions }) {
  return (
    <div className="state error" role="alert">
      <div className="state-icon"><LuTriangleAlert aria-hidden="true" /></div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}
