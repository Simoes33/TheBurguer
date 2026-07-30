import React from "react";
import "./FavoriteBurgers.css";

const FavoriteBurgers = ({
  products = [],
  bestsellerIds = [],
  onProductClick,
}) => {
  /*
   * ========================================
   * MAIS PEDIDOS — APENAS HAMBÚRGUERES
   * ========================================
   *
   * bestsellerIds vem do backend na ordem:
   * [1º, 2º, 3º]
   *
   * Como o backend retorna somente os IDs,
   * usamos esses IDs para localizar os produtos.
   */

  const burgers = bestsellerIds
    .map((id) =>
      products.find(
        (product) => String(product.id) === String(id)
      )
    )
    .filter(Boolean)
    .filter((product) => {
      const category =
        product.category?.name ||
        product.category ||
        "";

      const name = product.name || "";

      return (
        /hamburg/i.test(category) ||
        /burger/i.test(category) ||
        /hamburg/i.test(name) ||
        /burger/i.test(name)
      );
    })
    .slice(0, 3);

  /*
   * Se não houver hambúrgueres suficientes,
   * não renderiza a seção.
   */

  if (burgers.length === 0) {
    return null;
  }

  const first = burgers[0];
  const second = burgers[1];
  const third = burgers[2];

  /*
   * ========================================
   * PREÇO
   * ========================================
   */

  const formatPrice = (price) =>
    Number(price || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  /*
   * ========================================
   * IMAGEM
   * ========================================
   */

  const getImage = (product) => {
    return (
      product.imageUrl ||
      product.image ||
      product.image_url ||
      ""
    );
  };

  /*
   * ========================================
   * CARD
   * ========================================
   */

  const BurgerCard = ({ product, position }) => {
    if (!product) return null;

    return (
      <div
        className={`favorite-burger-card favorite-burger-${position}`}
        onClick={() => onProductClick?.(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            onProductClick?.(product);
          }
        }}
      >
        {/* IMAGEM */}

        <div className="favorite-burger-image">
          <img
            src={getImage(product)}
            alt={product.name}
          />

          {/* POSIÇÃO */}

          <div className="favorite-burger-position">
            {position === 1 ? (
              <span>🏆</span>
            ) : (
              <span>{position}º</span>
            )}
          </div>
        </div>

        {/* INFORMAÇÕES */}

        <div className="favorite-burger-info">

          <span className="favorite-burger-orders">
            Mais pedido
          </span>

          <h3>{product.name}</h3>

          <div className="favorite-burger-footer">

            <strong>
              {formatPrice(product.price)}
            </strong>

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

  /*
   * ========================================
   * RENDER
   * ========================================
   */

  return (
    <section
      className="favorite-burgers-section"
      aria-label="Hambúrgueres mais pedidos"
    >

      <div className="section-header">

        <span className="label">
          Os favoritos da casa
        </span>

        <h2>
          Os mais pedidos
          <span className="highlight">.</span>
        </h2>

        <p>
          Os hambúrgueres que mais saem da nossa chapa.
        </p>

      </div>

      <div className="favorite-burgers-podium">

        {/* 2º LUGAR */}

        {second && (
          <BurgerCard
            product={second}
            position={2}
          />
        )}

        {/* 1º LUGAR */}

        <BurgerCard
          product={first}
          position={1}
        />

        {/* 3º LUGAR */}

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