import React from 'react';
import { Link } from 'react-router-dom';
import { Flame, MapPin, Bicycle } from '@phosphor-icons/react';

const LANDING_STYLES = `
  .landing-page {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    padding: 3rem 5%;
    text-align: center;
  }

  .landing-brand {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    margin-bottom: 1rem;
  }

  .landing-brand span {
    font-family: var(--serif);
    font-size: 1.6rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text);
  }

  .landing-page h1 {
    font-family: var(--serif);
    font-size: 2.4rem;
    color: var(--text);
    font-weight: 600;
    margin-bottom: 0.6rem;
  }

  .landing-page > p {
    color: var(--text-muted);
    font-size: 0.95rem;
    max-width: 420px;
    margin-bottom: 3rem;
  }

  .landing-options {
    display: flex;
    gap: 1.5rem;
    width: 100%;
    max-width: 720px;
  }

  .landing-option {
    flex: 1;

    background: var(--bg-2);
    border: 1px solid var(--border);
    border-radius: 4px;

    padding: 2.5rem 1.8rem;

    display: flex;
    flex-direction: column;
    align-items: center;

    text-decoration: none;

    transition:
      transform 0.25s ease,
      border-color 0.25s ease,
      box-shadow 0.25s ease;
  }

  .landing-option:hover {
    transform: translateY(-4px);
    border-color: var(--ember);
    box-shadow: 0 20px 45px rgba(0, 0, 0, 0.3);
  }

  .landing-option-icon {
    width: 64px;
    height: 64px;

    border-radius: 50%;

    background: rgba(200, 64, 26, 0.12);
    border: 1px solid rgba(200, 64, 26, 0.3);

    display: flex;
    align-items: center;
    justify-content: center;

    margin-bottom: 1.3rem;

    color: var(--ember);
  }

  .landing-option h2 {
    font-family: var(--serif);
    font-size: 1.3rem;

    color: var(--text);
    font-weight: 600;

    margin-bottom: 0.5rem;
  }

  .landing-option p {
    color: var(--text-muted);
    font-size: 0.85rem;
    line-height: 1.5;

    margin: 0;
  }

  @media (max-width: 640px) {
    .landing-page h1 {
      font-size: 1.9rem;
    }

    .landing-options {
      flex-direction: column;
    }

    .landing-option {
      width: 100%;
      padding: 2rem 1.5rem;
      box-sizing: border-box;
    }
  }
`;

export const MenuKiosk = () => {
  return (
    <div className="landing-page">
      <style>{LANDING_STYLES}</style>

      <div className="landing-brand">
        <Flame
          weight="fill"
          color="var(--ember)"
          size={26}
        />

        <span>
          THE
          <span style={{ color: 'var(--ember)' }}>
            BURGUER
          </span>
        </span>
      </div>

      <h1>Como você quer pedir?</h1>

      <p>
        Escolha uma opção pra continuar.
      </p>

      <div className="landing-options">

        {/* RESTAURANTE */}
        <Link
          to="/cardapio"
          className="landing-option"
        >
          <div className="landing-option-icon">
            <MapPin
              size={28}
              weight="fill"
            />
          </div>

          <h2>Estou no Restaurante</h2>

          <p>
            Consulte o cardápio pela mesa e chame
            o garçom pra pedir.
          </p>
        </Link>

        {/* DELIVERY */}
        <Link
          to="/"
          className="landing-option"
        >
          <div className="landing-option-icon">
            <Bicycle
              size={28}
              weight="fill"
            />
          </div>

          <h2>Delivery</h2>

          <p>
            Peça online e receba no conforto da sua casa.
          </p>
        </Link>

      </div>
    </div>
  );
};