import React, { useContext, useState } from 'react';
import { X, Minus, Plus, ShoppingBag, Trash, Money, CreditCard, Bank } from '@phosphor-icons/react';
import { useCart } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { fmt, buildWhatsAppUrl } from '../utils/format';

export const CartDrawer = () => {
  const { isCartOpen, toggleCart, cart, updateQuantity, removeFromCart, totalPrice, clearCart } = useCart();
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toggleCart();
      navigate('/register');
      return;
    }

    if (!paymentMethod) {
      toast.error('Por favor, selecione uma forma de pagamento.');
      return;
    }

    try {
      setIsSubmitting(true);
      const items = cart.map(({ id, quantity, observation }) => ({ productId: id, quantity, observation }));

      // Salva no backend
      const res = await api.post('/orders', { items });
      const orderId = res.data.id;

      // Monta mensagem do WhatsApp
      const orderSummary = cart.map(item => {
        let line = `▪ ${item.quantity}x ${item.name} — ${fmt(item.price * item.quantity)}`;
        if (item.observation) line += `\n   _(Obs: ${item.observation})_`;
        return line;
      }).join('\n');
      const addressInfo = user.address
        ? `${user.address}, ${user.number || 'S/N'}${user.complement ? ` (${user.complement})` : ''} - ${user.neighborhood}\nCEP: ${user.cep}`
        : 'Retirada no local / Não informado';

      const text = `*NOVO PEDIDO — THE BURGUER* 🍔🔥\n\n*👤 Cliente:* ${user.name}\n*📱 Telefone:* ${user.phone || 'Não informado'}\n\n*🛒 Resumo do Pedido:*\n${orderSummary}\n\n*💰 Total:* ${fmt(totalPrice)}\n*💳 Pagamento:* ${paymentMethod}\n\n*📍 Endereço de Entrega:*\n${addressInfo}\n\n*Acompanhe seu pedido online:*\n${window.location.origin}/tracking/${orderId}`;

      const whatsappUrl = buildWhatsAppUrl(text);

      clearCart();
      toggleCart();

      // Abre o WhatsApp numa nova aba
      window.open(whatsappUrl, '_blank');

      // Redireciona o usuário para a tela de acompanhamento na aba atual
      navigate(`/tracking/${orderId}`, { state: { paymentMethod } });

    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Erro ao realizar pedido.';
      toast.error(Array.isArray(msg) ? msg.join('\n') : msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentOptions = [
    { id: 'Pix', icon: <Bank size={20} /> },
    { id: 'Cartão de Crédito', icon: <CreditCard size={20} /> },
    { id: 'Cartão de Débito', icon: <CreditCard size={20} /> },
    { id: 'Dinheiro', icon: <Money size={20} /> }
  ];

  return (
    <>
      <div
        className={`cart-overlay ${isCartOpen ? 'active' : ''}`}
        onClick={toggleCart}
        aria-hidden="true"
      />

      <aside className={`cart-drawer ${isCartOpen ? 'active' : ''}`} aria-label="Carrinho de compras">
        <div className="cart-header">
          <h3>Seu Pedido</h3>
          <button className="close-cart" onClick={toggleCart} aria-label="Fechar carrinho">
            <X size={22} />
          </button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={44} weight="thin" color="var(--text-muted)" />
              <p>Seu carrinho está vazio.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div role="list">
                {cart.map(item => (
                  <div key={`${item.id}-${item.observation}`} className="cart-item-row" style={{
                    display: 'flex', alignItems: 'center', gap: '0.8rem',
                    padding: '1rem 0', borderBottom: '1px solid var(--border)',
                  }}>
                    {item.imageUrl && (
                      <img src={item.imageUrl} alt={item.name}
                        style={{ width: 56, height: 56, objectFit: 'cover', flexShrink: 0, borderRadius: '4px' }} />
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 500, fontSize: '0.95rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name}
                      </p>
                      <span style={{ color: 'var(--ember)', fontFamily: 'var(--serif)', fontSize: '1rem', fontWeight: 600 }}>
                        {fmt(item.price)}
                      </span>
                      {item.observation && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: '0.2rem', fontStyle: 'italic' }}>
                          Obs: {item.observation}
                        </p>
                      )}
                    </div>

                    <div className="qty-controls">
                      <button onClick={() => updateQuantity(item.id, -1, item.observation)} aria-label="Diminuir">
                        <Minus size={14} />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1, item.observation)} aria-label="Aumentar">
                        <Plus size={14} />
                      </button>
                    </div>

                    <button className="remove-btn" onClick={() => removeFromCart(item.id, item.observation)} aria-label="Remover item">
                      <Trash size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="payment-section">
                <span className="label" style={{ display: 'block', marginBottom: '1rem' }}>Forma de Pagamento</span>
                <div className="payment-grid">
                  {paymentOptions.map(opt => (
                    <button
                      key={opt.id}
                      className={`payment-btn ${paymentMethod === opt.id ? 'active' : ''}`}
                      onClick={() => setPaymentMethod(opt.id)}
                    >
                      {opt.icon}
                      <span>{opt.id}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="cart-footer">
          <div className="cart-total">
            <span style={{ fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total</span>
            <span style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', color: '#fff' }}>{fmt(totalPrice)}</span>
          </div>
          <button
            className="btn-primary btn-checkout"
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting}
            style={{ 
              justifyContent: 'center', 
              opacity: cart.length === 0 || isSubmitting ? 0.5 : 1,
              transform: isSubmitting ? 'none' : ''
            }}
          >
            {isSubmitting ? 'Processando...' : (user ? 'Finalizar Pedido via WhatsApp' : 'Cadastrar para Pedir')}
          </button>
        </div>
      </aside>
    </>
  );
};

