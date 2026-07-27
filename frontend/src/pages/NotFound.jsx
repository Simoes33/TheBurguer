import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, House } from '@phosphor-icons/react';

export const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-code">404</div>
      <div className="not-found-content">
        <Flame weight="fill" color="var(--ember)" size={64} style={{ animation: 'bounceIn 0.6s ease' }} />
        <h1 style={{ fontFamily: 'var(--serif)', fontSize: '2.5rem', marginTop: '0.5rem' }}>
          Ops! Esta receita não existe.
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.6 }}>
          A página que você está procurando pode ter sido removida, alterada ou nunca existiu em nosso cardápio.
        </p>
        <Link to="/" className="btn-primary" style={{ marginTop: '1rem' }}>
          <House size={18} /> Voltar ao Início
        </Link>
      </div>
    </div>
  );
};
