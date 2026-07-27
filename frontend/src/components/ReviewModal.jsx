import React, { useState } from 'react';
import { X, Star } from '@phosphor-icons/react';
import api from '../api/axios';
import { useToast } from '../contexts/ToastContext';

export const ReviewModal = ({ products, onClose }) => {
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || '');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        productId: selectedProduct,
        rating,
        comment
      });
      toast.success('Avaliação enviada! Obrigado pelo feedback.');
      onClose();
    } catch {
      toast.error('Erro ao enviar avaliação.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.92)' }}>
      <div className="modal-content" style={{ maxWidth: '500px', padding: '3rem' }}>
        <button className="close-modal" onClick={onClose}><X size={24} /></button>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="label" style={{ color: 'var(--gold)' }}>Feedback</span>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', marginTop: '0.5rem' }}>O que achou?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Sua opinião nos ajuda a melhorar cada brasa.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={labelStyle}>Qual item deseja avaliar?</label>
            <select 
              style={inputStyle} 
              value={selectedProduct} 
              onChange={e => setSelectedProduct(e.target.value)}
              required
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div style={{ textAlign: 'center' }}>
            <label style={labelStyle}>Sua nota</label>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
                >
                  <Star 
                    size={32} 
                    weight={num <= rating ? 'fill' : 'thin'} 
                    color={num <= rating ? 'var(--gold)' : 'var(--text-muted)'} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Comentário (opcional)</label>
            <textarea
              style={{ ...inputStyle, resize: 'none' }}
              rows={4}
              placeholder="O burger estava no ponto? As batatas chegaram quentes?..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
        </form>
      </div>
    </div>
  );
};

const labelStyle = { display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem', letterSpacing: '0.1em', fontWeight: 600 };
const inputStyle = { width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '0.8rem 1rem', color: 'var(--text)', borderRadius: '2px', outline: 'none' };
