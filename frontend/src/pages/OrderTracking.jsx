import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { Header } from '../components/Header';
import { AuthContext } from '../contexts/AuthContext';
import { FileText, Fire, CheckCircle, Package, MapPin, XCircle, Star } from '@phosphor-icons/react';
import { ReviewModal } from '../components/ReviewModal';
import { fmt, buildWhatsAppUrl } from '../utils/format';
import { subscribeToPush } from '../hooks/usePushNotifications';


const STATUS_STEPS = [
  { id: 'PENDING',          label: 'Recebido',    icon: <FileText size={24} /> },
  { id: 'PREPARING',        label: 'Na Brasa',    icon: <Fire size={24} /> },
  { id: 'READY',            label: 'Pronto',      icon: <CheckCircle size={24} /> },
  { id: 'OUT_FOR_DELIVERY', label: 'Em Rota',     icon: <MapPin size={24} /> },
  { id: 'DELIVERED',        label: 'Entregue',    icon: <Package size={24} /> },
];

// Status finais — após estes o pedido não muda mais
const FINAL_STATUSES = ['DELIVERED', 'CANCELLED'];

export const OrderTracking = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const paymentMethod = location.state?.paymentMethod || 'A confirmar';

  const [order, setOrder]             = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null); // feedback visual de atualização
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushError, setPushError] = useState(null);
  
  const pollingRef   = useRef(null);
  const sseRef       = useRef(null);
  const isFinalRef   = useRef(false);

  // ─── Busca os dados completos do pedido (inclui relações) ───────────────────
  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
      isFinalRef.current = FINAL_STATUSES.includes(res.data.status);
      return res.data;
    } catch {
      setError('Pedido não encontrado');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ─── Aplica atualização de status recebida via SSE ou Supabase ─────────────
  const applyStatusUpdate = (newStatus, updatedAt) => {
    setOrder(prev => {
      if (!prev || prev.status === newStatus) return prev;
      return { ...prev, status: newStatus, updatedAt };
    });
    setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
    isFinalRef.current = FINAL_STATUSES.includes(newStatus);

    // Para o polling quando o pedido chega ao status final
    if (FINAL_STATUSES.includes(newStatus)) {
      stopPolling();
      closeSse();
    }
  };

  // ─── Polling de fallback (a cada 8s enquanto pedido estiver ativo) ──────────
  const startPolling = () => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      if (isFinalRef.current) {
        stopPolling();
        return;
      }
      try {
        const res = await api.get(`/orders/${id}`);
        applyStatusUpdate(res.data.status, res.data.updatedAt);
      } catch {
        // falha silenciosa — tenta novamente no próximo ciclo
      }
    }, 8000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // ─── SSE — caminho rápido (push do servidor, sem delay) ────────────────────
  const connectSse = () => {
    if (!user || sseRef.current) return;

    const token = sessionStorage.getItem('@TheBurguer:token');
    if (!token) return;

    try {
      // EventSource não suporta headers nativamente; usamos query param para o token
      // O backend valida via JwtAuthGuard normalmente pelo header Authorization
      // Para SSE, uma alternativa é usar fetch com ReadableStream:
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const url = `${baseUrl}/sse/orders/${id}`;

      const fetchSse = async () => {
        try {
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'text/event-stream',
            },
          });

          if (!response.ok || !response.body) return;

          sseRef.current = response.body;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            // Parseia os chunks SSE (formato: "data: {...}\n\n")
            const lines = text.split('\n').filter(l => l.startsWith('data:'));
            for (const line of lines) {
              try {
                const payload = JSON.parse(line.replace('data:', '').trim());
                if (payload.orderId === id) {
                  applyStatusUpdate(payload.status, payload.updatedAt);
                }
              } catch {
                // JSON inválido — ignora
              }
            }
          }
        } catch {
          // SSE desconectou — o polling garante continuidade
        }
      };

      fetchSse();
    } catch {
      // SSE não disponível — polling cobre
    }
  };

  const closeSse = () => {
    if (sseRef.current) {
      try {
        sseRef.current.cancel?.();
      } catch { /* ignora */ }
      sseRef.current = null;
    }
  };

  // ─── Setup inicial ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrder().then((data) => {
      if (!data) return;
      const isFinal = FINAL_STATUSES.includes(data.status);
      if (!isFinal) {
        connectSse();   // caminho rápido via SSE
        startPolling(); // fallback robusto via polling
      }
    });

    return () => {
      stopPolling();
      closeSse();
    };
  }, [id, user]);

  // ─── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="skeleton" style={{ width: '300px', height: '20px', borderRadius: '4px' }}></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', gap: '1rem' }}>
        <XCircle size={64} color="var(--ember)" />
        <h2>{error || 'Pedido não encontrado'}</h2>
        <Link to="/" className="btn-primary" style={{ marginTop: '1rem' }}>Voltar ao Início</Link>
      </div>
    );
  }

  const isCancelled       = order.status === 'CANCELLED';
  const currentStepIndex  = STATUS_STEPS.findIndex(s => s.id === order.status);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '4rem' }}>
      <Header />
      
      <main style={{ maxWidth: '800px', margin: '8rem auto 0', padding: '0 5%' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span className="label" style={{ display: 'block', marginBottom: '0.5rem' }}>Acompanhamento</span>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            Pedido <span style={{ color: 'var(--text-muted)' }}>#{order.id}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <span
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isCancelled ? '#C8401A' : '#56CF87',
                display: 'inline-block',
                boxShadow: isCancelled ? 'none' : '0 0 0 3px rgba(86,207,135,0.2)',
                animation: isCancelled ? 'none' : 'pulse 2s infinite',
              }}
            />
            {isCancelled ? 'Pedido cancelado' : lastUpdated ? `Atualizado às ${lastUpdated}` : 'Atualização em tempo real'}
          </p>

         {!isCancelled && 'Notification' in window && Notification.permission !== 'granted' && !pushEnabled && (
  <button
    onClick={async () => {
      setPushError(null);
      try {
        await subscribeToPush();
        setPushEnabled(true);

        new Notification('Notificações Ativadas! 🔔', {
          body: 'Avisaremos você assim que o status do seu pedido mudar.',
          icon: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=192'
        });

      } catch (err) {
        setPushError(err.message || 'Não foi possível ativar as notificações.');
      }
    }}
    style={{
      marginTop: '1.2rem',
      background: 'var(--surface)',
      border: '1px solid var(--gold)',
      color: 'var(--gold)',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      fontSize: '0.75rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      transition: 'all 0.25s'
    }}
  >
    🔔 Receber alertas de status no celular
  </button>
)}

