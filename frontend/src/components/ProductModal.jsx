import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ChatText, Star, Lightning } from '@phosphor-icons/react';
import api from '../api/axios';
import { useCart } from '../contexts/CartContext';

const COMBO_PRICE = 15.00;

export const ProductModal = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity]     = useState(1);
  const [observation, setObservation] = useState('');
  const [reviews, setReviews]       = useState([]);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  // Variante para hamburguer: 'single' | 'double'
  const [burgerVariant, setBurgerVariant] = useState('single');

  // Tamanho para batatas: 'small' | 'medium' | 'large'
  const [potatoSize, setPotatoSize] = useState('small');

  // Combo (apenas para burgers)
  const [isCombo, setIsCombo] = useState(false);

  useEffect(() => {
    api.get('/settings/store-status')
      .then(res => setIsStoreOpen(res.data.isOpen))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (product?.id) {
      api.get(`/reviews/product/${product.id}`)
        .then(res => setReviews(res.data))
        .catch(() => {});
    }
  }, [product]);

  // Reset options when product changes
  useEffect(() => {
    setBurgerVariant('single');
    setPotatoSize('small');
    setIsCombo(false);
    setQuantity(1);
    setObservation('');
  }, [product?.id]);

  if (!product) return null;

  const categoryName = (product?.category?.name || '').toLowerCase();
  const productName  = (product?.name || '').toLowerCase();

  // Deteccao rigorosa de batatas/porcoes (JAMAIS considera hamburguer)
  const isPotato = Boolean(
    product?.hasSizes ||
    product?.priceMedium ||
    /batata|fritas|porç|acompanh/i.test(categoryName) ||
    /batata|fritas/i.test(productName)
  );

  // Deteccao rigorosa de hamburguer (EXCLUI batatas explicitamente)
  const isBurger = !isPotato && Boolean(
    product?.isburger ||
    product?.priceDouble ||
    /burg|hamb|lanche|artesanal/i.test(categoryName) ||
    /smash|salad|bacon|aloha|burg|classic/i.test(productName)
  );

 let singlePrice = product.price;
let doublePrice = product.priceDouble;

let smallPrice = product.price;
let mediumPrice = product.priceMedium;
let largePrice = product.priceLarge;

// ---------- Hambúrgueres ----------

if (/smash/i.test(productName)) {
  singlePrice = 19;
  doublePrice = 29;
}

else if (/salad|bacon|aloha/i.test(productName)) {
  singlePrice = 25;
  doublePrice = 32;
}

// ---------- Batatas ----------

if (/cheddar|farofa/i.test(productName)) {
  smallPrice = 15;
  mediumPrice = 19;
  largePrice = 23;
}

