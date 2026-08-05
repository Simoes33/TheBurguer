import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Flame, Package, CheckCircle, Clock, ShoppingCart, List, ChartBar, Storefront, TrendUp, Printer } from '@phosphor-icons/react';
import { ProductManagement } from '../components/ProductManagement';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useToast } from '../contexts/ToastContext';

const STATUS_MAP = {
  PENDING:   { label: 'Pendente',   color: '#BFA06A', bg: 'rgba(191,160,106,0.15)' },
  PREPARING: { label: 'Preparando', color: '#4EA8DE', bg: 'rgba(78,168,222,0.15)' },
  READY:     { label: 'Pronto',     color: '#56CF87', bg: 'rgba(86,207,135,0.15)' },
  OUT_FOR_DELIVERY: { label: 'Saiu para Entrega', color: 'var(--ember)', bg: 'rgba(200, 64, 26, 0.15)' },
  DELIVERED: { label: 'Entregue',   color: '#807870', bg: 'rgba(128,120,112,0.1)' },
  CANCELLED: { label: 'Cancelado',  color: '#C8401A', bg: 'rgba(200,64,26,0.12)' },
};

// Estilos globais do dashboard, incluindo os breakpoints responsivos.
// Mantido em uma única tag <style> para permitir media queries, que não
// são possíveis com objetos de estilo inline puros.
const ADMIN_DASHBOARD_STYLES = `
  .adb-header {
    background: var(--bg-2);
    border-bottom: 1px solid var(--border);
    padding: 1.2rem 5%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    flex-wrap: wrap;
    row-gap: 0.8rem;
  }
  .adb-header-left { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; row-gap: 0.6rem; }
  .adb-header-right { display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap; row-gap: 0.6rem; }
  .adb-store-toggle {
    display: flex; align-items: center; gap: 0.6rem;
    padding: 0.4rem 0.8rem; border-radius: 20px; cursor: pointer;
    font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
  }

  .adb-content { padding: 2.5rem 5%; }

  .adb-tabs {
    display: flex; gap: 1px; background: var(--border);
    margin-bottom: 2.5rem; width: fit-content; border: 1px solid var(--border);
    max-width: 100%; overflow-x: auto;
  }
  .adb-tab-btn {
    padding: 0.8rem 1.8rem; border: none; cursor: pointer;
    font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;
    display: flex; align-items: center; gap: 0.6rem; transition: all 0.2s; white-space: nowrap;
  }

  .adb-stats-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px;
    margin-bottom: 2.5rem; border: 1px solid var(--border);
  }
  .adb-stats-grid > div { background: var(--bg-2); padding: 1.5rem 1.8rem; border-right: 1px solid var(--border); }
  .adb-stats-value { font-family: var(--serif); font-size: 2.2rem; font-weight: 600; }

  .adb-report-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
  .adb-report-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }

  .adb-table-wrapper { overflow-x: auto; }
  .adb-orders-cards { display: none; flex-direction: column; gap: 1rem; padding: 1rem; }
  .adb-order-card { background: var(--bg-3); border: 1px solid var(--border); border-radius: 4px; padding: 1rem; display: flex; flex-direction: column; gap: 0.8rem; }
  .adb-order-card-section { border-top: 1px solid var(--border); padding-top: 0.6rem; }

  .adb-action-btn {
    padding: 0.4rem 0.8rem; font-size: 0.72rem; letter-spacing: 0.08em;
    text-transform: uppercase; cursor: pointer; border-radius: 2px;
    font-family: var(--sans); white-space: nowrap;
  }

  /* Tablets (portrait) e telas médias */
  @media (max-width: 900px) {
    .adb-stats-grid { grid-template-columns: repeat(2, 1fr); }
    .adb-report-stats-grid { grid-template-columns: repeat(2, 1fr); }
    .adb-report-grid { grid-template-columns: 1fr; }
  }

  /* Tablets menores / celulares em modo paisagem */
  @media (max-width: 768px) {
    .adb-header-right {
    width: 100%;
    justify-content: space-between;
    gap: .8rem;
}

.adb-view-store-link {
    display: inline-flex;
    align-items: center;
    white-space: nowrap;
}
    .adb-content { padding: 1.5rem 4%; }
    .adb-header-left { gap: 1rem; }
    .adb-tabs { width: 100%; }
    .adb-tab-btn { flex: 1; padding: 0.7rem 0.6rem; font-size: 0.66rem; gap: 0.4rem; justify-content: center; }
  }

  /* Smartphones */
  @media (max-width: 640px) {
    .adb-table-wrapper { display: none; }
    .adb-orders-cards { display: flex; }
    .adb-stats-value { font-size: 1.7rem; }
  }

  @media (max-width: 420px) {
    .adb-stats-grid { grid-template-columns: 1fr; }
    .adb-report-stats-grid { grid-template-columns: 1fr; }
    .adb-tab-btn span.adb-tab-label { display: none; }
  }
`;

