import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Navigate, useNavigate, Link } from 'react-router-dom';

const inputStyle = {
  width: '100%', padding: '0.8rem 1rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '2px', color: 'var(--text)',
  fontFamily: 'var(--sans)', fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box',
};
const labelStyle = {
  display: 'block', marginBottom: '6px',
  fontSize: '0.7rem', letterSpacing: '0.12em',
  textTransform: 'uppercase', color: 'var(--text-muted)',
  fontFamily: 'var(--sans)', fontWeight: 500,
};
const Field = ({ label, children }) => (
  <div><label style={labelStyle}>{label}</label>{children}</div>
);

export const Register = () => {
  const { signUp, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    phone: '', cep: '', address: '',
    number: '', complement: '', neighborhood: '',
  });

  if (user) return <Navigate to="/" replace />;

  const formatCEP = (value) => {
    return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
  };

  const formatPhone = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2')
      .slice(0, 15);
  };

  const handleChange = (e) => {
    setError('');
    let { name, value } = e.target;
    if (name === 'cep') value = formatCEP(value);
    if (name === 'phone') value = formatPhone(value);
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Preenchimento automático por CEP
  const handleCepBlur = async () => {
    const raw = form.cep.replace(/\D/g, '');
    if (raw.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          address:      data.logradouro  || prev.address,
          neighborhood: data.bairro      || prev.neighborhood,
        }));
      }
    } catch { /* usuário preenche manualmente */ }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Remove campos vazios — o backend não exige address/phone
    const payload = Object.fromEntries(Object.entries(form).filter(([, v]) => v.trim() !== ''));
    const result = await signUp(payload);
    setLoading(false);
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ ...labelStyle, display: 'block', marginBottom: '0.5rem' }}>Novo cliente</span>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', color: 'var(--text)' }}>Crie sua conta</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem', fontWeight: 300 }}>
            Para entregarmos seu pedido, precisamos de alguns dados.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(200,64,26,0.12)', border: '1px solid rgba(200,64,26,0.35)', color: '#E8A090', padding: '0.8rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', borderRadius: '2px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Dados pessoais */}
          <div className="form-row-2">
            <Field label="Nome Completo *">
              <input required name="name" value={form.name} onChange={handleChange}
                autoComplete="name" style={inputStyle} placeholder="João Silva" />
            </Field>
            <Field label="Telefone">
              <input name="phone" value={form.phone} onChange={handleChange}
                autoComplete="tel" style={inputStyle} placeholder="(11) 9 9999-9999" />
            </Field>
          </div>

          <div className="form-row-2">
            <Field label="E-mail *">
              <input required type="email" name="email" value={form.email} onChange={handleChange}
                autoComplete="email" style={inputStyle} placeholder="seu@email.com" />
            </Field>
            <Field label="Senha * (mín. 6 caracteres)">
              <input required type="password" name="password" minLength={6} value={form.password} onChange={handleChange}
                autoComplete="new-password" style={inputStyle} placeholder="••••••••" />
            </Field>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '0.25rem 0' }} />
          <p style={{ ...labelStyle, marginBottom: 0 }}>Endereço de entrega</p>

          <Field label="CEP">
            <input name="cep" value={form.cep} onChange={handleChange} onBlur={handleCepBlur}
              autoComplete="postal-code" style={inputStyle} placeholder="00000-000" maxLength={9} />
          </Field>

          <div className="form-row-address">
            <Field label="Rua">
              <input name="address" value={form.address} onChange={handleChange}
                style={inputStyle} placeholder="Preenchido pelo CEP" />
            </Field>
            <Field label="Número">
              <input name="number" value={form.number} onChange={handleChange}
                style={inputStyle} placeholder="123" />
            </Field>
          </div>

          <div className="form-row-2">
            <Field label="Complemento">
              <input name="complement" value={form.complement} onChange={handleChange}
                style={inputStyle} placeholder="Apto, Bloco…" />
            </Field>
            <Field label="Bairro">
              <input name="neighborhood" value={form.neighborhood} onChange={handleChange}
                style={inputStyle} placeholder="Preenchido pelo CEP" />
            </Field>
          </div>

          <button type="submit" disabled={loading} className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.8rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Criando conta…' : 'Cadastrar e Continuar'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Já tem conta?{' '}
            <Link to="/login" style={{ color: 'var(--ember)', fontWeight: 500 }}>Faça login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};