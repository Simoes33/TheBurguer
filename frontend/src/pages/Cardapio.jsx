import React from 'react';
import { Link } from 'react-router-dom';

const CARDAPIO_STYLES = `
  .cardapio-test-page {
    min-height: 100vh;
    background: #111;
    color: #fff;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 30px 20px;
    box-sizing: border-box;
  }

  .cardapio-test-container {
    width: 100%;
    max-width: 800px;
    text-align: center;
  }

  .cardapio-test-logo {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 2px;
    margin-bottom: 40px;
  }

  .cardapio-test-logo span {
    color: #c8401a;
  }

  .cardapio-test-container h1 {
    font-size: 36px;
    margin: 0 0 15px;
  }

  .cardapio-test-container > p {
    color: #aaa;
    margin-bottom: 40px;
  }

  .cardapio-test-success {
    background: #1c1c1c;
    border: 1px solid #333;
    border-radius: 10px;

    padding: 30px;
    margin-bottom: 30px;
  }

  .cardapio-test-success h2 {
    margin: 0 0 15px;
    color: #c8401a;
  }

  .cardapio-test-success p {
    color: #bbb;
    margin: 0;
    line-height: 1.6;
  }

  .cardapio-test-button {
    display: inline-block;

    padding: 14px 24px;

    background: #c8401a;
    color: #fff;

    border-radius: 6px;

    text-decoration: none;
    font-weight: 600;

    transition: opacity 0.2s ease;
  }

  .cardapio-test-button:hover {
    opacity: 0.85;
  }
`;

export const Cardapio = () => {
  return (
    <div className="cardapio-test-page">
      <style>{CARDAPIO_STYLES}</style>

      <div className="cardapio-test-container">

        <div className="cardapio-test-logo">
          THE<span>BURGUER</span>
        </div>

        <h1>Cardápio</h1>

        <p>
          Página de teste para clientes no restaurante.
        </p>

        <div className="cardapio-test-success">
          <h2>✓ Rota funcionando!</h2>

          <p>
            Você acessou corretamente a página
            <strong> /cardapio </strong>
            através da opção "Estou no Restaurante".
          </p>
        </div>

        <Link
          to="/kiosk"
          className="cardapio-test-button"
        >
          Voltar
        </Link>

      </div>
    </div>
  );
};