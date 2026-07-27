/**
 * Utilitários de formatação compartilhados
 * Elimina duplicação de fmt(), inputStyle e labelStyle entre Login, Register, Profile, CartDrawer e ProductCard
 */

/** Formata valor numérico para moeda BRL */
export const fmt = (n) => `R$ ${Number(n).toFixed(2).replace('.', ',')}`;

/** Formata CEP: 00000-000 */
export const formatCEP = (value) =>
  value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);

/** Formata telefone: (11) 9 9999-9999 */
export const formatPhone = (value) =>
  value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2')
    .slice(0, 15);

/** Número do WhatsApp configurado via variável de ambiente */
export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5521985075154';

/** Cria a URL do WhatsApp com o texto de pedido */
export const buildWhatsAppUrl = (text) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

/** Estilos de input compartilhados (evita duplicação em Login, Register e Profile) */
export const inputStyle = {
  width: '100%',
  padding: '0.85rem 1rem',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  color: 'var(--text)',
  fontFamily: 'var(--sans)',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.25s, box-shadow 0.25s',
};

/** Estilos de label compartilhados */
export const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '0.7rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  fontFamily: 'var(--sans)',
  fontWeight: 500,
};