const StatCard = ({ label, value, icon }) => (
  <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}
      {icon}
    </div>
    <div style={{ fontSize: '1.8rem', fontWeight: 600, fontFamily: 'var(--serif)', color: 'var(--text)' }}>
      {value}
    </div>
  </div>
);

const OrderStatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.PENDING;
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.3rem 0.8rem',
      borderRadius: '2px',
      fontSize: '0.72rem',
      letterSpacing: '0.08em',
      fontWeight: 600,
      textTransform: 'uppercase',
      color: s.color,
      background: s.bg,
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  );
};

// Botões de ação, compartilhados entre a linha da tabela (desktop/tablet)
// e o card de pedido (mobile), para não duplicar a lógica de status.
const OrderActions = ({ order, onUpdateStatus }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
    {order.status === 'PENDING' && (
      <button
        onClick={() => onUpdateStatus(order.id, 'PREPARING')}
        className="adb-action-btn"
        style={{ background: 'rgba(78,168,222,0.15)', color: '#4EA8DE', border: '1px solid rgba(78,168,222,0.3)' }}
      >
        Preparar
      </button>
    )}
    {order.status === 'PREPARING' && (
      <button
        onClick={() => onUpdateStatus(order.id, 'READY')}
        className="adb-action-btn"
        style={{ background: 'rgba(86,207,135,0.15)', color: '#56CF87', border: '1px solid rgba(86,207,135,0.3)' }}
      >
        Pronto
      </button>
    )}
    {order.status === 'READY' && (
      <button
        onClick={() => onUpdateStatus(order.id, 'OUT_FOR_DELIVERY')}
        className="adb-action-btn"
        style={{ background: 'rgba(200, 64, 26, 0.15)', color: 'var(--ember)', border: '1px solid rgba(200, 64, 26, 0.3)' }}
      >
        Sair p/ Entrega
      </button>
    )}
    {order.status === 'OUT_FOR_DELIVERY' && (
      <button
        onClick={() => onUpdateStatus(order.id, 'DELIVERED')}
        className="adb-action-btn"
        style={{ background: 'rgba(128,120,112,0.15)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
      >
        Entregue
      </button>
    )}
    {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
      <button
        onClick={() => {
          if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
            onUpdateStatus(order.id, 'CANCELLED');
          }
        }}
        className="adb-action-btn"
        style={{ background: 'rgba(200,64,26,0.12)', color: '#C8401A', border: '1px solid rgba(200,64,26,0.25)' }}
      >
        Cancelar
      </button>
    )}
  </div>
);

// Card de pedido usado apenas em telas de smartphone, no lugar da tabela.
const OrderCard = ({ order, onUpdateStatus }) => (
  <div className="adb-order-card">
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
      <code style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px' }}>
        #{order.id.slice(0, 8)}
      </code>
      <OrderStatusBadge status={order.status} />
    </div>

    <div>
      <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>{order.user?.name || '—'}</div>
      {order.user?.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.user.phone}</div>}
      {order.user?.address && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
          {order.user.address}, {order.user.number}
          {order.user.complement ? ` - ${order.user.complement}` : ''}<br />
          {order.user.neighborhood} — CEP {order.user.cep}
        </div>
      )}
    </div>

    <div className="adb-order-card-section" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {order.items?.map(item => (
        <div key={item.id}>
          <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 500 }}>
            {item.quantity}× {item.product?.name}
          </div>
          {item.observation && (
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--gold)',
              background: 'rgba(191,160,106,0.1)',
              padding: '2px 6px',
              borderRadius: '2px',
              marginTop: '2px',
              display: 'inline-block',
              fontStyle: 'italic'
            }}>
              Obs: {item.observation}
            </div>
          )}
        </div>
      ))}
    </div>

    <div className="adb-order-card-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
      <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--text)' }}>
        R$ {Number(order.total).toFixed(2).replace('.', ',')}
      </span>
    </div>

    <OrderActions order={order} onUpdateStatus={onUpdateStatus} />
  </div>
);

