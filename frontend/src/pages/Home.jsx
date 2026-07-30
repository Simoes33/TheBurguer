import React, {
  useEffect,
  useState,
  useCallback,
  useMemo
} from 'react';

import { Header } from '../components/Header';
import { CartDrawer } from '../components/CartDrawer';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import FavoriteBurgers from '../components/FavoriteBurgers';

import api from '../api/axios';

import {
  ArrowDown,
  MagnifyingGlass,
  X,
  Flame,
  InstagramLogo,
  WhatsappLogo,
  MapPin,
  Clock
} from '@phosphor-icons/react';


/*
 * ========================================
 * PRODUTOS DE FALLBACK
 * ========================================
 */

const FALLBACK_PRODUCTS = [
  {
    id: '1',
    name: 'The Classic',
    description: 'O clássico que nunca erra.',
    ingredients:
      'Blend 180g de Angus, queijo prato, alface americana, tomate e molho especial no brioche.',
    price: 32.90,
    imageUrl:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
    category: {
      name: 'Burgers'
    }
  },

  {
    id: '2',
    name: 'Double Smash Bacon',
    description: 'Para quem tem fome de verdade.',
    ingredients:
      'Dois smashs de 90g, duplo cheddar, bacon artesanal e cebola caramelizada.',
    price: 39.90,
    imageUrl:
      'https://images.unsplash.com/photo-1594212691516-069e8f8ddce8?auto=format&fit=crop&q=80&w=800',
    category: {
      name: 'Burgers'
    }
  },

  {
    id: '3',
    name: 'Truffle Mushroom',
    description: 'Uma explosão de sabores terrosos.',
    ingredients:
      'Blend 180g, mix de cogumelos salteados, queijo gruyère e maionese trufada.',
    price: 45.90,
    imageUrl:
      'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&q=80&w=800',
    category: {
      name: 'Burgers'
    }
  },

  {
    id: '4',
    name: 'Crispy Chicken',
    description: 'Frango crocante e suculento.',
    ingredients:
      'Sobrecoxa empanada crocante, coleslaw, picles e maionese de limão siciliano.',
    price: 29.90,
    imageUrl:
      'https://images.unsplash.com/photo-1615887023516-9dfbc8f117ce?auto=format&fit=crop&q=80&w=800',
    category: {
      name: 'Burgers'
    }
  },

  {
    id: '5',
    name: 'Veggie Supreme',
    description: 'Saboroso e 100% vegetal.',
    ingredients:
      'Hambúrguer de grão de bico, rúcula, tomate confit e creme de queijo vegano no pão rústico.',
    price: 34.90,
    imageUrl:
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800',
    category: {
      name: 'Burgers'
    }
  },

  {
    id: '6',
    name: 'Fritas Rústicas',
    description: 'O acompanhamento perfeito.',
    ingredients:
      'Batatas rústicas com páprica, alecrim e sal marinho. Acompanha maionese da casa.',
    price: 18.90,
    imageUrl:
      'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=800',
    category: {
      name: 'Porções'
    }
  },

  {
    id: '7',
    name: 'Onion Rings',
    description: 'Crocantes por fora, macias por dentro.',
    ingredients:
      'Anéis de cebola empanados e crocantes. Servidos com molho barbecue artesanal.',
    price: 22.90,
    imageUrl:
      'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&q=80&w=800',
    category: {
      name: 'Porções'
    }
  },

  {
    id: '8',
    name: 'Nuggets Artesanais',
    description: 'Feitos com frango de verdade.',
    ingredients:
      'Pedaços de peito de frango empanados em farinha panko. (10 unidades)',
    price: 24.90,
    imageUrl:
      'https://images.unsplash.com/photo-1562967914-01efa7e87832?auto=format&fit=crop&q=80&w=800',
    category: {
      name: 'Porções'
    }
  },

  {
    id: '9',
    name: 'Milkshake de Nutella',
    description: 'Doce na medida certa.',
    ingredients:
      'Sorvete de creme batido com muita Nutella e chantilly fresco.',
    price: 26.90,
    imageUrl:
      'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=800',
    category: {
      name: 'Bebidas'
    }
  },

  {
    id: '10',
    name: 'Pink Lemonade',
    description: 'Refrescância total.',
    ingredients:
      'Limonada com xarope de frutas vermelhas e hortelã fresca.',
    price: 14.90,
    imageUrl:
      'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800',
    category: {
      name: 'Bebidas'
    }
  }
];


