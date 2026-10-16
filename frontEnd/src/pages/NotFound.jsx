// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/UI/State';
import { LuCompass } from 'react-icons/lu';

export default function NotFound() {
  return (
    <section className="card enter">
      <EmptyState icon={LuCompass} title="404 : page non trouvée" actions={<Link to="/" className="btn btn-primary">Retour au tableau de bord</Link>}>
        Cette adresse ne correspond à aucun écran de l'application.
      </EmptyState>
    </section>
  );
}
