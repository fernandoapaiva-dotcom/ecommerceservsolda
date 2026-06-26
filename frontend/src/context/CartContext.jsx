import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const initialState = {
  items: JSON.parse(localStorage.getItem('cart_items')) || [],
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existingIdx = state.items.findIndex(item => item.sku === action.payload.sku);
      let newItems;
      if (existingIdx > -1) {
        newItems = [...state.items];
        newItems[existingIdx].qty += action.payload.qty || 1;
        newItems[existingIdx].total = newItems[existingIdx].qty * newItems[existingIdx].price;
      } else {
        const qty = action.payload.qty || 1;
        newItems = [
          ...state.items,
          {
            ...action.payload,
            qty,
            total: qty * action.payload.price,
          }
        ];
      }
      localStorage.setItem('cart_items', JSON.stringify(newItems));
      return { ...state, items: newItems };
    }
    case 'UPDATE_QTY': {
      const newItems = state.items.map(item => {
        if (item.sku === action.payload.sku) {
          const qty = Math.max(1, parseInt(action.payload.qty) || 1);
          return {
            ...item,
            qty,
            total: qty * item.price,
          };
        }
        return item;
      });
      localStorage.setItem('cart_items', JSON.stringify(newItems));
      return { ...state, items: newItems };
    }
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter(item => item.sku !== action.payload.sku);
      localStorage.setItem('cart_items', JSON.stringify(newItems));
      return { ...state, items: newItems };
    }
    case 'MERGE_CARTS': {
      // Merge local cart items list with database or merge strategy
      // For B2B/B2C Checkout we keep simple unique list of items by SKU
      const merged = [...state.items];
      action.payload.forEach(dbItem => {
        const idx = merged.findIndex(i => i.sku === dbItem.sku);
        if (idx > -1) {
          merged[idx].qty = Math.max(merged[idx].qty, dbItem.qty);
          merged[idx].total = merged[idx].qty * merged[idx].price;
        } else {
          merged.push(dbItem);
        }
      });
      localStorage.setItem('cart_items', JSON.stringify(merged));
      return { ...state, items: merged };
    }
    case 'CLEAR_CART': {
      localStorage.removeItem('cart_items');
      return { ...state, items: [] };
    }
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();

  // Load user cart or sync on user change
  useEffect(() => {
    if (user) {
      // Automatically load or merge cart from server-storage or user preferences
      // For standard browser flow, we load user-linked localStorage cart items if required.
      const localKey = `cart_items_${user.id}`;
      const userItems = JSON.parse(localStorage.getItem(localKey)) || [];
      if (userItems.length > 0) {
        dispatch({ type: 'MERGE_CARTS', payload: userItems });
        localStorage.removeItem(localKey);
      }
    }
  }, [user]);

  // Sync state items back to user-scoped storage to prevent loss
  useEffect(() => {
    if (user) {
      localStorage.setItem(`cart_items_${user.id}`, JSON.stringify(state.items));
    }
    localStorage.setItem('cart_items', JSON.stringify(state.items));
  }, [state.items, user]);

  const addToCart = (product, qty = 1) => {
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        sku: product.sku,
        name: product.name,
        price: product.price,
        image: JSON.parse(product.images || '[]')[0] || '',
        qty,
      }
    });
  };

  const updateQty = (sku, qty) => {
    dispatch({ type: 'UPDATE_QTY', payload: { sku, qty } });
  };

  const removeItem = (sku) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { sku } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getSubtotal = () => {
    return state.items.reduce((sum, item) => sum + item.total, 0);
  };

  const getItemCount = () => {
    return state.items.reduce((sum, item) => sum + item.qty, 0);
  };

  return (
    <CartContext.Provider value={{
      items: state.items,
      addToCart,
      updateQty,
      removeItem,
      clearCart,
      getSubtotal,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
