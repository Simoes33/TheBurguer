import React, { useContext, useEffect, useState, useRef } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { Flame, Package, CheckCircle, Clock, ShoppingCart, List, ChartBar, Storefront, TrendUp } from '@phosphor-icons/react';
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
      {/* Sidebar / Topbar */}
      <header style={{
        background: 'var(--bg-2)',
        borderBottom: '1px solid var(--border)',
        padding: '1.2rem 5%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Flame weight="fill" color="var(--ember)" size={20} />
            <span style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              THE<span style={{ color: 'var(--ember)' }}>BURGUER</span>
            </span>
          </div>

          <button 
            onClick={handleToggleStore}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: isStoreOpen ? 'rgba(86,207,135,0.1)' : 'rgba(200,64,26,0.1)',
              border: `1px solid ${isStoreOpen ? '#56CF87' : '#C8401A'}`,
              color: isStoreOpen ? '#56CF87' : '#C8401A',
              padding: '0.4rem 0.8rem',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            <Storefront size={16} weight={isStoreOpen ? 'fill' : 'regular'} />
            Loja {isStoreOpen ? 'Aberta' : 'Fechada'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            {user.name} <span style={{ color: 'var(--ember)', marginLeft: '4px' }}>({user.role})</span>
          </span>
          <Link to="/" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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

      <div style={{ padding: '2.5rem 5%' }}>
        {/* Nav de Abas */}
        <div style={{ display: 'flex', gap: '1px', background: 'var(--border)', marginBottom: '2.5rem', width: 'fit-content', border: '1px solid var(--border)' }}>
          <button 
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '0.8rem 1.8rem',
              background: activeTab === 'orders' ? 'var(--bg-2)' : 'var(--bg-3)',
              color: activeTab === 'orders' ? 'var(--ember)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              transition: 'all 0.2s'
            }}
          >
            <ShoppingCart size={18} /> Pedidos
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            style={{
              padding: '0.8rem 1.8rem',
              background: activeTab === 'products' ? 'var(--bg-2)' : 'var(--bg-3)',
              color: activeTab === 'products' ? 'var(--ember)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              transition: 'all 0.2s'
            }}
          >
            <List size={18} /> Produtos
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '0.8rem 1.8rem',
              background: activeTab === 'stats' ? 'var(--bg-2)' : 'var(--bg-3)',
              color: activeTab === 'stats' ? 'var(--ember)' : 'var(--text-muted)',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              transition: 'all 0.2s'
            }}
          >
            <ChartBar size={18} /> Relatórios
          </button>
        </div>

        {activeTab === 'products' ? (
          <ProductManagement />
        ) : activeTab === 'stats' ? (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {!dashboardData ? (
              <div style={{ color: 'var(--text-muted)' }}>Carregando estatísticas...</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                  <StatCard label="Faturamento Total" value={`R$ ${dashboardData.overview.totalRevenue.toFixed(2)}`} icon={<TrendUp color="#56CF87" />} />
                  <StatCard label="Vendas Hoje" value={`R$ ${dashboardData.overview.todayRevenue.toFixed(2)}`} icon={<TrendUp color="#56CF87" />} />
                  <StatCard label="Total Pedidos" value={dashboardData.overview.totalOrders} icon={<Package color="var(--gold)" />} />
                  <StatCard label="Pedidos Hoje" value={dashboardData.overview.todayOrders} icon={<Clock color="#4EA8DE" />} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', marginBottom: '2.5rem', border: '1px solid var(--border)' }}>
          {[
            { label: 'Total de Pedidos', value: stats.total, icon: <Package size={18} /> },
            { label: 'Pendentes',        value: stats.pending,  icon: <Clock size={18} />, color: '#BFA06A' },
            { label: 'Preparando',       value: stats.preparing, icon: <Flame size={18} />, color: '#4EA8DE' },
            { label: 'Prontos',          value: stats.ready,  icon: <CheckCircle size={18} />, color: '#56CF87' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--bg-2)', padding: '1.5rem 1.8rem',
              borderRight: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{s.label}</span>
                <span style={{ color: s.color || 'var(--text-muted)' }}>{s.icon}</span>
              </div>
              <span style={{ fontFamily: 'var(--serif)', fontSize: '2.2rem', color: s.color || 'var(--text)', fontWeight: 600 }}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Tabela */}
        <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
          <div style={{ padding: '1.5rem 1.8rem', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', color: 'var(--text)', fontWeight: 600 }}>
              Pedidos Recentes
            </h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
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
                ) : orders.map(order => {
                  const s = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
                  return (
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
                        }}>
                          {s.label}
                        </span>
                      </td>
                      <td style={td}>
                        {order.status === 'PENDING' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'PREPARING')} style={{
                            background: 'rgba(78,168,222,0.15)', color: '#4EA8DE', border: '1px solid rgba(78,168,222,0.3)',
                            padding: '0.4rem 0.8rem', fontSize: '0.72rem', letterSpacing: '0.08em',
                            textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px', fontFamily: 'var(--sans)',
                          }}>
                            Preparar
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'READY')} style={{
                            background: 'rgba(86,207,135,0.15)', color: '#56CF87', border: '1px solid rgba(86,207,135,0.3)',
                            padding: '0.4rem 0.8rem', fontSize: '0.72rem', letterSpacing: '0.08em',
                            textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px', fontFamily: 'var(--sans)',
                          }}>
                            Pronto
                          </button>
                        )}
                        {order.status === 'READY' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'OUT_FOR_DELIVERY')} style={{
                            background: 'rgba(200, 64, 26, 0.15)', color: 'var(--ember)', border: '1px solid rgba(200, 64, 26, 0.3)',
                            padding: '0.4rem 0.8rem', fontSize: '0.72rem', letterSpacing: '0.08em',
                            textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px', fontFamily: 'var(--sans)',
                          }}>
                            Sair p/ Entrega
                          </button>
                        )}
                        {order.status === 'OUT_FOR_DELIVERY' && (
                          <button onClick={() => handleUpdateStatus(order.id, 'DELIVERED')} style={{
                            background: 'rgba(128,120,112,0.15)', color: 'var(--text-muted)', border: '1px solid var(--border)',
                            padding: '0.4rem 0.8rem', fontSize: '0.72rem', letterSpacing: '0.08em',
                            textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px', fontFamily: 'var(--sans)',
                          }}>
                            Entregue
                          </button>
                        )}
                        {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                          <button onClick={() => {
                            if (window.confirm('Tem certeza que deseja cancelar este pedido?')) {
                              handleUpdateStatus(order.id, 'CANCELLED');
                            }
                          }} style={{
                            background: 'rgba(200,64,26,0.12)', color: '#C8401A', border: '1px solid rgba(200,64,26,0.25)',
                            padding: '0.4rem 0.8rem', fontSize: '0.72rem', letterSpacing: '0.08em',
                            textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px', fontFamily: 'var(--sans)',
                            marginLeft: '0.5rem'
                          }}>
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
};