else if (/batata|fritas/i.test(productName)) {
  smallPrice = 9;
  mediumPrice = 12;
  largePrice = 15;
}
  // ── Calculo dinamico do preco unitario ──────────────────────
  const getUnitPrice = () => {
    let base = singlePrice;

    if (isBurger && burgerVariant === 'double') {
      base = doublePrice;
    }

    if (isPotato) {
      if (potatoSize === 'medium') base = mediumPrice;
      if (potatoSize === 'large')  base = largePrice;
    }

    if (isBurger && isCombo) base += COMBO_PRICE;
    
    console.log({
  productName,
  categoryName,
  isPotato,
  isBurger,
  potatoSize,
  smallPrice,
  mediumPrice,
  largePrice,
  unitPrice,
  product,
});

    return base;
  };

  const unitPrice = getUnitPrice();

  const fmt = (n) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`;

  // ── Labels para o carrinho ───────────────────────────────────
  const buildCartOptions = () => {
    const opts = [];
    if (isBurger) opts.push(burgerVariant === 'double' ? 'Duplo' : 'Simples');
    if (isPotato) opts.push({ small: 'P', medium: 'M', large: 'G' }[potatoSize]);
    if (isBurger && isCombo) opts.push('Combo (+batata M + bebida)');
    return opts.join(' • ');
  };

  const handleAdd = () => {
    const cartOptions = buildCartOptions();
    const finalObservation = [cartOptions, observation].filter(Boolean).join(' | ');
    addToCart({ ...product, price: unitPrice }, quantity, finalObservation, {
      variant: isBurger ? burgerVariant : null,
      size: isPotato ? potatoSize : null,
      isCombo: isBurger ? isCombo : false,
      basePrice: unitPrice,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-modal" onClick={onClose} aria-label="Fechar">
          <X size={24} />
        </button>

        <div className="modal-body">
          <div className="modal-image-container">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <div className="image-placeholder">Sem imagem</div>
            )}
          </div>
          
          <div className="modal-details">
            <div className="modal-header-group">
              <span className="label" style={{ color: 'var(--gold)', display: 'block', marginBottom: '0.5rem' }}>
                {product.category?.name || (isBurger ? 'Burguers Artesanais' : isPotato ? 'Batatas' : 'Cardápio')}
              </span>
              <h2>{product.name}</h2>
              <p className="description" style={{ marginBottom: '1.5rem' }}>{product.description}</p>
              
              {product.ingredients && (
                <div className="ingredients-box">
                  <span className="label" style={{ fontSize: '0.65rem', marginBottom: '0.5rem', display: 'block' }}>Composição</span>
                  <p>{product.ingredients}</p>
                </div>
              )}
            </div>

            {/* ── Selecao Simples / Duplo (EXCLUSIVO para Burgers) ── */}
            {isBurger && (
              <div className="option-section">
                <span className="option-label">Opção do Hamburguer</span>
                <div className="option-pills">
                  <button
                    className={`pill ${burgerVariant === 'single' ? 'active' : ''}`}
                    onClick={() => setBurgerVariant('single')}
                  >
                    <span className="pill-title">Simples</span>
                    <span className="pill-price">{fmt(singlePrice)}</span>
                  </button>
                  <button
                    className={`pill ${burgerVariant === 'double' ? 'active' : ''}`}
                    onClick={() => setBurgerVariant('double')}
                  >
                    <span className="pill-title">Duplo</span>
                    <span className="pill-price">{fmt(doublePrice)}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Selecao de Tamanho (EXCLUSIVO para Batatas) ── */}
            {isPotato && (
              <div className="option-section">
                <span className="option-label">Tamanho da Porção</span>
                <div className="option-pills">
                  <button
                    className={`pill ${potatoSize === 'small' ? 'active' : ''}`}
                    onClick={() => setPotatoSize('small')}
                  >
                    <span className="pill-title">Pequena (P)</span>
                    <span className="pill-price">{fmt(smallPrice)}</span>
                  </button>
                  <button
                    className={`pill ${potatoSize === 'medium' ? 'active' : ''}`}
                    onClick={() => setPotatoSize('medium')}
                  >
                    <span className="pill-title">Média (M)</span>
                    <span className="pill-price">{fmt(mediumPrice)}</span>
                  </button>
                  <button
                    className={`pill ${potatoSize === 'large' ? 'active' : ''}`}
                    onClick={() => setPotatoSize('large')}
                  >
                    <span className="pill-title">Grande (G)</span>
                    <span className="pill-price">{fmt(largePrice)}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── Combo (EXCLUSIVO para Burgers) ── */}
            {isBurger && (
              <button
                className={`combo-toggle ${isCombo ? 'active' : ''}`}
                onClick={() => setIsCombo(v => !v)}
                type="button"
              >
                <div className="combo-toggle-left">
                  <Lightning size={20} weight="fill" />
                  <div>
                    <span className="combo-title">Transformar em Combo</span>
                    <span className="combo-sub">+ Batata Média + Refri Garrafinha ou Guaracamp</span>
                  </div>
                </div>
                <div className="combo-toggle-right">
                  <span className="combo-add-price">+ {fmt(COMBO_PRICE)}</span>
                  <div className={`combo-check ${isCombo ? 'checked' : ''}`}>
                    {isCombo && <span>✓</span>}
                  </div>
                </div>
              </button>
            )}
            
            {/* ── Preco dinamico ── */}
            <div className="modal-price-tag">
              {fmt(unitPrice)}
              {isBurger && burgerVariant === 'double' && (
                <span className="price-badge">Duplo</span>
              )}
              {isBurger && isCombo && (
                <span className="price-badge combo">Combo</span>
              )}
              {isPotato && (
                <span className="price-badge" style={{ background: 'rgba(191,160,106,0.15)', color: 'var(--gold)', borderColor: 'rgba(191,160,106,0.3)' }}>
                  {{ small: 'Tamanho P', medium: 'Tamanho M', large: 'Tamanho G' }[potatoSize]}
                </span>
              )}
            </div>

            <div className="observation-section">
              <label>
                <ChatText size={18} weight="fill" /> 
                <span>Observações</span>
              </label>
              <textarea 
                placeholder="Ex: Ponto da carne, tirar cebola, sabor do refrigerante ou soda italiana, etc..."
                value={observation}
                onChange={e => setObservation(e.target.value)}
                rows={3}
              />
            </div>

            {reviews.length > 0 && (
              <div className="reviews-section" style={{ marginTop: '2rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--gold)', letterSpacing: '0.1em' }}>
                  <Star size={18} weight="fill" /> Avaliações ({reviews.length})
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {reviews.map(r => (
                    <div key={r.id} style={{ padding: '1rem', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.user?.name || 'Cliente'}</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[1,2,3,4,5].map(n => <Star key={n} size={12} weight={n <= r.rating ? 'fill' : 'thin'} color="var(--gold)" />)}
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>"{r.comment}"</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <footer className="modal-footer">
              <div className="qty-selector">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>
                  <Minus size={18} weight="bold" />
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)}>
                  <Plus size={18} weight="bold" />
                </button>
              </div>

              <button 
                className="btn-primary add-btn" 
                onClick={handleAdd}
                disabled={!isStoreOpen}
                style={!isStoreOpen ? { background: 'var(--border)', color: 'var(--text-muted)', cursor: 'not-allowed', opacity: 0.7 } : {}}
              >
                {isStoreOpen ? `Adicionar • ${fmt(unitPrice * quantity)}` : 'Loja Fechada'}
              </button>
            </footer>
          </div>
        </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(12px);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          animation: fadeIn 0.2s ease-out;
        }
        
        .modal-content {
          background: var(--bg-2);
          width: 100%;
          max-width: 960px;
          border-radius: 4px;
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
          box-shadow: 0 30px 60px rgba(0,0,0,0.6);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .close-modal {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          color: #fff;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all 0.2s;
        }
        .close-modal:hover { background: var(--ember); border-color: var(--ember); transform: rotate(90deg); }

        .modal-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 560px;
        }

        .modal-image-container {
          background: var(--bg-3);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid var(--border);
        }
        .modal-image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .image-placeholder { color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.8rem; }

        .modal-details {
          padding: 2.5rem 3rem;
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
          background: var(--bg-2);
          overflow-y: auto;
          max-height: 90vh;
        }

        .modal-header-group h2 {
          font-size: 2.2rem;
          line-height: 1.1;
          margin: 0.4rem 0 0.8rem;
          font-family: var(--serif);
        }

        .modal-header-group .description {
          color: var(--text-muted);
          font-size: 1rem;
          line-height: 1.6;
          font-weight: 300;
        }

        .ingredients-box {
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 1rem 1.2rem;
          border-radius: 2px;
        }
        .ingredients-box p {
          font-size: 0.88rem;
          color: var(--text);
          line-height: 1.5;
          font-weight: 400;
        }

        /* ── Option sections ── */
        .option-section { display: flex; flex-direction: column; gap: 0.6rem; }
        .option-label {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-muted);
          font-weight: 600;
        }
        .option-pills {
          display: flex;
          gap: 0.6rem;
          flex-wrap: wrap;
        }
        .pill {
          flex: 1;
          min-width: 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          padding: 0.75rem 1rem;
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--text-muted);
        }
        .pill:hover { border-color: var(--ember); color: var(--text); }
        .pill.active {
          border-color: var(--ember);
          background: rgba(200, 64, 26, 0.12);
          color: #fff;
        }
        .pill-title { font-size: 0.85rem; font-weight: 600; }
        .pill-price { font-size: 0.78rem; color: var(--gold); font-family: var(--serif); }
        .pill.active .pill-price { color: var(--ember-light); }

        /* ── Combo toggle ── */
        .combo-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1rem 1.2rem;
          background: var(--bg-3);
          border: 1px dashed var(--border);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          color: var(--text-muted);
        }
        .combo-toggle:hover { border-color: var(--gold); color: var(--text); }
        .combo-toggle.active {
          border-color: var(--gold);
          border-style: solid;
          background: rgba(191, 160, 106, 0.08);
          color: var(--text);
        }
        .combo-toggle-left {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        .combo-toggle-left svg { color: var(--gold); flex-shrink: 0; }
        .combo-title { display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.15rem; }
        .combo-sub { display: block; font-size: 0.72rem; color: var(--text-muted); }
        .combo-toggle-right { display: flex; align-items: center; gap: 0.8rem; flex-shrink: 0; }
        .combo-add-price { font-family: var(--serif); font-size: 0.95rem; color: var(--gold); font-weight: 600; white-space: nowrap; }
        .combo-check {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .combo-check.checked { background: var(--gold); border-color: var(--gold); color: #000; font-weight: 700; }

        /* ── Price tag ── */
        .modal-price-tag {
          font-family: var(--serif);
          font-size: 1.9rem;
          font-weight: 600;
          color: var(--ember-light);
          display: flex;
          align-items: center;
          gap: 0.8rem;
          flex-wrap: wrap;
        }
        .price-badge {
          font-family: var(--sans);
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 0.2rem 0.6rem;
          border-radius: 2px;
          background: rgba(200,64,26,0.15);
          color: var(--ember);
          border: 1px solid rgba(200,64,26,0.3);
          font-weight: 700;
        }
        .price-badge.combo {
          background: rgba(191,160,106,0.15);
          color: var(--gold);
          border-color: rgba(191,160,106,0.3);
        }

        .observation-section {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .observation-section label {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--gold);
          font-weight: 600;
        }
        .observation-section textarea {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 2px;
          color: #fff;
          padding: 1rem;
          font-family: var(--sans);
          resize: none;
          outline: none;
          transition: all 0.2s;
          font-size: 0.88rem;
        }
        .observation-section textarea:focus { border-color: var(--ember); background: rgba(255,255,255,0.05); }

        .modal-footer {
          margin-top: auto;
          display: flex;
          gap: 1.5rem;
          padding-top: 1.2rem;
          border-top: 1px solid var(--border);
        }

        .qty-selector {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          background: var(--bg-3);
          padding: 0 1rem;
          border-radius: 2px;
          border: 1px solid var(--border);
        }
        .qty-selector button {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0.5rem;
          display: flex;
          transition: color 0.2s;
        }
        .qty-selector button:not(:disabled):hover { color: var(--ember); }
        .qty-selector button:disabled { opacity: 0.3; cursor: not-allowed; }
        .qty-selector span { font-weight: 600; min-width: 20px; text-align: center; font-size: 1.1rem; }

        .add-btn { flex: 1; justify-content: center; font-size: 0.85rem; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        @media (max-width: 900px) {
          .modal-content { max-width: 500px; max-height: 90vh; overflow-y: auto; }
          .modal-body { grid-template-columns: 1fr; min-height: auto; }
          .modal-image-container { height: 240px; border-right: none; border-bottom: 1px solid var(--border); }
          .modal-details { padding: 1.5rem; gap: 1.2rem; max-height: none; }
          .modal-header-group h2 { font-size: 1.7rem; }
          .modal-footer { flex-direction: column; gap: 1rem; }
          .qty-selector { justify-content: space-between; padding: 0.8rem 1.5rem; }
        }
      `}</style>
      </div>
    </div>
  );
};