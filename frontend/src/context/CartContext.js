import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

// O carrinho guarda produtos de UMA loja por vez (como nos apps de delivery).
export const CartProvider = ({ children }) => {
  const [shop, setShop] = useState(null);
  const [items, setItems] = useState([]); // [{ product, quantity }]

  const add = useCallback((targetShop, product) => {
    setShop(targetShop);
    setItems((current) => {
      const base = shop && shop.id !== targetShop.id ? [] : current;
      const found = base.find((item) => item.product.id === product.id);
      if (found) {
        return base.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
            : item
        );
      }
      return [...base, { product, quantity: 1 }];
    });
  }, [shop]);

  const changeQuantity = useCallback((productId, delta) => {
    setItems((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.min(item.quantity + delta, 99) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setShop(null);
  }, []);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = Math.round(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100) / 100;
    const deliveryFee = items.length > 0 ? shop?.deliveryFeeValue || 0 : 0;
    return {
      shop,
      items,
      count,
      subtotal,
      deliveryFee,
      total: Math.round((subtotal + deliveryFee) * 100) / 100,
      add,
      changeQuantity,
      clear,
    };
  }, [shop, items, add, changeQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart deve ser usado dentro de CartProvider');
  return context;
};
