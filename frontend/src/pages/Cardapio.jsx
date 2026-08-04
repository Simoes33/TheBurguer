import React, {
  useEffect,
  useState,
  useMemo
} from 'react';

import {
  MagnifyingGlass,
  X,
  Flame,
  ArrowLeft
} from '@phosphor-icons/react';

import { Link } from 'react-router-dom';

import api from '../api/axios';

import { CatalogProductCard } from '../components/CatalogProductCard';


export const Cardapio = () => {

  const [products, setProducts] = useState([]);

  const [bestsellerIds, setBestsellerIds] =
    useState([]);

  const [activeCategory, setActiveCategory] =
    useState('Todos');

  const [searchQuery, setSearchQuery] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(true);


  /*
   * ========================================
   * CARREGAR PRODUTOS
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
        .get('/stats/bestsellers?limit=3')
        .catch(() => ({
          data: []
        }))

    ])
      .then(([
        productsRes,
        bestsellersRes
      ]) => {

        if (cancelled) {
          return;
        }

        setProducts(
          Array.isArray(productsRes.data)
            ? productsRes.data
            : []
        );

        setBestsellerIds(
          Array.isArray(bestsellersRes.data)
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
   * CATEGORIAS
   * ========================================
   */

  const categories = useMemo(() => {

    const uniqueCategories = [
      ...new Set(
        products
          .map(
            (product) =>
              product.category?.name
          )
          .filter(Boolean)
      )
    ];

    return [
      'Todos',
      ...uniqueCategories
    ];

  }, [products]);


  /*
   * ========================================
   * PRODUTOS FILTRADOS
   * ========================================
   */

  const filteredProducts = useMemo(() => {

    let result = products;


    /*
     * Categoria
     */

    if (activeCategory !== 'Todos') {

      result = result.filter(
        (product) =>
          product.category?.name ===
          activeCategory
      );

    }


    /*
     * Busca
     */

    if (searchQuery.trim()) {

      const query =
        searchQuery
          .toLowerCase()
          .trim();

      result = result.filter(
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
   * LIMPAR FILTROS
   * ========================================
   */

  const clearFilters = () => {

    setSearchQuery('');

    setActiveCategory('Todos');

  };


  /*
   * ========================================
   * RENDER
   * ========================================
   */

  return (
    <div className="catalog-page">

      <style>{`

        .catalog-page {
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
        }


        /* ==============================
           HEADER
           ============================== */

        .catalog-header {
          position: sticky;
          top: 0;
          z-index: 50;

          background: rgba(8, 8, 8, 0.92);
          border-bottom: 1px solid var(--border);

          backdrop-filter: blur(12px);
        }

        .catalog-header-inner {
          width: min(1200px, 92%);
          min-height: 72px;

          margin: 0 auto;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 1rem;
        }

        .catalog-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;

          text-decoration: none;
          color: var(--text);
        }

        .catalog-brand-name {
          font-family: var(--serif);
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .catalog-brand-name span {
          color: var(--ember);
        }

        .catalog-back {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;

          color: var(--text-muted);

          text-decoration: none;

          font-size: 0.8rem;

          transition: color 0.2s ease;
        }

        .catalog-back:hover {
          color: var(--ember);
        }


        /* ==============================
           CONTEÚDO
           ============================== */

        .catalog-main {
          width: min(1200px, 92%);

          margin: 0 auto;

          padding: 4rem 0 5rem;
        }


        /* ==============================
           INTRO
           ============================== */

        .catalog-intro {
          text-align: center;

          max-width: 700px;

          margin: 0 auto 3rem;
        }

        .catalog-label {
          display: block;

          color: var(--ember);

          font-family: var(--sans);

          font-size: 0.7rem;

          letter-spacing: 0.18em;

          text-transform: uppercase;

          margin-bottom: 0.8rem;
        }

        .catalog-intro h1 {
          margin: 0 0 1rem;

          font-family: var(--serif);

          font-size: clamp(
            2rem,
            5vw,
            3.4rem
          );

          font-weight: 600;

          color: var(--text);
        }

        .catalog-intro h1 em {
          color: var(--ember);
          font-style: italic;
        }

        .catalog-intro p {
          margin: 0 auto;

          max-width: 580px;

          color: var(--text-muted);

          font-size: 0.95rem;

          line-height: 1.7;
        }


        /* ==============================
           BUSCA
           ============================== */

        .catalog-search-wrapper {
          position: relative;

          max-width: 650px;

          margin: 0 auto 1.5rem;
        }

        .catalog-search {
          width: 100%;

          box-sizing: border-box;

          padding: 0.95rem 3rem 0.95rem 1.1rem;

          background: var(--bg-2);

          border: 1px solid var(--border);

          border-radius: 3px;

          color: var(--text);

          font-family: var(--sans);

          font-size: 0.85rem;

          outline: none;

          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .catalog-search:focus {
          border-color: var(--ember);

          box-shadow:
            0 0 0 3px
            rgba(200, 64, 26, 0.08);
        }

        .catalog-search::placeholder {
          color: var(--text-muted);
        }

        .catalog-search-icon {
          position: absolute;

          right: 1rem;
          top: 50%;

          transform: translateY(-50%);

          color: var(--text-muted);

          pointer-events: none;
        }

        .catalog-search-clear {
          position: absolute;

          right: 2.8rem;
          top: 50%;

          transform: translateY(-50%);

          border: none;
          background: transparent;

          color: var(--text-muted);

          cursor: pointer;

          display: flex;
          align-items: center;

          padding: 0.2rem;
        }


        /* ==============================
           CATEGORIAS
           ============================== */

        .catalog-categories {
          display: flex;

          align-items: center;
          justify-content: center;

          flex-wrap: wrap;

          gap: 0.5rem;

          margin-bottom: 3rem;
        }

        .catalog-category {
          border: 1px solid var(--border);

          background: transparent;

          color: var(--text-muted);

          padding: 0.55rem 1rem;

          border-radius: 2px;

          font-family: var(--sans);

          font-size: 0.72rem;

          letter-spacing: 0.05em;

          cursor: pointer;

          transition:
            color 0.2s ease,
            background 0.2s ease,
            border-color 0.2s ease;
        }

        .catalog-category:hover {
          color: var(--text);

          border-color: var(--ember);
        }

        .catalog-category.active {
          background: var(--ember);

          border-color: var(--ember);

          color: #fff;
        }


        /* ==============================
           GRID
           ============================== */

        .catalog-products-grid {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 1.25rem;
        }


        /* ==============================
           LOADING
           ============================== */

        .catalog-loading {
          display: grid;

          grid-template-columns:
            repeat(4, minmax(0, 1fr));

          gap: 1.25rem;
        }

        .catalog-skeleton {
          height: 380px;

          background:
            linear-gradient(
              90deg,
              var(--bg-2) 25%,
              var(--bg-3) 50%,
              var(--bg-2) 75%
            );

          background-size: 200% 100%;

          animation:
            catalog-skeleton-loading
            1.5s infinite;

          border-radius: 4px;
        }

        @keyframes catalog-skeleton-loading {

          0% {
            background-position: 200% 0;
          }

          100% {
            background-position: -200% 0;
          }

        }


        /* ==============================
           EMPTY
           ============================== */

        .catalog-empty {
          text-align: center;

          padding: 5rem 1rem;

          color: var(--text-muted);
        }

        .catalog-empty h2 {
          color: var(--text);

          font-family: var(--serif);

          margin: 1rem 0 0.5rem;
        }

        .catalog-empty p {
          margin-bottom: 1.5rem;
        }

        .catalog-empty-button {
          border: 1px solid var(--ember);

          background: transparent;

          color: var(--ember);

          padding: 0.7rem 1.2rem;

          cursor: pointer;

          border-radius: 2px;
        }


        /* ==============================
           FOOTER
           ============================== */

        .catalog-footer {
          border-top: 1px solid var(--border);

          padding: 2rem 5%;

          text-align: center;

          color: var(--text-muted);

          font-size: 0.75rem;
        }

        .catalog-footer strong {
          color: var(--text);
        }

        .catalog-footer span {
          color: var(--ember);
        }


        /* ==============================
           RESPONSIVIDADE
           ============================== */

        @media (max-width: 1000px) {

          .catalog-products-grid,
          .catalog-loading {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }

        }


        @media (max-width: 700px) {

          .catalog-main {
            padding-top: 3rem;
          }

          .catalog-products-grid,
          .catalog-loading {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .catalog-header-inner {
            min-height: 64px;
          }

          .catalog-back span {
            display: none;
          }

        }


        @media (max-width: 480px) {

          .catalog-products-grid,
          .catalog-loading {
            grid-template-columns: 1fr;
          }

          .catalog-main {
            width: 94%;
          }

          .catalog-intro {
            margin-bottom: 2.5rem;
          }

          .catalog-categories {
            justify-content: flex-start;

            overflow-x: auto;

            flex-wrap: nowrap;

            padding-bottom: 0.5rem;

            scrollbar-width: none;
          }

          .catalog-categories::-webkit-scrollbar {
            display: none;
          }

          .catalog-category {
            white-space: nowrap;
          }

        }

      `}</style>


      {/* ==================================
          HEADER
          ================================== */}

      <header className="catalog-header">

        <div className="catalog-header-inner">

          <Link
            to="/cardapio"
            className="catalog-brand"
          >

            <Flame
              weight="fill"
              size={24}
              color="var(--ember)"
            />

            <span className="catalog-brand-name">
              THE<span>BURGUER</span>
            </span>

          </Link>


          <Link
            to="/"
            className="catalog-back"
          >

            <ArrowLeft size={15} />

            <span>
              Site principal
            </span>

          </Link>

        </div>

      </header>


      {/* ==================================
          CONTEÚDO
          ================================== */}

      <main className="catalog-main">


        {/* INTRO */}

        <section className="catalog-intro">

          <span className="catalog-label">
            Cardápio
          </span>

          <h1>
            Conheça nossos{' '}
            <em>sabores</em>
          </h1>

          <p>
            Consulte nosso cardápio e conheça
            nossos hambúrgueres, porções e bebidas.
            Para realizar seu pedido, fale com
            nosso atendente.
          </p>

        </section>


        {/* BUSCA */}

        <div className="catalog-search-wrapper">

          <input
            type="text"
            className="catalog-search"
            placeholder="Buscar por nome, ingrediente ou descrição..."
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            aria-label="Buscar produtos"
          />

          {searchQuery && (
            <button
              className="catalog-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          )}

          <MagnifyingGlass
            size={18}
            className="catalog-search-icon"
          />

        </div>


        {/* CATEGORIAS */}

        <div
          className="catalog-categories"
          role="tablist"
          aria-label="Categorias do cardápio"
        >

          {categories.map((category) => (

            <button
              key={category}
              className={`catalog-category ${
                activeCategory === category
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveCategory(category)
              }
              role="tab"
              aria-selected={
                activeCategory === category
              }
            >
              {category}
            </button>

          ))}

        </div>


        {/* PRODUTOS */}

        {isLoading ? (

          <div className="catalog-loading">

            {[1, 2, 3, 4, 5, 6, 7, 8].map(
              (item) => (
                <div
                  key={item}
                  className="catalog-skeleton"
                />
              )
            )}

          </div>

        ) : filteredProducts.length === 0 ? (

          <div className="catalog-empty">

            <MagnifyingGlass size={44} />

            <h2>
              Nenhum produto encontrado
            </h2>

            <p>
              Não encontramos produtos para
              sua busca.
            </p>

            <button
              className="catalog-empty-button"
              onClick={clearFilters}
            >
              Ver todo o cardápio
            </button>

          </div>

        ) : (

          <div
            className="catalog-products-grid"
            role="list"
          >

            {filteredProducts.map((product) => (

              <CatalogProductCard
                key={product.id}
                product={product}
                isBestseller={
                  bestsellerIds.includes(product.id)
                }
              />

            ))}

          </div>

        )}

      </main>


      {/* ==================================
          FOOTER
          ================================== */}

      <footer className="catalog-footer">

        <strong>THE<span>BURGUER</span></strong>

        <br />

        Consulte nosso cardápio e fale
        com nosso atendente para fazer seu pedido.

      </footer>

    </div>
  );
};