import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ChatText, Star } from '@phosphor-icons/react';
import api from '../api/axios';
import { useCart } from '../contexts/CartContext';

export const ProductModal = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState('');
  const [reviews, setReviews] = useState([]);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

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

  if (!product) return null;

  const handleAdd = () => {
    addToCart(product, quantity, observation);
    onClose();
  };

  const fmt = (n) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`;

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
                {product.category?.name || 'Lanche'}
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
            
            <div className="modal-price-tag">
              {fmt(product.price)}
            </div>

            <div className="observation-section">
              <label>
                <ChatText size={18} weight="fill" /> 
                <span>Observações</span>
              </label>
              <textarea 
                placeholder="Ex: Ponto da carne, tirar cebola, etc..."
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
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.user.name}</span>
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
                {isStoreOpen ? `Adicionar • ${fmt(product.price * quantity)}` : 'Loja Fechada'}
              </button>
            </footer>
          </div>
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
          max-width: 940px;
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
          min-height: 540px;
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
          padding: 3.5rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          background: var(--bg-2);
        }

        .modal-header-group h2 {
          font-size: 2.4rem;
          line-height: 1.1;
          margin: 0.4rem 0 1rem;
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
          padding: 1.2rem;
          border-radius: 2px;
          margin-bottom: 0.5rem;
        }
        .ingredients-box p {
          font-size: 0.9rem;
          color: var(--text);
          line-height: 1.5;
          font-weight: 400;
        }

        .modal-price-tag {
          font-family: var(--serif);
          font-size: 1.8rem;
          font-weight: 600;
          color: var(--ember-light);
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
        }
        .observation-section textarea:focus { border-color: var(--ember); background: rgba(255,255,255,0.05); }

        .modal-footer {
          margin-top: auto;
          display: flex;
          gap: 1.5rem;
          padding-top: 1.5rem;
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
          .modal-image-container { height: 260px; border-right: none; border-bottom: 1px solid var(--border); }
          .modal-details { padding: 2rem; gap: 1.5rem; }
          .modal-details h2 { font-size: 1.8rem; }
          .modal-footer { flex-direction: column; gap: 1rem; }
          .qty-selector { justify-content: space-between; padding: 0.8rem 1.5rem; }
        }
      `}</style>
    </div>
  );
};