import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Header } from '../components/Header';
import { CartDrawer } from '../components/CartDrawer';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import api from '../api/axios';
import { ArrowDown, MagnifyingGlass, X, Flame, InstagramLogo, WhatsappLogo, MapPin, Clock } from '@phosphor-icons/react';

const FALLBACK_PRODUCTS = [
  {
    id: '1',
    name: 'The Smash',
    description: 'O clássico irresistível com toque de goiabada.',
    ingredients: 'Pão de brioche + maionese de alho + carne + queijo + cebola crispy + ketchup de goiabada.',
    price: 19.00,
    priceDouble: 29.00,
    isburger: true,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
    category: { name: 'Burgers' },
  },
  {
    id: '2',
    name: 'The Salad',
    description: 'Frescor e sabor numa mordida só.',
    ingredients: 'Pão de brioche + maionese de alho + carne + queijo + alface americana + tomate + cebola rosa + cebola crispy + molho mostarda e mel.',
    price: 25.00,
    priceDouble: 32.00,
    isburger: true,
    imageUrl: 'https://images.unsplash.com/photo-1594212691516-069e8f8ddce8?auto=format&fit=crop&q=80&w=800',
    category: { name: 'Burgers' },
  },
  {
    id: '3',
    name: 'The Bacon',
    description: 'Para os amantes do bacon artesanal.',
    ingredients: 'Pão de brioche + maionese de alho + carne + queijo + geleia de bacon + cebola crispy + ketchup de goiabada.',
    price: 25.00,
    priceDouble: 32.00,
    isburger: true,
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=800',
    category: { name: 'Burgers' },
  },
  {
    id: '4',
    name: 'The Aloha',
    description: 'A combinação tropical que vai surpreender.',
    ingredients: 'Pão de brioche + maionese de alho + carnes + queijo + abacaxi + cebola crispy + melado de cana.',
    price: 25.00,
    priceDouble: 32.00,
    isburger: true,
    imageUrl: 'https://images.unsplash.com/photo-1615887023516-9dfbc8f117ce?auto=format&fit=crop&q=80&w=800',
    category: { name: 'Burgers' },
  },
  {
    id: '5',
    name: 'Batata Tradicional',
    description: 'Crocante por fora, macia por dentro.',
    ingredients: 'Batata frita crocante no ponto certo. Disponível em três tamanhos: P, M e G.',
    price: 9.00,
    priceMedium: 12.00,
    priceLarge: 15.00,
    hasSizes: true,
    imageUrl: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=800',
    category: { name: 'Batatas' },
  },
  {
    id: '6',
    name: 'Batata Cheddar & Farofa de Bacon',
    description: 'A mais pedida da casa, com muito cheddar.',
    ingredients: 'Batata frita coberta com cheddar cremoso e farofa de bacon crocante. Disponível em P, M e G.',
    price: 15.00,
    priceMedium: 19.00,
    priceLarge: 23.00,
    hasSizes: true,
    imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&q=80&w=800',
    category: { name: 'Batatas' },
  },
  {
    id: '7',
    name: 'Soda Italiana',
    description: 'Refrescante e exclusiva (300ml).',
    ingredients: 'Sabores disponíveis: Limão + Morango + Manjericão | Limão + Maçã Verde + Hortelã.',
    price: 9.00,
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800',
    category: { name: 'Bebidas' },
  },
  {
    id: '8',
    name: 'Refri / Suco / Mate',
    description: 'Bebidas clássicas para acompanhar.',
    ingredients: 'Refrigerante, suco natural ou mate gelado.',
    price: 7.00,
    imageUrl: 'https://images.unsplash.com/photo-1629203432180-71e9b18d3e5e?auto=format&fit=crop&q=80&w=800',
    category: { name: 'Bebidas' },
  },
  {
    id: '9',
    name: 'Guaracamp',
    description: 'O energético favorito da galera.',
    ingredients: 'Guaracamp gelado, 355ml.',
    price: 3.00,
    imageUrl: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&q=80&w=800',
    category: { name: 'Bebidas' },
  },
  {
    id: '10',
    name: 'Água',
    description: 'Hidratação garantida.',
    ingredients: 'Água mineral sem gás ou com gás.',
    price: 4.00,
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=800',
    category: { name: 'Bebidas' },
  },
];

