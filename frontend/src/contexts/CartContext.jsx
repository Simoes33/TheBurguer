import React, { createContext, useCallback, useContext, useReducer } from 'react';

// ──────────────────────────────────────────────
// State management com useReducer (mais previsível)
// ──────────────────────────────────────────────
const getInitialCart = () => {
  try {
    const localCart = localStorage.getItem('@TheBurguer:cart');
    return localCart ? JSON.parse(localCart) : [];
  } catch (err) {
    return [];
  }
};

// Gera uma chave única por item levando em conta variante, tamanho, combo e observação
const itemKey = (id, observation, options = {}) =>
  `${id}|${options.variant ?? ''}|${options.size ?? ''}|${options.isCombo ? '1' : '0'}|${observation ?? ''}`;

const initialState = { cart: getInitialCart(), isCartOpen: false };

function cartReducer(state, action) {
  switch (action.type) {
    case 'OPEN':   return { ...state, isCartOpen: true };
    case 'CLOSE':  return { ...state, isCartOpen: false };
    case 'TOGGLE': return { ...state, isCartOpen: !state.isCartOpen };

    case 'ADD': {
      const key = itemKey(action.product.id, action.observation, action.options);
      const exists = state.cart.find(i => i._key === key);
      const newItem = {
        ...action.product,
        quantity: action.quantity,
        observation: action.observation,
        options: action.options || {},
        _key: key,
      };
      return {
        ...state,
        isCartOpen: true,
        cart: exists
          ? state.cart.map(i => i._key === key ? { ...i, quantity: i.quantity + action.quantity } : i)
          : [...state.cart, newItem],
      };
    }

    case 'UPDATE_QTY': {
      const updated = state.cart
        .map(i => i._key === action.key ? { ...i, quantity: i.quantity + action.delta } : i)
        .filter(i => i.quantity > 0);
      return { ...state, cart: updated };
    }

    case 'REMOVE':
      return { ...state, cart: state.cart.filter(i => i._key !== action.key) };

    case 'CLEAR':
      return { ...state, cart: [] };

    default:
      return state;
  }
}

export const CartContext = createContext({});

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  React.useEffect(() => {
    localStorage.setItem('@TheBurguer:cart', JSON.stringify(state.cart));
  }, [state.cart]);

  const toggleCart  = useCallback(() => dispatch({ type: 'TOGGLE' }), []);
  const openCart    = useCallback(() => dispatch({ type: 'OPEN' }), []);
  const closeCart   = useCallback(() => dispatch({ type: 'CLOSE' }), []);

  // options: { variant, size, isCombo, basePrice }
  const addToCart = useCallback((product, quantity = 1, observation = '', options = {}) => {
    dispatch({ type: 'ADD', product, quantity, observation, options });
  }, []);

  const removeFromCart = useCallback((key) => dispatch({ type: 'REMOVE', key }), []);
  const updateQuantity = useCallback((key, delta) => dispatch({ type: 'UPDATE_QTY', key, delta }), []);
  const clearCart      = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const totalItems = state.cart.reduce((acc, i) => acc + i.quantity, 0);
  // price já está no item com todas as opções aplicadas (basePrice do modal)
  const totalPrice = state.cart.reduce((acc, i) => acc + (i.options?.basePrice ?? i.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart: state.cart,
      isCartOpen: state.isCartOpen,
      toggleCart, openCart, closeCart,
      addToCart, removeFromCart, updateQuantity, clearCart,
      totalItems,
      totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook customizado para consumo mais simples
export const useCart = () => useContext(CartContext);
