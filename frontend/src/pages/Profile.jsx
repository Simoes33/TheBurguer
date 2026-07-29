import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const inputStyle = {
  width: '100%', padding: '0.85rem 1rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '2px', color: 'var(--text)',
  fontFamily: 'var(--sans)', fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
const labelStyle = {
  display: 'block', marginBottom: '6px',
  fontSize: '0.7rem', letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
  fontFamily: 'var(--sans)', fontWeight: 500,
};

// Estilos responsivos: no desktop é um split-screen (imagem + formulário
// lado a lado); no mobile empilha (imagem vira um banner curto em cima,
// formulário ocupa a largura toda embaixo).
const PROFILE_STYLES = `
  .profile-page {
    min-height: 100vh;
    display: flex;
    background: var(--bg);
  }

  .profile-image-panel {
    flex: 1;
    background-image:
      linear-gradient(to right, rgba(8,8,8,0.1) 0%, rgba(8,8,8,0.75) 100%),
      url('https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=1200');
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: flex-end;
    padding: 4rem;
  }

  .profile-form-panel {
    width: 500px;
    flex-shrink: 0;
    background: var(--bg-2);
    border-left: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 4rem 3rem;
    overflow-y: auto;
  }

  .profile-row { display: flex; gap: 1rem; }

  @media (max-width: 900px) {
    .profile-page { flex-direction: column; min-height: auto; }
    .profile-image-panel { flex: none; height: 200px; padding: 1.5rem; }
    .profile-form-panel { width: 100%; border-left: none; border-top: 1px solid var(--border); padding: 2.5rem 1.5rem; overflow-y: visible; }
  }

  @media (max-width: 420px) {
    .profile-row { flex-direction: column; gap: 1.2rem; }
  }
`;

export const Profile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' ou 'payments'

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        cep: user.cep || '',
        address: user.address || '',
        number: user.number || '',
        complement: user.complement || '',
        neighborhood: user.neighborhood || ''
      });
    }
  }, [user]);

  // Autocomplete CEP
  useEffect(() => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            setFormData(prev => ({
              ...prev,
              address: data.logradouro || prev.address,
              neighborhood: data.bairro || prev.neighborhood,
              complement: data.complemento || prev.complement,
            }));
          }
        })
        .catch(() => {});
    }
  }, [formData.cep]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch(`/users/${user.id}`, formData);
      updateUser(data);
      toast.success('Perfil atualizado com sucesso!');
    } catch (err) {
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <style>{PROFILE_STYLES}</style>

      {/* Painel esquerdo — imagem */}
      <div className="profile-image-panel">
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            THE<span style={{ color: 'var(--ember)' }}>BURGUER</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontStyle: 'italic', fontFamily: 'var(--serif)', marginTop: '0.3rem' }}>
            "Seus detalhes com a gente."
          </p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="profile-form-panel">
        <div style={{ marginBottom: '2.5rem' }}>
          <span style={{ ...labelStyle, display: 'block', marginBottom: '0.6rem' }}>Área do Cliente</span>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', color: 'var(--text)', fontWeight: 600 }}>
            Minha Conta
          </h2>
        </div>

        {/* Tabs Navigation */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{ 
              paddingBottom: '1rem', 
              background: 'none', 
              border: 'none', 
              color: activeTab === 'profile' ? 'var(--ember)' : 'var(--text-muted)',
              borderBottom: activeTab === 'profile' ? '2px solid var(--ember)' : 'none',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Meus Dados
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            style={{ 
              paddingBottom: '1rem', 
              background: 'none', 
              border: 'none', 
              color: activeTab === 'payments' ? 'var(--ember)' : 'var(--text-muted)',
              borderBottom: activeTab === 'payments' ? '2px solid var(--ember)' : 'none',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Pagamentos
          </button>
        </div>

        {activeTab === 'profile' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={labelStyle}>E-mail (não editável)</label>
              <input type="email" disabled value={user.email} style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={labelStyle}>Nome Completo</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} style={inputStyle} placeholder="Seu nome" />
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} style={inputStyle} placeholder="(11) 99999-9999" />
            </div>

            <div className="profile-row">
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>CEP</label>
                <input type="text" name="cep" value={formData.cep} onChange={handleChange} style={inputStyle} placeholder="00000-000" />
              </div>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Bairro</label>
                <input type="text" name="neighborhood" value={formData.neighborhood} onChange={handleChange} style={inputStyle} placeholder="Seu Bairro" />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Rua / Avenida</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} style={inputStyle} placeholder="Av. Principal" />
            </div>

            <div className="profile-row">
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Número</label>
                <input type="text" name="number" value={formData.number} onChange={handleChange} style={inputStyle} placeholder="123" />
              </div>
              <div style={{ flex: 2 }}>
                <label style={labelStyle}>Complemento (Opcional)</label>
                <input type="text" name="complement" value={formData.complement} onChange={handleChange} style={inputStyle} placeholder="Apto 45" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ 
              padding: '1.5rem', 
              background: 'var(--bg-3)', 
              border: '1px dashed var(--border)',
              borderRadius: '4px',
              textAlign: 'center'
            }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Você ainda não tem cartões salvos.
              </p>
              <button className="btn-primary" style={{ fontSize: '0.7rem', padding: '0.6rem 1.2rem' }}>
                Adicionar Cartão
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text)', marginBottom: '1rem' }}>Segurança Bancária</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Nós usamos criptografia de ponta a ponta via Stripe. Seus dados de cartão nunca são salvos em nossos servidores.
              </p>
            </div>
          </div>
        )}

        <div style={{ marginTop: '3rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ← Voltar à loja
          </Link>
        </div>
      </div>
    </div>
  );
};