import React from 'react';

const CARDAPIO_STYLES = `
  .cardapio-page {
    min-height: 100vh;
    background: #111;
    color: #fff;
    padding: 40px 20px;
  }

  .cardapio-container {
    max-width: 900px;
    margin: 0 auto;
  }

  .cardapio-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .cardapio-logo {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: 2px;
    margin-bottom: 10px;
  }

  .cardapio-logo span {
    color: #c8401a;
  }

  .cardapio-header h1 {
    font-size: 32px;
    margin: 20px 0 10px;
  }

  .cardapio-header p {
    color: #aaa;
    margin: 0;
  }

  .cardapio-section {
    margin-bottom: 40px;
  }

  .cardapio-section h2 {
    font-size: 22px;
    margin-bottom: 20px;
    border-bottom: 1px solid #333;
    padding-bottom: 10px;
  }

  .cardapio-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .cardapio-item {
    background: #1c1c1c;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 20px;
  }

  .cardapio-item h3 {
    margin: 0 0 8px;
    font-size: 18px;
  }

  .cardapio-item p {
    color: #aaa;
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 15px;
  }

  .cardapio-price {
    color: #c8401a;
    font-size: 18px;
    font-weight: 700;
  }

  .cardapio-table {
    background: #1c1c1c;
    border: 1px solid #333;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    margin-top: 30px;
  }

  .cardapio-table strong {
    color: #c8401a;
  }

  @media (max-width: 640px) {
    .cardapio-grid {
      grid-template-columns: 1fr;
    }

    .cardapio-header h1 {
      font-size: 26px;
    }
  }
`;

export const Cardapio = () => {
  return (
    <div className="cardapio-page">
      <style>{CARDAPIO_STYLES}</style>

      <div className="cardapio-container">

        <header className="cardapio-header">
          <div className="cardapio-logo">
            THE<span>BURGUER</span>
          </div>

          <h1>Cardápio</h1>

          <p>
            Confira nossas opções e peça pelo atendimento da mesa.
          </p>
        </header>

        <section className="cardapio-section">
          <h2>🍔 Hambúrgueres</h2>

          <div className="cardapio-grid">

            <div className="cardapio-item">
              <h3>Classic Burger</h3>

              <p>
                Hambúrguer artesanal, queijo, alface, tomate e molho especial.
              </p>

              <div className="cardapio-price">
                R$ 25,00
              </div>
            </div>

            <div className="cardapio-item">
              <h3>Bacon Burger</h3>

              <p>
                Hambúrguer artesanal, queijo, bacon crocante e molho da casa.
              </p>

              <div className="cardapio-price">
                R$ 29,00
              </div>
            </div>

            <div className="cardapio-item">
              <h3>Cheddar Burger</h3>

              <p>
                Hambúrguer artesanal, cheddar cremoso e cebola caramelizada.
              </p>

              <div className="cardapio-price">
                R$ 28,00
              </div>
            </div>

            <div className="cardapio-item">
              <h3>Smash Burger</h3>

              <p>
                Dois smash burgers, queijo e molho especial.
              </p>

              <div className="cardapio-price">
                R$ 29,00
              </div>
            </div>

          </div>
        </section>

        <section className="cardapio-section">
          <h2>🍟 Acompanhamentos</h2>

          <div className="cardapio-grid">

            <div className="cardapio-item">
              <h3>Batata Frita</h3>

              <p>
                Porção de batatas fritas crocantes.
              </p>

              <div className="cardapio-price">
                R$ 12,00
              </div>
            </div>

            <div className="cardapio-item">
              <h3>Batata com Cheddar</h3>

              <p>
                Batata frita com cheddar cremoso.
              </p>

              <div className="cardapio-price">
                R$ 18,00
              </div>
            </div>

          </div>
        </section>

        <div className="cardapio-table">
          📍 Você está visualizando o cardápio do restaurante.
          <br />
          <strong>Chame o garçom para realizar seu pedido.</strong>
        </div>

      </div>
    </div>
  );
};