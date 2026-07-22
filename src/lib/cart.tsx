import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  product_id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  qty: number;
  stock: number;
};

type CartCtx = {
  items: CartItem[];
  add: (i: Omit<CartItem, "qty"> & { qty?: number }) => void;
  remove: (product_id: string) => void;
  setQty: (product_id: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "alpottica_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add: CartCtx["add"] = (i) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.product_id === i.product_id);
      const qty = i.qty ?? 1;
      if (existing) {
        return prev.map((p) =>
          p.product_id === i.product_id
            ? { ...p, qty: Math.min(p.stock, p.qty + qty) }
            : p,
        );
      }
      return [...prev, { ...i, qty }];
    });
  };

  const remove: CartCtx["remove"] = (id) =>
    setItems((prev) => prev.filter((p) => p.product_id !== id));

  const setQty: CartCtx["setQty"] = (id, qty) =>
    setItems((prev) =>
      prev
        .map((p) => (p.product_id === id ? { ...p, qty: Math.max(1, Math.min(p.stock, qty)) } : p))
        .filter((p) => p.qty > 0),
    );

  const clear = () => setItems([]);

  const count = items.reduce((n, i) => n + i.qty, 0);
  const total = items.reduce((n, i) => n + i.qty * i.price, 0);

  return (
    <Ctx.Provider value={{ items, add, remove, setQty, clear, count, total }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