{pushError && (
  <p style={{ color: 'var(--ember)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
    {pushError}
  </p>
)}
        </div>

        {isCancelled ? (
          <div style={{ background: 'rgba(200,64,26,0.1)', border: '1px solid var(--ember)', padding: '2rem', borderRadius: '4px', textAlign: 'center', marginBottom: '3rem' }}>
            <XCircle size={48} color="var(--ember)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--ember)', marginBottom: '0.5rem' }}>Pedido Cancelado</h2>
            <p style={{ color: 'var(--text-muted)' }}>Infelizmente este pedido foi cancelado. Entre em contato com o restaurante para mais informações.</p>
          </div>
        ) : (
          <div className="tracking-timeline">
            {STATUS_STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent   = index === currentStepIndex;
              return (
                <div key={step.id} className={`tracking-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="step-icon">{step.icon}</div>
                  <span className="step-label">{step.label}</span>
                  {index < STATUS_STEPS.length - 1 && <div className="step-line" />}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem' }}>Resumo dos Itens</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {order.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ color: 'var(--ember)', fontWeight: 600 }}>{item.quantity}x</span>
                    <span>{item.product.name}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--serif)' }}>R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)' }}>
              <span className="label">Total</span>
              <span style={{ fontSize: '1.8rem', fontFamily: 'var(--serif)', fontWeight: 600 }}>R$ {order.total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={20} color="var(--ember)" /> Entrega
            </h3>
            {order.user.address ? (
              <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {order.user.address}, {order.user.number} {order.user.complement ? `(${order.user.complement})` : ''}<br/>
                {order.user.neighborhood} - CEP {order.user.cep}
              </p>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Retirada no local.</p>
            )}
          </div>
        </div>

        {order.status === 'DELIVERED' && (
          <div style={{ marginTop: '2rem', padding: '2.5rem', background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '4px', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
            <Star size={40} color="var(--gold)" weight="fill" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', marginBottom: '0.5rem' }}>Como estava o pedido?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Sua avaliação nos ajuda muito!</p>
            <button onClick={() => setShowReviewModal(true)} className="btn-primary" style={{ margin: '0 auto' }}>
              Avaliar Agora
            </button>
          </div>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={() => {
              const orderSummary = order.items.map(item => `▪ ${item.quantity}x ${item.product.name} — ${fmt(item.price * item.quantity)}`).join('\n');
              const addressInfo = order.user.address
                ? `${order.user.address}, ${order.user.number || 'S/N'}${order.user.complement ? ` (${order.user.complement})` : ''} - ${order.user.neighborhood}\nCEP: ${order.user.cep}`
                : 'Retirada no local / Não informado';
              const text = `*NOVO PEDIDO — THE BURGUER* 🍔🔥\n\n*👤 Cliente:* ${order.user.name}\n*📱 Telefone:* ${order.user.phone || 'Não informado'}\n\n*🛒 Resumo do Pedido:*\n${orderSummary}\n\n*💰 Total:* ${fmt(order.total)}\n*💳 Pagamento:* ${paymentMethod}\n\n*📍 Endereço de Entrega:*\n${addressInfo}\n\n*Acompanhe seu pedido online:*\n${window.location.origin}/tracking/${order.id}`;
              window.open(buildWhatsAppUrl(text), '_blank');
            }}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', background: '#25D366', color: '#fff', border: 'none', padding: '1.2rem' }}
          >
            Enviar para o WhatsApp
          </button>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Caso a aba do WhatsApp não tenha aberto automaticamente, clique acima.
          </p>
        </div>
      </main>

      {showReviewModal && (
        <ReviewModal
          products={order.items.map(i => i.product)}
          onClose={() => setShowReviewModal(false)}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(86,207,135,0.2); }
          50%       { box-shadow: 0 0 0 6px rgba(86,207,135,0.05); }
        }
      `}</style>
    </div>
  );
};
