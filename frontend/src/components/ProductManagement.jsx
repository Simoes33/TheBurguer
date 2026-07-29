import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Pencil, Trash, Image as ImageIcon, Warning } from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';

const th = { padding: '1rem', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontWeight: 600 };
const td = { padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };
const labelStyle = { display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.08em' };
const inputStyle = { width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '0.7rem 0.9rem', color: 'var(--text)', borderRadius: '2px', fontSize: '0.9rem', outline: 'none' };

// Estilos responsivos do painel de produtos. Precisa ser <style> (e não
// objetos inline) porque media queries não existem em style inline puro.
const PRODUCT_MANAGEMENT_STYLES = `
  .pm-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
  }
  .pm-title { font-family: var(--serif); font-size: 1.8rem; color: #fff; margin: 0; }
  .pm-new-btn { display: flex; align-items: center; gap: 0.6rem; white-space: nowrap; }

  .pm-table-wrapper { overflow-x: auto; }
  .pm-cards { display: none; flex-direction: column; gap: 1rem; padding: 1rem; }
  .pm-card { background: var(--bg-3); border: 1px solid var(--border); border-radius: 4px; padding: 1rem; display: flex; flex-direction: column; gap: 0.8rem; }
  .pm-card-top { display: flex; gap: 1rem; align-items: center; }
  .pm-card-row { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 0.7rem; }
  .pm-card-actions { display: flex; gap: 0.5rem; }

  .pm-modal-content { padding: 2.5rem; }
  .pm-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

  @media (max-width: 768px) {
    .pm-title { font-size: 1.5rem; }
  }

  @media (max-width: 640px) {
    .pm-table-wrapper { display: none; }
    .pm-cards { display: flex; }
    .pm-form-grid { grid-template-columns: 1fr; }
    .pm-modal-content { padding: 1.5rem; }
    .pm-new-btn { flex: 1; justify-content: center; }
  }
`;

const CategoryBadge = ({ name }) => (
  <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: 'var(--bg-3)', color: 'var(--gold)', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
    {name}
  </span>
);

const StockIndicator = ({ stock }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: stock < 5 ? 'var(--ember)' : 'var(--text-muted)' }}>
    {stock < 5 && <Warning size={14} />}
    {stock} un.
  </div>
);

// Botões de editar/excluir, compartilhados entre a linha da tabela e o card.
const ProductActions = ({ product, onEdit, onDelete }) => (
  <div className="pm-card-actions">
    <button onClick={() => onEdit(product)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '0.4rem', cursor: 'pointer', borderRadius: '4px' }}>
      <Pencil size={18} />
    </button>
    <button onClick={() => onDelete(product.id)} style={{ background: 'none', border: '1px solid rgba(200,64,26,0.3)', color: 'var(--ember)', padding: '0.4rem', cursor: 'pointer', borderRadius: '4px' }}>
      <Trash size={18} />
    </button>
  </div>
);

