import React, { useContext, useState } from 'react';
import { ShoppingBag, Flame, List, X, Sun, Moon } from '@phosphor-icons/react';
import { useTheme } from '../contexts/ThemeContext';
import { useCart } from '../contexts/CartContext';
import { AuthContext } from '../contexts/AuthContext';
import { Link, NavLink, useNavigate } from 'react-router-dom';

export const Header = () => {
  const { toggleCart, totalItems } = useCart();
  const { user, signOut } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const closeMenu = () => setIsMobileMenuOpen(false);

  const handleSignOut = () => {
    signOut();
    closeMenu();
    navigate('/');
  };

  return (
    <>
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)} aria-label="Abrir menu">
            <List size={24} />
          </button>
          
          <Link to="/" className="logo" aria-label="The Burguer — página inicial" onClick={closeMenu}>
            <Flame weight="fill" color="var(--ember)" size={20} />
            THE<em>BURGUER</em>
          </Link>
        </div>

        <nav aria-label="Navegação principal">
          <ul className="nav-links">
            <li><a href="/#home">Início</a></li>
            <li><a href="/#menu">Cardápio</a></li>
            <li><a href="/#sobre">Sobre</a></li>
            {user?.role === 'ADMIN' || user?.role === 'EMPLOYEE' ? (
              <li><NavLink to="/admin">Painel</NavLink></li>
            ) : null}
            {user ? (
              <>
                <li><NavLink to="/profile">Meu Perfil</NavLink></li>
                <li><NavLink to="/my-orders">Meus Pedidos</NavLink></li>
                <li>
                  <button
                    onClick={handleSignOut}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--sans)', fontWeight: 500, padding: 0 }}
                  >
                    Sair
                  </button>
                </li>
              </>
            ) : (
              <li><NavLink to="/login">Login</NavLink></li>
            )}
          </ul>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <button 
            className="cart-btn" 
            onClick={toggleTheme} 
            aria-label="Alternar tema"
            style={{ padding: '0.55rem' }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button className="cart-btn" onClick={toggleCart} aria-label={`Carrinho: ${totalItems} itens`}>
            <ShoppingBag size={16} />
            <span className="cart-btn-label">Pedido</span>
            {totalItems > 0 && <span className="cart-count" aria-hidden="true">{totalItems}</span>}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      <div 
        className={`mobile-menu-overlay ${isMobileMenuOpen ? 'active' : ''}`} 
        onClick={closeMenu} 
      />
      <aside className={`mobile-drawer ${isMobileMenuOpen ? 'active' : ''}`}>
        <button className="close-menu" onClick={closeMenu} aria-label="Fechar menu">
          <X size={28} />
        </button>

        <nav aria-label="Navegação mobile">
          <ul className="mobile-nav-links">
            <li><a href="/#home" onClick={closeMenu}>Início</a></li>
            <li><a href="/#menu" onClick={closeMenu}>Cardápio</a></li>
            <li><a href="/#sobre" onClick={closeMenu}>Sobre</a></li>
            {user?.role === 'ADMIN' || user?.role === 'EMPLOYEE' ? (
              <li><NavLink to="/admin" onClick={closeMenu}>Painel Admin</NavLink></li>
            ) : null}
            {user ? (
              <>
                <li><NavLink to="/profile" onClick={closeMenu}>Meu Perfil</NavLink></li>
                <li><NavLink to="/my-orders" onClick={closeMenu}>Meus Pedidos</NavLink></li>
                <li><button onClick={handleSignOut}>Sair da Conta</button></li>
              </>
            ) : (
              <>
                <li><NavLink to="/login" onClick={closeMenu}>Login</NavLink></li>
                <li><NavLink to="/register" onClick={closeMenu}>Criar Conta</NavLink></li>
              </>
            )}
          </ul>
        </nav>
      </aside>
    </>
  );
};