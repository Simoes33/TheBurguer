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

const initialState = { cart: getInitialCart(), isCartOpen: false };

function cartReducer(state, action) {
  switch (action.type) {
    case 'OPEN':  return { ...state, isCartOpen: true };
    case 'CLOSE': return { ...state, isCartOpen: false };
    case 'TOGGLE': return { ...state, isCartOpen: !state.isCartOpen };

    case 'ADD': {
      const exists = state.cart.find(i => i.id === action.product.id && i.observation === action.observation);
      return {
        ...state,
        isCartOpen: true,
        cart: exists
          ? state.cart.map(i => (i.id === action.product.id && i.observation === action.observation) ? { ...i, quantity: i.quantity + action.quantity } : i)
          : [...state.cart, { ...action.product, quantity: action.quantity, observation: action.observation }],
      };
    }

    case 'UPDATE_QTY': {
      const updated = state.cart
        .map(i => (i.id === action.id && (i.observation || '') === (action.observation || '')) ? { ...i, quantity: i.quantity + action.delta } : i)
        .filter(i => i.quantity > 0);
      return { ...state, cart: updated };
    }

    case 'REMOVE':
      return { ...state, cart: state.cart.filter(i => !(i.id === action.id && i.observation === action.observation)) };

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
  
  const addToCart   = useCallback((product, quantity = 1, observation = '') => {
    dispatch({ type: 'ADD', product, quantity, observation });
  }, []);

  const removeFromCart = useCallback((id, observation = '') => dispatch({ type: 'REMOVE', id, observation }), []);
  const updateQuantity = useCallback((id, delta, observation = '') => dispatch({ type: 'UPDATE_QTY', id, delta, observation }), []);
  const clearCart   = useCallback(() => dispatch({ type: 'CLEAR' }), []);

  const totalItems = state.cart.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = state.cart.reduce((acc, i) => acc + i.price * i.quantity, 0);

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