export const Home = () => {
  const [products, setProducts]             = useState(FALLBACK_PRODUCTS);
  const [activeCategory, setActiveCategory]   = useState('Todos');
  const [searchQuery, setSearchQuery]       = useState('');
  const [isLoading, setIsLoading]           = useState(true);
  const [instaPosts, setInstaPosts]         = useState([]);
  const [isStoreOpen, setIsStoreOpen]         = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const video = document.querySelector('.hero-video');
    if (video) {
      video.play().catch(e => console.log("Autoplay blocked", e));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      api.get('/products').catch(() => ({ data: [] })),
      api.get('/settings/store-status').catch(() => ({ data: { isOpen: true } })),
      api.get('/instagram/feed').catch(() => ({ data: [] })),
    ]).then(([productsRes, statusRes, instaRes]) => {
      if (cancelled) return;
      setProducts(productsRes.data.length ? productsRes.data : FALLBACK_PRODUCTS);
      setIsStoreOpen(statusRes.data.isOpen);
      if (instaRes.data.length) setInstaPosts(instaRes.data);
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  const handleCategoryChange = useCallback((cat) => setActiveCategory(cat), []);

  const categories = useMemo(() => {
    return ['Todos', ...new Set(products.map(p => p.category?.name).filter(Boolean))];
  }, [products]);

  // Filtragem otimizada por Categoria + Busca Inteligente
  const filteredProducts = useMemo(() => {
    let result = products;

    if (activeCategory !== 'Todos') {
      result = result.filter(p => p.category?.name === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.ingredients && p.ingredients.toLowerCase().includes(q))
      );
    }

    return result;
  }, [products, activeCategory, searchQuery]);

  return (
    <>
      <Header />

      {!isStoreOpen && (
        <div style={{
          background: 'var(--ember)',
          color: '#fff',
          textAlign: 'center',
          padding: '0.8rem',
          fontSize: '0.85rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          position: 'sticky',
          top: '80px',
          zIndex: 990,
          boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
        }}>
          ⚠️ Loja Fechada no momento. Aceitamos apenas consultas ao cardápio.
        </div>
      )}

      <CartDrawer />

      <main>
        {/* ── HERO ────────────────────────── */}
        <section className="hero" id="home" aria-label="Destaque principal">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="hero-video"
            poster="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1920"
          >
            <source src="https://videos.pexels.com/video-files/34556299/14641961_1920_1080_24fps.mp4" type="video/mp4" />
          </video>
          <div className="hero-bg" />
          <div className="hero-content">
            <span className="hero-eyebrow label">Hamburgueria Artesanal</span>
            <h1>
              O sabor<br />
              da <em style={{ color: 'var(--ember)', fontStyle: 'italic' }}>brasa</em><br />
              na sua mesa.
            </h1>
            <p>
              Ingredientes selecionados, carnes nobres e receitas únicas.
              Uma experiência que vai além do prato.
            </p>
            <div className="hero-actions">
              <a href="#menu" className="btn-primary">Ver Cardápio</a>
            </div>
          </div>
          <div className="hero-scroll" aria-hidden="true">
            Scroll <ArrowDown size={14} />
          </div>
        </section>

        {/* ── ESTATÍSTICAS DA MARCA ─────────── */}
        <section className="stats-strip" aria-label="Nossos números">
          <div className="stat-item">
            <div className="stat-number">100%</div>
            <div className="stat-label">Carne Angus Certificada</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">+50k</div>
            <div className="stat-label">Burgers Entregues</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">4.9★</div>
            <div className="stat-label">Avaliação dos Clientes</div>
          </div>
        </section>

        {/* ── HORÁRIOS ────────────────────── */}
        <div role="complementary" aria-label="Horários de funcionamento" style={{ background: 'var(--bg-3)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '3.5rem 5%' }}>
          <div className="info-strip">
            {[
              { label: 'Segunda a Domingo', value: '19h às 23h' },
              { label: 'Siga nosso Instagram', value: '@the.burguer' },
              { label: 'Fale Conosco', value: '(21) 98507-5154' },
            ].map(({ label, value }) => (
              <div key={label} className="info-strip-item">
                <span className="label">{label}</span>
                <p>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CARDÁPIO ────────────────────── */}
        <section className="menu-section" id="menu" aria-label="Cardápio">
          <div className="section-header">
            <span className="label">Cardápio</span>
            <h2>Escolha o seu <em style={{ color: 'var(--ember)', fontStyle: 'italic' }}>favorito</em></h2>
            <p>Preparado na hora, com ingredientes frescos e muito amor pelo que fazemos.</p>
          </div>

          {/* 🔍 BARRA DE BUSCA INTELIGENTE */}
          <div className="search-bar-wrapper">
            <input
              type="text"
              className="search-bar"
              placeholder="Buscar por nome, ingrediente ou descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Buscar produtos no cardápio"
            />
            <MagnifyingGlass size={18} className="search-icon" />
            {searchQuery && (
              <button
                className="search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Tabs de categoria */}
          <div className="cat-tabs" role="tablist" aria-label="Filtrar por categoria">
            {categories.map(cat => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeCategory === cat}
                className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="products-grid" role="list">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="product-card skeleton" style={{ border: 'none' }}>
                  <div className="skeleton-card"></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <MagnifyingGlass size={48} />
              <h3>Nenhum produto encontrado</h3>
              <p>Não encontramos nenhum item correspondente a "{searchQuery}". Tente buscar por outros termos.</p>
              <button className="btn-outline" onClick={() => { setSearchQuery(''); setActiveCategory('Todos'); }}>
                Ver Todo o Cardápio
              </button>
            </div>
          ) : (
            <div className="products-grid" role="list">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={setSelectedProduct}
                  isBestseller={product.id === '1' || product.id === '3'}
                />
              ))}
            </div>
          )}
        </section>

        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}

        {/* ── INSTAGRAM FEED ─────────────── */}
        <section className="instagram-section" aria-label="Nosso Instagram">
          <div className="section-header">
            <span className="label">Social</span>
            <h2>Siga <em style={{ color: 'var(--ember)', fontStyle: 'italic' }}>@TheBurguer</em></h2>
            <p>Acompanhe nossos bastidores e novidades em tempo real.</p>
          </div>

          <div className="insta-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {(instaPosts.length ? instaPosts.slice(0, 6) : [
              'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=800&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?q=80&w=800&auto=format&fit=crop',
            ]).map((post, i) => {
              const url = typeof post === 'string' ? post : post.url;
              const permalink = typeof post === 'string' ? "https://www.instagram.com/hamburgueria.theburguer/" : post.permalink;
              return (
                <a key={i} href={permalink} target="_blank" rel="noopener noreferrer" className="insta-item">
                  <img src={url} alt={`Instagram post ${i + 1}`} loading="lazy" />
                  <div className="insta-overlay">
                    <span>Ver no Instagram</span>
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        {/* ── FOOTER MODERNO COMPLETO ──────────────────────── */}
        <footer className="footer-main">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="logo">
                <Flame weight="fill" color="var(--ember)" size={24} />
                THE<em style={{ color: 'var(--ember)', fontStyle: 'normal' }}>BURGUER</em>
              </div>
              <p>
                Hamburgueria artesanal comprometida com a excelência do fogo, trazendo a experiência autêntica do churrasco diretamente para o seu prato.
              </p>
            </div>

            <div className="footer-col">
              <h4>Navegação</h4>
              <ul className="footer-links">
                <li><a href="#home">Início</a></li>
                <li><a href="#menu">Cardápio</a></li>
                <li><a href="/login">Área do Cliente</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Atendimento</h4>
              <ul className="footer-links">
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={16} color="var(--gold)" /> Ter a Sáb: 12h - 00h
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={16} color="var(--gold)" /> Rio de Janeiro, RJ
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <WhatsappLogo size={16} color="#25D366" /> (21) 98507-5154
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {new Date().getFullYear()} The Burguer. Todos os direitos reservados.</p>
            <div className="social-links">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
                <InstagramLogo size={18} />
              </a>
              <a href="https://wa.me/5521985075154" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="WhatsApp">
                <WhatsappLogo size={18} />
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
};