// Card de produto usado apenas em telas de smartphone, no lugar da tabela.
const ProductCard = ({ product, onEdit, onDelete }) => (
  <div className="pm-card">
    <div className="pm-card-top">
      {product.imageUrl ? (
        <img src={product.imageUrl} style={{ width: 52, height: 52, borderRadius: '4px', objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 52, height: 52, borderRadius: '4px', background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ImageIcon size={22} color="var(--text-muted)" />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ color: '#fff', fontWeight: 500 }}>{product.name}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.description}</div>
      </div>
    </div>

    <div className="pm-card-row">
      <CategoryBadge name={product.category?.name} />
      <span style={{ color: '#fff', fontFamily: 'var(--serif)', fontSize: '1.05rem' }}>
        R$ {product.price.toFixed(2).replace('.', ',')}
      </span>
    </div>

    <div className="pm-card-row">
      <StockIndicator stock={product.stock} />
      <ProductActions product={product} onEdit={onEdit} onDelete={onDelete} />
    </div>
  </div>
);

export const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ingredients: '',
    price: '',
    stock: '',
    imageUrl: '',
    categoryId: '',
    imageFile: null
  });

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      setProducts(pRes.data);
      setCategories(cRes.data);
    } catch (err) {
      toast.error('Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        ingredients: product.ingredients || '',
        price: product.price,
        stock: product.stock,
        imageUrl: product.imageUrl || '',
        categoryId: product.category?.id || '',
        imageFile: null
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', ingredients: '', price: '', stock: '', imageUrl: '', categoryId: categories[0]?.id || '', imageFile: null });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('ingredients', formData.ingredients);
      data.append('price', String(formData.price));
      data.append('stock', String(formData.stock));
      data.append('categoryId', formData.categoryId);

      if (formData.imageFile) {
        data.append('image', formData.imageFile);
      } else {
        data.append('imageUrl', formData.imageUrl);
      }

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' }
      };

      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, data, config);
        toast.success('Produto atualizado!');
      } else {
        await api.post('/products', data, config);
        toast.success('Produto criado!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Erro ao salvar produto.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Produto removido.');
      fetchData();
    } catch {
      toast.error('Erro ao remover produto.');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <style>{PRODUCT_MANAGEMENT_STYLES}</style>

      <div className="pm-header">
        <h2 className="pm-title">Gestão de Produtos</h2>
        <button onClick={() => handleOpenModal()} className="btn-primary pm-new-btn">
          <Plus size={18} weight="bold" /> Novo Produto
        </button>
      </div>

      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <div className="pm-table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '640px' }}>
            <thead>
              <tr>
                <th style={th}>Produto</th>
                <th style={th}>Categoria</th>
                <th style={th}>Preço</th>
                <th style={th}>Estoque</th>
                <th style={{ ...th, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ ...td, textAlign: 'center' }}>Carregando...</td></tr>
              ) : products.map(p => (
                <tr key={p.id}>
                  <td style={td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} style={{ width: 40, height: 40, borderRadius: '4px', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '4px', background: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ImageIcon size={20} color="var(--text-muted)" />
                        </div>
                      )}
                      <div>
                        <div style={{ color: '#fff', fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.description}</div>
                      </div>
                    </div>
                  </td>
                  <td style={td}>
                    <CategoryBadge name={p.category?.name} />
                  </td>
                  <td style={{ ...td, color: '#fff', fontFamily: 'var(--serif)' }}>
                    R$ {p.price.toFixed(2).replace('.', ',')}
                  </td>
                  <td style={td}>
                    <StockIndicator stock={p.stock} />
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <ProductActions product={p} onEdit={handleOpenModal} onDelete={handleDelete} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pm-cards">
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Carregando...</div>
          ) : products.map(p => (
            <ProductCard key={p.id} product={p} onEdit={handleOpenModal} onDelete={handleDelete} />
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay-admin" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 4000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div className="modal-content pm-modal-content" style={{
            background: 'var(--bg-2)',
            width: '100%',
            maxWidth: '600px',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="pm-form-grid">
                <div>
                  <label style={labelStyle}>Nome</label>
                  <input style={inputStyle} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div>
                  <label style={labelStyle}>Categoria</label>
                  <select style={inputStyle} value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} required>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Descrição Curta</label>
                <input style={inputStyle} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </div>
              <div>
                <label style={labelStyle}>Ingredientes</label>
                <textarea style={{...inputStyle, resize: 'vertical'}} rows={3} value={formData.ingredients} onChange={e => setFormData({...formData, ingredients: e.target.value})} />
              </div>
              <div className="pm-form-grid">
                <div>
                  <label style={labelStyle}>Preço (R$)</label>
                  <input type="number" step="0.01" style={inputStyle} value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
                </div>
                <div>
                  <label style={labelStyle}>Estoque (Unid)</label>
                  <input type="number" style={inputStyle} value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} required />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Imagem do Produto</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setFormData({...formData, imageFile: e.target.files[0]})}
                    style={{ ...inputStyle, padding: '0.4rem', width: 'auto', flex: 1, minWidth: '180px' }}
                  />
                  {formData.imageUrl && !formData.imageFile && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--gold)' }}>Tem imagem</span>
                  )}
                  {formData.imageFile && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--ember)' }}>Novo arquivo</span>
                  )}
                </div>
                <input
                  style={{ ...inputStyle, marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.6 }}
                  value={formData.imageUrl}
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                  placeholder="Ou cole uma URL externa (ex: Unsplash)"
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};