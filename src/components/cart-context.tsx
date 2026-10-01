"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { productId: string; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (productId: string, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "cart:v1";
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      if (Array.isArray(saved)) setLines(saved);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback((productId: string, quantity: number) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) return prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l));
      return [...prev, { productId, quantity }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.productId !== productId) : prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
    );
  }, []);

  const remove = useCallback((productId: string) => setLines((prev) => prev.filter((l) => l.productId !== productId)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, ready, count: lines.reduce((n, l) => n + l.quantity, 0), add, setQuantity, remove, clear }),
    [lines, ready, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
