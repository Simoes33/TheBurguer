import React from "react";
import "./FavoriteBurgers.css";

const FavoriteBurgers = ({ products = [], onProductClick }) => {
  // Somente hambúrgueres
  const burgers = products
    .filter((product) => {
      const category = product.category?.name || product.category || "";
      const name = product.name || "";

      return (
        /hamburg/i.test(category) ||
        /burger/i.test(category) ||
        /hamburg/i.test(name) ||
        /burger/i.test(name)
      );
    })
    .filter((product) => Number(product.orderCount || product.ordersCount || 0) > 0)
    .sort(
      (a, b) =>
        Number(b.orderCount || b.ordersCount || 0) -
        Number(a.orderCount || a.ordersCount || 0)
    )
    .slice(0, 3);

  if (burgers.length === 0) {
    return null;
  }

  const first = burgers[0];
  const second = burgers[1];
  const third = burgers[2];

  const getOrders = (product) =>
    Number(product.orderCount || product.ordersCount || 0);

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const BurgerCard = ({ product, position }) => {
    if (!product) return null;

    return (
      <div
        className={`favorite-burger-card favorite-burger-${position}`}
        onClick={() => onProductClick?.(product)}
      >
        <div className="favorite-burger-image">
          <img
            src={product.image}
            alt={product.name}
          />

          <div className="favorite-burger-position">
          {position === 1 ? (
  <span>🏆</span>
) : (
  <span>{position}º</span>
)}
          </div>
        </div>

        <div className="favorite-burger-info">
          <span className="favorite-burger-orders">
            {getOrders(product)} pedidos
          </span>

          <h3>{product.name}</h3>

          <div className="favorite-burger-footer">
            <strong>{formatPrice(product.price)}</strong>

            <button
  type="button"
  onClick={(event) => {
    event.stopPropagation();
    onProductClick?.(product);
  }}
  aria-label={`Adicionar ${product.name} ao carrinho`}
>
  <span>+</span>
</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="favorite-burgers-section">
      <div className="section-header">
        <span className="label">Os favoritos da casa</span>

        <h2>
          Os mais pedidos
          <span className="highlight">.</span>
        </h2>

        <p>
          Os hambúrgueres que mais saem da nossa chapa.
        </p>
      </div>

      <div className="favorite-burgers-podium">
        {/* 2º lugar */}
        {second && (
          <BurgerCard
            product={second}
            position={2}
          />
        )}

        {/* 1º lugar */}
        <BurgerCard
          product={first}
          position={1}
        />

        {/* 3º lugar */}
        {third && (
          <BurgerCard
            product={third}
            position={3}
          />
        )}
      </div>
    </section>
  );
};

export default FavoriteBurgers;