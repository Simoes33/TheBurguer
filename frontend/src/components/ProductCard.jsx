import React, { useCallback, useState } from 'react';
import { Plus, Star, Heart } from '@phosphor-icons/react';
import { fmt } from '../utils/format';

// Lê/salva favoritos no localStorage
const getFavorites = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem('@TheBurguer:favorites') || '[]'));
  } catch {
    return new Set();
  }
};

const saveFavorites = (favSet) => {
  localStorage.setItem('@TheBurguer:favorites', JSON.stringify([...favSet]));
};

// Padding da imagem menor no mobile (o style inline do <img> cobre o
// desktop; esse !important só entra em telas pequenas, via media query
// real, já que style inline não suporta @media).
const RESPONSIVE_IMG_STYLE = `
  @media (max-width: 640px) {
    .pc-img { padding: 0.3rem !important; }
  }
`;

export const ProductCard = React.memo(({ product, onClick, isBestseller = false }) => {
  const [isFav, setIsFav] = useState(() => getFavorites().has(product.id));

  const handleFavorite = useCallback((e) => {
    e.stopPropagation();
    setIsFav(prev => {
      const favs = getFavorites();

      if (prev) favs.delete(product.id);
      else favs.add(product.id);

      saveFavorites(favs);
      return !prev;
    });
  }, [product.id]);

  // Rating médio
  const avgRating = product.reviews?.length
    ? (
        product.reviews.reduce((a, r) => a + r.rating, 0) /
        product.reviews.length
      ).toFixed(1)
    : null;

  return (
    <article
      className="product-card animate-fade-in-up"
      onClick={() => onClick(product)}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes de ${product.name} — ${fmt(product.price)}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick(product)}
    >
      <style>{RESPONSIVE_IMG_STYLE}</style>
      <div className="product-image">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="pc-img"
            style={{ objectFit: 'contain', padding: '0.9rem' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-3)',
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Sem imagem
          </div>
        )}

        <div className="product-image-overlay" />

        {product.category?.name && (
          <span
            style={{
              position: 'absolute',
              top: '0.8rem',
              left: '0.8rem',
              background: 'rgba(8,8,8,0.7)',
              color: 'var(--gold)',
              fontSize: '0.65rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.25rem 0.6rem',
              fontFamily: 'var(--sans)',
              fontWeight: 500,
              backdropFilter: 'blur(8px)',
              borderRadius: '2px',
            }}
          >
            {product.category.name}
          </span>
        )}

        {isBestseller && (
  <span
    className="product-badge"
    style={{
      bottom: '0.8rem',
      left: '0.8rem',
      top: 'auto',
      right: 'auto',
    }}
  >
    🔥 Mais Pedido
  </span>
)}

<button
  className={`favorite-btn ${isFav ? 'active' : ''}`}
  onClick={handleFavorite}
  aria-label={
    isFav
      ? `Remover ${product.name} dos favoritos`
      : `Adicionar ${product.name} aos favoritos`
  }
>
  <Heart size={16} weight={isFav ? 'fill' : 'regular'} />
</button>
      </div>

      <div className="product-info">
        {avgRating ? (
  <div className="product-rating">
    <div className="rating-stars" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={11}
          weight={n <= Math.round(Number(avgRating)) ? 'fill' : 'thin'}
          color="var(--gold)"
        />
      ))}
    </div>
    <span className="rating-count">
      {avgRating} ({product.reviews.length})
    </span>
  </div>
) : (
  <div className="rating-placeholder" />
)}

        <h3>{product.name}</h3>

        <p className="description">{product.description}</p>

        <div className="product-footer">
          <span className="price">
            {fmt(product.price)}
          </span>

          <button
            className="add-to-cart"
            onClick={(e) => {
              e.stopPropagation();
              onClick(product);
            }}
            aria-label={`Adicionar ${product.name} ao pedido`}
          >
            <Plus weight="bold" size={16} />
          </button>
        </div>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';