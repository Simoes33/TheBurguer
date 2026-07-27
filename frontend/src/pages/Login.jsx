import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { GoogleLogo } from '@phosphor-icons/react';

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

export const Login = () => {
  const { signIn, signInWithGoogle, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn(email, password);
    setLoading(false);
    if (result.success) {
      const role = result.user?.role;
      navigate(role === 'ADMIN' || role === 'EMPLOYEE' ? '/admin' : '/', { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>
      {/* Painel esquerdo — imagem */}
      <div style={{
        flex: 1,
        backgroundImage: [
          'linear-gradient(to right, rgba(8,8,8,0.1) 0%, rgba(8,8,8,0.75) 100%)',
          "url('https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&q=80&w=1200')",
        ].join(', '),
        backgroundSize: 'cover', backgroundPosition: 'center',
        display: 'flex', alignItems: 'flex-end', padding: '4rem',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            THE<span style={{ color: 'var(--ember)' }}>BURGUER</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontStyle: 'italic', fontFamily: 'var(--serif)', marginTop: '0.3rem' }}>
            "Não apague nosso fogo."
          </p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div style={{
        width: '420px', flexShrink: 0,
        background: 'var(--bg-2)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem 3rem',
      }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <span style={{ ...labelStyle, display: 'block', marginBottom: '0.6rem' }}>Área restrita</span>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', color: 'var(--text)', fontWeight: 600 }}>
            Entre na sua conta
          </h2>
        </div>

        {error && (
          <div style={{ background: 'rgba(200,64,26,0.12)', border: '1px solid rgba(200,64,26,0.35)', color: '#E8A090', padding: '0.8rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', borderRadius: '2px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={labelStyle}>E-mail</label>
            <input type="email" required autoComplete="email"
              value={email} onChange={e => { setError(''); setEmail(e.target.value); }}
              style={inputStyle} placeholder="seu@email.com" />
          </div>
          <div>
            <label style={labelStyle}>Senha</label>
            <input type="password" required autoComplete="current-password"
              value={password} onChange={e => { setError(''); setPassword(e.target.value); }}
              style={inputStyle} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.4rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Não tem conta?{' '}
            <Link to="/register" style={{ color: 'var(--ember)', fontWeight: 500 }}>Cadastre-se</Link>
          </p>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
            <span style={{ padding: '0 1rem', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>ou</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }}></div>
          </div>

          <button 
            type="button"
            onClick={signInWithGoogle}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.8rem',
              padding: '0.85rem',
              background: 'var(--bg-3)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              color: 'var(--text)',
              fontFamily: 'var(--sans)',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.background = 'var(--surface)'}
            onMouseOut={e => e.currentTarget.style.background = 'var(--bg-3)'}
          >
            <GoogleLogo size={20} weight="bold" />
            Entrar com Google
          </button>
        </form>

        <div style={{ marginTop: 'auto', paddingTop: '3rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ← Voltar à loja
          </Link>
        </div>
      </div>
    </div>
  );
};
