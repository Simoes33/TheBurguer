import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Pencil, Trash, Image as ImageIcon, Warning } from '@phosphor-icons/react';
import { useToast } from '../contexts/ToastContext';

const th = { padding: '1rem', textAlign: 'left', fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', fontWeight: 600 };
const td = { padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' };
const labelStyle = { display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '0.08em' };
const inputStyle = { width: '100%', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '0.7rem 0.9rem', color: 'var(--text)', borderRadius: '2px', fontSize: '0.9rem', outline: 'none' };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', color: '#fff' }}>Gestão de Produtos</h2>
        <button onClick={() => handleOpenModal()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Plus size={18} weight="bold" /> Novo Produto
        </button>
      </div>

      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                  <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', background: 'var(--bg-3)', color: 'var(--gold)', borderRadius: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {p.category?.name}
                  </span>
                </td>
                <td style={{ ...td, color: '#fff', fontFamily: 'var(--serif)' }}>
                  R$ {p.price.toFixed(2).replace('.', ',')}
                </td>
                <td style={td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: p.stock < 5 ? 'var(--ember)' : 'var(--text-muted)' }}>
                    {p.stock < 5 && <Warning size={14} />}
                    {p.stock} un.
                  </div>
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button onClick={() => handleOpenModal(p)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '0.4rem', cursor: 'pointer', borderRadius: '4px' }}>
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: '1px solid rgba(200,64,26,0.3)', color: 'var(--ember)', padding: '0.4rem', cursor: 'pointer', borderRadius: '4px' }}>
                      <Trash size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          <div className="modal-content" style={{ 
            background: 'var(--bg-2)',
            width: '100%',
            maxWidth: '600px', 
            padding: '2.5rem',
            borderRadius: '4px',
            border: '1px solid var(--border)',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={e => setFormData({...formData, imageFile: e.target.files[0]})}
                    style={{ ...inputStyle, padding: '0.4rem' }} 
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