/*
 * ========================================
 * HOME
 * ========================================
 */

export const Home = () => {

  const [products, setProducts] =
    useState(FALLBACK_PRODUCTS);

  const [bestsellerIds, setBestsellerIds] =
    useState([]);

  const [activeCategory, setActiveCategory] =
    useState('Todos');

  const [searchQuery, setSearchQuery] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);

  const [instaPosts, setInstaPosts] =
    useState([]);

  const [isStoreOpen, setIsStoreOpen] =
    useState(true);

  const [selectedProduct, setSelectedProduct] =
    useState(null);


  /*
   * ========================================
   * INSTAGRAM
   * ========================================
   */

  const [instaIndex, setInstaIndex] =
    useState(0);

  const [instaCardsPerView, setInstaCardsPerView] =
    useState(4);


  /*
   * ========================================
   * POSTS DO INSTAGRAM
   * ========================================
   */

  const instaPostsToShow = instaPosts.length
    ? instaPosts.slice(0, 6)
    : [
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop',

        'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800&auto=format&fit=crop',

        'https://images.unsplash.com/photo-1561758033-d89a9ad46330?q=80&w=800&auto=format&fit=crop',

        'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=800&auto=format&fit=crop',

        'https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=800&auto=format&fit=crop',

        'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?q=80&w=800&auto=format&fit=crop'
      ];


  /*
   * ========================================
   * RESPONSIVIDADE INSTAGRAM
   * ========================================
   */

  useEffect(() => {

    const updateCardsPerView = () => {

      if (window.innerWidth <= 1100) {
        setInstaCardsPerView(3);
      } else {
        setInstaCardsPerView(4);
      }

    };

    updateCardsPerView();

    window.addEventListener(
      'resize',
      updateCardsPerView
    );

    return () => {
      window.removeEventListener(
        'resize',
        updateCardsPerView
      );
    };

  }, []);


  /*
   * ========================================
   * HERO VIDEO
   * ========================================
   */

  useEffect(() => {

    const video =
      document.querySelector('.hero-video');

    if (video) {

      video.play().catch((error) => {
        console.log(
          'Autoplay blocked',
          error
        );
      });

    }

  }, []);


  /*
   * ========================================
   * INSTAGRAM AUTO PLAY
   * ========================================
   */

  useEffect(() => {

    if (
      instaPostsToShow.length <=
      instaCardsPerView
    ) {
      return;
    }

    const maxIndex =
      instaPostsToShow.length -
      instaCardsPerView;

    const interval =
      setInterval(() => {

        setInstaIndex((prev) => {

          if (prev >= maxIndex) {
            return 0;
          }

          return prev + 1;

        });

      }, 4000);

    return () =>
      clearInterval(interval);

  }, [
    instaPostsToShow.length,
    instaCardsPerView
  ]);


  /*
   * ========================================
   * CARREGAR DADOS DA API
   * ========================================
   */

  useEffect(() => {

    let cancelled = false;

    Promise.all([

      api
        .get('/products')
        .catch(() => ({
          data: []
        })),

      api
        .get('/settings/store-status')
        .catch(() => ({
          data: {
            isOpen: true
          }
        })),

      api
        .get('/instagram/feed')
        .catch(() => ({
          data: []
        })),

      /*
       * IMPORTANTE:
       * Agora buscamos 3 produtos.
       */

      api
        .get('/stats/bestsellers?limit=3')
        .catch(() => ({
          data: []
        }))

    ])

      .then(([
        productsRes,
        statusRes,
        instaRes,
        bestsellersRes
      ]) => {

        if (cancelled) {
          return;
        }


        /*
         * PRODUTOS
         */

        setProducts(
          productsRes.data.length
            ? productsRes.data
            : FALLBACK_PRODUCTS
        );


        /*
         * STATUS DA LOJA
         */

        setIsStoreOpen(
          statusRes.data.isOpen
        );


        /*
         * INSTAGRAM
         */

        if (
          instaRes.data.length
        ) {
          setInstaPosts(
            instaRes.data
          );
        }


        /*
         * MAIS VENDIDOS
         */

        setBestsellerIds(
          Array.isArray(
            bestsellersRes.data
          )
            ? bestsellersRes.data
            : []
        );

      })

      .finally(() => {

        if (!cancelled) {
          setIsLoading(false);
        }

      });


    return () => {
      cancelled = true;
    };

  }, []);


  /*
   * ========================================
   * CATEGORIA
   * ========================================
   */

  const handleCategoryChange =
    useCallback(
      (category) => {
        setActiveCategory(category);
      },
      []
    );


  /*
   * ========================================
   * CATEGORIAS
   * ========================================
   */

  const categories = useMemo(() => {

    return [
      'Todos',

      ...new Set(
        products
          .map(
            (product) =>
              product.category?.name
          )
          .filter(Boolean)
      )
    ];

  }, [products]);


  /*
   * ========================================
   * FILTRAR PRODUTOS
   * ========================================
   */

  const filteredProducts = useMemo(() => {

    let result = products;


    /*
     * Categoria
     */

    if (
      activeCategory !== 'Todos'
    ) {

      result =
        result.filter(
          (product) =>
            product.category?.name ===
            activeCategory
        );

    }


    /*
     * Busca
     */

    if (
      searchQuery.trim()
    ) {

      const query =
        searchQuery
          .toLowerCase()
          .trim();

      result =
        result.filter(
          (product) => {

            const name =
              product.name
                ?.toLowerCase()
                .includes(query);

            const description =
              product.description
                ?.toLowerCase()
                .includes(query);

            const ingredients =
              product.ingredients &&
              product.ingredients
                .toLowerCase()
                .includes(query);

            return (
              name ||
              description ||
              ingredients
            );

          }
        );

    }

    return result;

  }, [
    products,
    activeCategory,
    searchQuery
  ]);


  /*
   * ========================================
   * INSTAGRAM ANTERIOR
   * ========================================
   */

  const handleInstaPrevious =
    () => {

      setInstaIndex((prev) => {

        const maxIndex =
          instaPostsToShow.length -
          instaCardsPerView;

        if (prev === 0) {
          return Math.max(
            0,
            maxIndex
          );
        }

        return prev - 1;

      });

    };


  /*
   * ========================================
   * INSTAGRAM PRÓXIMO
   * ========================================
   */

  const handleInstaNext =
    () => {

      setInstaIndex((prev) => {

        const maxIndex =
          instaPostsToShow.length -
          instaCardsPerView;

        if (prev >= maxIndex) {
          return 0;
        }

        return prev + 1;

      });

    };


  /*
   * ========================================
   * RENDER
   * ========================================
   */

  return (
    <>

      <Header />


      {/* ==================================
          LOJA FECHADA
          ================================== */}

      {!isStoreOpen && (

        <div
          className="store-closed-banner"
          role="status"
        >
          ⚠️ Loja Fechada no momento.
          Aceitamos apenas consultas ao cardápio.
        </div>

      )}


      <CartDrawer />


      <main>


        {/* ==================================
            HERO
            ================================== */}

        <section
          className="hero"
          id="home"
          aria-label="Destaque principal"
        >

          <video
            autoPlay
            loop
            muted
            playsInline
            className="hero-video"
            poster="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1920"
          >

            <source
              src="https://videos.pexels.com/video-files/34556299/14641961_1920_1080_24fps.mp4"
              type="video/mp4"
            />

          </video>


          <div className="hero-bg" />


          <div className="hero-content">

            <span className="hero-eyebrow label">
              Hamburgueria Artesanal
            </span>


            <h1>
              O sabor
              <br />

              da{' '}

              <em
                style={{
                  color: 'var(--ember)',
                  fontStyle: 'italic'
                }}
              >
                brasa
              </em>

              <br />

              na sua mesa.
            </h1>


            <p>
              Ingredientes selecionados,
              carnes nobres e receitas únicas.
              Uma experiência que vai além
              do prato.
            </p>


            <div className="hero-actions">

              <a
                href="#menu"
                className="btn-primary"
              >
                Ver Cardápio
              </a>

            </div>

          </div>


          <div
            className="hero-scroll"
            aria-hidden="true"
          >
            Scroll
            <ArrowDown size={14} />
          </div>

        </section>

        {/* ==================================
            CARDÁPIO
            ================================== */}

        <section
          className="menu-section"
          id="menu"
          aria-label="Cardápio"
        >


          <div className="section-header">

            <span className="label">
              Cardápio
            </span>


            <h2>

              Escolha o seu{' '}

              <em
                style={{
                  color: 'var(--ember)',
                  fontStyle: 'italic'
                }}
              >
                favorito
              </em>

            </h2>


            <p>
              Preparado na hora,
              com ingredientes frescos
              e muito amor pelo que fazemos.
            </p>

          </div>


          {/* ==================================
              FAVORITOS DA CASA
              ================================== */}

          <FavoriteBurgers
            products={products}
            bestsellerIds={bestsellerIds}
            onProductClick={
              setSelectedProduct
            }
          />


          {/* ==================================
              BUSCA
              ================================== */}

          <div className="search-bar-wrapper">

            <input
              type="text"
              className="search-bar"
              placeholder="Buscar por nome, ingrediente ou descrição..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(
                  event.target.value
                )
              }
              aria-label="Buscar produtos no cardápio"
            />


            <MagnifyingGlass
              size={18}
              className="search-icon"
            />


            {searchQuery && (

              <button
                className="search-clear"
                onClick={() =>
                  setSearchQuery('')
                }
                aria-label="Limpar busca"
              >

                <X size={16} />

              </button>

            )}

          </div>


          {/* ==================================
              CATEGORIAS
              ================================== */}

          <div
            className="cat-tabs"
            role="tablist"
            aria-label="Filtrar por categoria"
          >

            {categories.map(
              (category) => (

                <button
                  key={category}
                  role="tab"
                  aria-selected={
                    activeCategory ===
                    category
                  }
                  className={`cat-tab ${
                    activeCategory ===
                    category
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    handleCategoryChange(
                      category
                    )
                  }
                >
                  {category}
                </button>

              )
            )}

          </div>


          {/* ==================================
              PRODUTOS
              ================================== */}

          {isLoading ? (

            <div
              className="products-grid"
              role="list"
            >

              {[
                1,
                2,
                3,
                4,
                5,
                6
              ].map((item) => (

                <div
                  key={item}
                  className="product-card skeleton"
                  style={{
                    border: 'none'
                  }}
                >

                  <div className="skeleton-card" />

                </div>

              ))}

            </div>

          ) : filteredProducts.length === 0 ? (

            <div className="empty-state">

              <MagnifyingGlass
                size={48}
              />


              <h3>
                Nenhum produto encontrado
              </h3>


              <p>
                Não encontramos nenhum item
                correspondente a "
                {searchQuery}".
                Tente buscar por outros termos.
              </p>


              <button
                className="btn-outline"
                onClick={() => {

                  setSearchQuery('');

                  setActiveCategory(
                    'Todos'
                  );

                }}
              >
                Ver Todo o Cardápio
              </button>

            </div>

          ) : (

            <div
              className="products-grid"
              role="list"
            >

              {filteredProducts.map(
                (product) => (

                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={
                      setSelectedProduct
                    }
                    isBestseller={
                      bestsellerIds.includes(
                        product.id
                      )
                    }
                  />

                )
              )}

            </div>

          )}

        </section>


        {/* ==================================
            MODAL DO PRODUTO
            ================================== */}

        {selectedProduct && (

          <ProductModal
            product={selectedProduct}
            onClose={() =>
              setSelectedProduct(null)
            }
          />

        )}

         {/* ==================================
            HORÁRIOS / INFORMAÇÕES
            ================================== */}

<div
          role="complementary"
          aria-label="Horários de funcionamento"
          className="info-strip-wrapper"
        >

          <div className="info-strip">

            {[
              {
                label:
                  'Segunda a Domingo',
                value:
                  '19h às 23h'
              },

              {
                label:
                  'Contato',
                value:
                  '(21) 98507-5154'
              },
            ].map(
              ({
                label,
                value
              }) => (

                <div
                  key={label}
                  className="info-strip-item"
                >

                  <span className="label">
                    {label}
                  </span>

                  <p>
                    {value}
                  </p>

                </div>

              )
            )}

          </div>

        </div>


        {/* ==================================
            INSTAGRAM
            ================================== */}

        <section
          className="instagram-section"
          aria-label="Nosso Instagram"
        >

          <div className="section-header">

            <span className="label">
              Social
            </span>


            <h2>

              Siga{' '}

              <em
                style={{
                  color: 'var(--ember)',
                  fontStyle: 'italic'
                }}
              >
                @TheBurguer
              </em>

            </h2>


            <p>
              Acompanhe nossos bastidores
              e novidades em tempo real.
            </p>

          </div>


          <div className="insta-carousel">


            {/* SETA ANTERIOR */}

            <button
              type="button"
              className="insta-arrow insta-arrow-prev"
              onClick={
                handleInstaPrevious
              }
              aria-label="Post anterior"
            >
              ‹
            </button>


            {/* VIEWPORT */}

            <div className="insta-viewport">

              <div
                className="insta-track"
                style={{
                  transform:
                    `translateX(-${
                      instaIndex *
                      (
                        100 /
                        instaCardsPerView
                      )
                    }%)`
                }}
              >

                {instaPostsToShow.map(
                  (post, index) => {

                    const url =
                      typeof post ===
                      'string'
                        ? post
                        : post.url;


                    const permalink =
                      typeof post ===
                      'string'
                        ? 'https://www.instagram.com/hamburgueria.theburguer/'
                        : post.permalink;


                    return (

                      <a
                        key={index}
                        href={permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="insta-item"
                      >

                        <img
                          src={url}
                          alt={`Instagram post ${
                            index + 1
                          }`}
                          loading="lazy"
                        />


                        <div className="insta-overlay">

                          <span>
                            Ver no Instagram
                          </span>

                        </div>

                      </a>

                    );

                  }
                )}

              </div>

            </div>


            {/* SETA PRÓXIMA */}

            <button
              type="button"
              className="insta-arrow insta-arrow-next"
              onClick={
                handleInstaNext
              }
              aria-label="Próximo post"
            >
              ›
            </button>

          </div>

        </section>


        {/* ==================================
            FOOTER
            ================================== */}

        <footer className="footer-main">

          <div className="footer-grid">


            {/* MARCA */}

            <div className="footer-brand">

              <div className="logo">

                <Flame
                  weight="fill"
                  color="var(--ember)"
                  size={24}
                />

                THE

                <em
                  style={{
                    color: 'var(--ember)',
                    fontStyle: 'normal'
                  }}
                >
                  BURGUER
                </em>

              </div>


              <p>
                Hamburgueria artesanal
                comprometida com a excelência
                do fogo, trazendo a experiência
                autêntica do churrasco diretamente
                para o seu prato.
              </p>

            </div>


            {/* NAVEGAÇÃO */}

            <div className="footer-col">

              <h4>
                Navegação
              </h4>


              <ul className="footer-links">

                <li>
                  <a href="#home">
                    Início
                  </a>
                </li>


                <li>
                  <a href="#menu">
                    Cardápio
                  </a>
                </li>


                <li>
                  <a href="/login">
                    Área do Cliente
                  </a>
                </li>

              </ul>

            </div>


            {/* ATENDIMENTO */}

            <div className="footer-col">

              <h4>
                Atendimento
              </h4>


              <ul className="footer-links">

                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >

                  <Clock
                    size={16}
                    color="var(--gold)"
                  />

                  Segunda a Domingo:
                  19h - 23h

                </li>


                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >

                  <MapPin
                    size={16}
                    color="var(--gold)"
                  />

                  Rio de Janeiro, RJ

                </li>


                <li
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >

                  <WhatsappLogo
                    size={16}
                    color="#25D366"
                  />

                  (21) 98507-5154

                </li>

              </ul>

            </div>

          </div>


          {/* FOOTER BOTTOM */}

          <div className="footer-bottom">

            <p>
              © {new Date().getFullYear()}
              {' '}
              The Burguer.
              Todos os direitos reservados.
            </p>


            <div className="social-links">

              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="Instagram"
              >

                <InstagramLogo
                  size={18}
                />

              </a>


              <a
                href="https://wa.me/5521985075154"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                aria-label="WhatsApp"
              >

                <WhatsappLogo
                  size={18}
                />

              </a>

            </div>

          </div>

        </footer>

      </main>

    </>
  );
};