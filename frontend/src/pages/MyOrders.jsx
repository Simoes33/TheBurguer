import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Header } from '../components/Header';
import { Package, ArrowRight, Clock, CheckCircle } from '@phosphor-icons/react';

const STATUS_MAP = {
  PENDING:   { label: 'Recebido', color: '#BFA06A' },
  PREPARING: { label: 'Na Brasa', color: '#4EA8DE' },
  READY:     { label: 'Pronto', color: '#56CF87' },
  OUT_FOR_DELIVERY: { label: 'Em Rota', color: 'var(--ember)' },
  DELIVERED: { label: 'Entregue', color: '#807870' },
  CANCELLED: { label: 'Cancelado', color: '#C8401A' },
};

export const MyOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.get('/orders/my-orders')
        .then(res => setOrders(res.data))
        .catch(err => console.error('Erro ao carregar pedidos', err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '4rem' }}>
      <Header />
      
      <main style={{ maxWidth: '800px', margin: '8rem auto 0', padding: '0 5%' }}>
        <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Package size={32} color="var(--ember)" />
          <div>
            <h1 style={{ fontSize: '2rem' }}>Meus Pedidos</h1>
            <p style={{ color: 'var(--text-muted)' }}>Histórico de compras e acompanhamento.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '4px' }}></div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '4px' }}>
            <Clock size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem' }}>Nenhum pedido encontrado</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Você ainda não realizou nenhuma compra.</p>
            <Link to="/" className="btn-primary">Ver Cardápio</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders.map(order => {
              const status = STATUS_MAP[order.status];
              const date = new Date(order.createdAt).toLocaleDateString('pt-BR', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
              });

              return (
                <Link 
                  to={`/tracking/${order.id}`} 
                  key={order.id}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'var(--bg-2)', 
                    border: '1px solid var(--border)', 
                    padding: '1.5rem', 
                    borderRadius: '4px',
                    textDecoration: 'none',
                    color: 'inherit',
                    transition: 'all 0.2s'
                  }}
                  className="my-order-card"
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>#{order.id.slice(0, 8)}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{date}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.2rem 0.6rem', 
                        borderRadius: '2px', 
                        background: 'rgba(255,255,255,0.05)', 
                        color: status.color,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {status.label}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#ccc', marginTop: '0.5rem' }}>
                      {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} — 
                      <span style={{ color: '#fff', marginLeft: '0.5rem', fontFamily: 'var(--serif)' }}>
                        R$ {order.total.toFixed(2).replace('.', ',')}
                      </span>
                    </p>
                  </div>

                  <div style={{ color: 'var(--ember)' }}>
                    <ArrowRight size={24} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <style>{`
        .my-order-card:hover {
          border-color: var(--ember) !important;
          background: rgba(255,255,255,0.02) !important;
        }
      `}</style>
    </div>
  );
};