const th = { padding: '0.8rem 1rem', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontWeight: 500 };
const td = { padding: '1.1rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'top' };

export const AdminDashboard = () => {
  const { user, signOut } = useContext(AuthContext);
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'products' ou 'stats'
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  const prevOrdersCount = useRef(0);
  const notificationSound = useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));

  const fetchData = async () => {
    try {
      const [ordersRes, statusRes] = await Promise.all([
        api.get('/orders'),
        api.get('/settings/store-status')
      ]);
      setOrders(ordersRes.data);
      setIsStoreOpen(statusRes.data.isOpen);
      prevOrdersCount.current = ordersRes.data.length;
    } catch (err) {
      console.error('Erro ao carregar dados', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats/dashboard');
      setDashboardData(res.data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas', err);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'EMPLOYEE')) {
      fetchData();
      if (activeTab === 'stats') fetchStats();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (!user) return;

    const token = sessionStorage.getItem('@TheBurguer:token');
    let sseReader = null;
    let pollingInterval = null;

    // ── SSE: recebe updates instantâneos de status de qualquer pedido ──────
    const connectSse = async () => {
      if (!token) return;
      try {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/sse/admin/orders`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        });
        if (!response.ok || !response.body) return;

        sseReader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await sseReader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n').filter(l => l.startsWith('data:'));
          for (const line of lines) {
            try {
              const payload = JSON.parse(line.replace('data:', '').trim());
              // Atualiza o status do pedido diretamente no estado local (sem refetch)
              setOrders(prev => prev.map(o =>
                o.id === payload.orderId ? { ...o, status: payload.status } : o
              ));
            } catch { /* ignora chunk inválido */ }
          }
        }
      } catch { /* SSE desconectou, polling cobre */ }
    };

    connectSse();

    // ── Polling: garante novos pedidos e resiliência (a cada 15s) ──────────
    pollingInterval = setInterval(async () => {
      try {
        const res = await api.get('/orders');
        const newCount = res.data.length;
        if (newCount > prevOrdersCount.current) {
          notificationSound.current.play().catch(() => {});
        }
        prevOrdersCount.current = newCount;
        setOrders(res.data);
      } catch { /* falha silenciosa */ }
    }, 15000);

    return () => {
      try { sseReader?.cancel(); } catch { /* ignora */ }
      clearInterval(pollingInterval);
    };
  }, [user]);

  if (!user || (user.role !== 'ADMIN' && user.role !== 'EMPLOYEE')) {
    return <Navigate to="/login" />;
  }

  const handleToggleStore = async () => {
    try {
      const newStatus = !isStoreOpen;
      await api.post('/settings/store-status', { isOpen: newStatus });
      setIsStoreOpen(newStatus);
      toast.success(`Loja ${newStatus ? 'aberta' : 'fechada'} com sucesso.`);
    } catch {
      toast.error('Erro ao alterar status da loja.');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/orders/${id}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      toast.success('Status do pedido atualizado.');
    } catch {
      toast.error('Erro ao atualizar status.');
    }
  };

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'PENDING').length,
    preparing: orders.filter(o => o.status === 'PREPARING').length,
    ready: orders.filter(o => o.status === 'READY').length,
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      <style>{ADMIN_DASHBOARD_STYLES}</style>

      {/* Sidebar / Topbar */}
      <header className="adb-header">
        <div className="adb-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Flame weight="fill" color="var(--ember)" size={20} />
            <span style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              THE<span style={{ color: 'var(--ember)' }}>BURGUER</span>
            </span>
          </div>

          <button
            onClick={handleToggleStore}
            className="adb-store-toggle"
            style={{
              background: isStoreOpen ? 'rgba(86,207,135,0.1)' : 'rgba(200,64,26,0.1)',
              border: `1px solid ${isStoreOpen ? '#56CF87' : '#C8401A'}`,
              color: isStoreOpen ? '#56CF87' : '#C8401A',
            }}
          >
            <Storefront size={16} weight={isStoreOpen ? 'fill' : 'regular'} />
            Loja {isStoreOpen ? 'Aberta' : 'Fechada'}
          </button>
        </div>
        <div className="adb-header-right">
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {user.name} <span style={{ color: 'var(--ember)', marginLeft: '4px' }}>({user.role})</span>
          </span>
          <Link to="/" className="adb-view-store-link" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Ver Loja
          </Link>
          <button onClick={signOut} style={{
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-muted)', padding: '0.45rem 1rem',
            fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'var(--sans)', borderRadius: '2px',
            transition: 'all 0.2s'
          }}>
            Sair
          </button>
        </div>
      </header>

      <div className="adb-content">
        {/* Nav de Abas */}
        <div className="adb-tabs">
          <button
            onClick={() => setActiveTab('orders')}
            className="adb-tab-btn"
            style={{
              background: activeTab === 'orders' ? 'var(--bg-2)' : 'var(--bg-3)',
              color: activeTab === 'orders' ? 'var(--ember)' : 'var(--text-muted)',
            }}
          >
            <ShoppingCart size={18} /> <span className="adb-tab-label">Pedidos</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className="adb-tab-btn"
            style={{
              background: activeTab === 'products' ? 'var(--bg-2)' : 'var(--bg-3)',
              color: activeTab === 'products' ? 'var(--ember)' : 'var(--text-muted)',
            }}
          >
            <List size={18} /> <span className="adb-tab-label">Produtos</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className="adb-tab-btn"
            style={{
              background: activeTab === 'stats' ? 'var(--bg-2)' : 'var(--bg-3)',
              color: activeTab === 'stats' ? 'var(--ember)' : 'var(--text-muted)',
            }}
          >
            <ChartBar size={18} /> <span className="adb-tab-label">Relatórios</span>
          </button>
          <button
            onClick={() => setActiveTab('printer')}
            className="adb-tab-btn"
            style={{
              background: activeTab === 'printer' ? 'var(--bg-2)' : 'var(--bg-3)',
              color: activeTab === 'printer' ? 'var(--ember)' : 'var(--text-muted)',
            }}
          >
            <Printer size={18} /> <span className="adb-tab-label">Impressão</span>
          </button>
        </div>

        {activeTab === 'products' ? (
          <ProductManagement />
        ) : activeTab === 'printer' ? (
          <div style={{ animation: 'fadeIn 0.3s ease', background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '2.5rem', borderRadius: '4px', maxWidth: '800px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'rgba(200, 64, 26, 0.15)', padding: '1rem', borderRadius: '8px', color: 'var(--ember)' }}>
                <Printer size={32} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', color: 'var(--text)', margin: 0 }}>Print Agent — Impressão Automática</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.3rem 0 0 0' }}>Aplicativo Android para conectar impressoras térmicas Bluetooth (Knup KP-1025) ao sistema.</p>
              </div>
            </div>

            <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '1.5rem', borderRadius: '4px', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ember)', marginTop: 0, marginBottom: '1rem' }}>Instalação do Aplicativo Android</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
                Clique no botão abaixo para baixar o instalador oficial do <strong>Print Agent (.APK)</strong> diretamente no tablet ou celular Android da cozinha.
              </p>

              <a
                href="/downloads/print-agent.apk"
                download="the-burguer-print-agent.apk"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  background: 'var(--ember)',
                  color: '#ffffff',
                  padding: '1rem 2rem',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  textDecoration: 'none',
                  boxShadow: '0 4px 15px rgba(200,64,26,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                <Printer size={22} />
                Baixar Print Agent (Arquivo APK)
              </a>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text)', marginBottom: '1rem' }}>Passos para Configuração na Loja:</h4>
              <ol style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.8', paddingLeft: '1.2rem', margin: 0 }}>
                <li>Abra este painel no tablet ou celular Android da loja e clique no botão de download acima.</li>
                <li>Abra o arquivo <code>the-burguer-print-agent.apk</code> baixado e confirme a instalação (permita fontes desconhecidas se solicitado).</li>
                <li>Ligue a impressora <strong>Knup KP-1025</strong> e pareie via Bluetooth no Android (PIN: <code>0000</code> ou <code>1234</code>).</li>
                <li>Abra o app <strong>Print Agent</strong>, acesse as configurações ⚙️, selecione a Knup KP-1025 e salve.</li>
                <li>Pronto! Todos os novos pedidos serão impressos automaticamente assim que realizados.</li>
              </ol>
            </div>
          </div>
        ) : activeTab === 'stats' ? (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {!dashboardData ? (
              <div style={{ color: 'var(--text-muted)' }}>Carregando estatísticas...</div>
            ) : (
              <>
                <div className="adb-report-stats-grid">
                  <StatCard label="Faturamento Total" value={`R$ ${dashboardData.overview.totalRevenue.toFixed(2)}`} icon={<TrendUp color="#56CF87" />} />
                  <StatCard label="Vendas Hoje" value={`R$ ${dashboardData.overview.todayRevenue.toFixed(2)}`} icon={<TrendUp color="#56CF87" />} />
                  <StatCard label="Total Pedidos" value={dashboardData.overview.totalOrders} icon={<Package color="var(--gold)" />} />
                  <StatCard label="Pedidos Hoje" value={dashboardData.overview.todayOrders} icon={<Clock color="#4EA8DE" />} />
                </div>

                <div className="adb-report-grid">
                  <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--serif)' }}>Faturamento (Últimos 7 dias)</h3>
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardData.salesChart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                          <Tooltip
                            contentStyle={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '4px' }}
                            itemStyle={{ color: 'var(--gold)' }}
                          />
                          <Line type="monotone" dataKey="revenue" stroke="var(--gold)" strokeWidth={3} dot={{ r: 4, fill: 'var(--gold)' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--serif)' }}>Top 5 Produtos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {dashboardData.popularProducts.map((p, idx) => (
                        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{idx + 1}. {p.name}</span>
                          <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{p.quantity} un.</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="adb-stats-grid">
              {[
                { label: 'Total de Pedidos', value: stats.total, icon: <Package size={18} /> },
                { label: 'Pendentes',        value: stats.pending,  icon: <Clock size={18} />, color: '#BFA06A' },
                { label: 'Preparando',       value: stats.preparing, icon: <Flame size={18} />, color: '#4EA8DE' },
                { label: 'Prontos',          value: stats.ready,  icon: <CheckCircle size={18} />, color: '#56CF87' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <span style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{s.label}</span>
                    <span style={{ color: s.color || 'var(--text-muted)' }}>{s.icon}</span>
                  </div>
                  <span className="adb-stats-value" style={{ color: s.color || 'var(--text)' }}>{s.value}</span>
                </div>
              ))}
            </div>

            {/* Pedidos: tabela em telas maiores, cards em smartphones */}
            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
              <div style={{ padding: '1.5rem 1.8rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--text)', fontWeight: 600 }}>
                  Pedidos Recentes
                </h3>
              </div>

              <div className="adb-table-wrapper">
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                  <thead>
                    <tr>
                      <th style={th}>ID</th>
                      <th style={th}>Cliente / Endereço</th>
                      <th style={th}>Itens</th>
                      <th style={th}>Total</th>
                      <th style={th}>Status</th>
                      <th style={th}>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="6" style={{ ...td, textAlign: 'center', color: 'var(--text-muted)' }}>Carregando...</td></tr>
                    ) : orders.length === 0 ? (
                      <tr><td colSpan="6" style={{ ...td, textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhum pedido registrado ainda.</td></tr>
                    ) : orders.map(order => (
                      <tr key={order.id} style={{ transition: 'background 0.2s' }}>
                        <td style={td}>
                          <code style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'var(--bg-3)', padding: '2px 6px', borderRadius: '2px' }}>
                            #{order.id.slice(0, 8)}
                          </code>
                        </td>
                        <td style={td}>
                          <div style={{ fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>{order.user?.name || '—'}</div>
                          {order.user?.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.user.phone}</div>}
                          {order.user?.address && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                              {order.user.address}, {order.user.number}
                              {order.user.complement ? ` - ${order.user.complement}` : ''}<br />
                              {order.user.neighborhood} — CEP {order.user.cep}
                            </div>
                          )}
                        </td>
                        <td style={td}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {order.items?.map(item => (
                              <div key={item.id} style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 500 }}>
                                  {item.quantity}× {item.product?.name}
                                </div>
                                {item.observation && (
                                  <div style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--gold)',
                                    background: 'rgba(191,160,106,0.1)',
                                    padding: '2px 6px',
                                    borderRadius: '2px',
                                    marginTop: '2px',
                                    display: 'inline-block',
                                    fontStyle: 'italic'
                                  }}>
                                    Obs: {item.observation}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={td}>
                          <span style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--text)' }}>
                            R$ {Number(order.total).toFixed(2).replace('.', ',')}
                          </span>
                        </td>
                        <td style={td}>
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td style={td}>
                          <OrderActions order={order} onUpdateStatus={handleUpdateStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="adb-orders-cards">
                {loading ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Carregando...</div>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhum pedido registrado ainda.</div>
                ) : orders.map(order => (
                  <OrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};