import { useEffect, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
};

const KEY = "greennest_cart";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart:update"));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    setItems(read());
    const h = () => setItems(read());
    window.addEventListener("cart:update", h);
    return () => window.removeEventListener("cart:update", h);
  }, []);
  return {
    items,
    count: items.reduce((s, i) => s + i.quantity, 0),
    total: items.reduce((s, i) => s + i.quantity * i.price, 0),
    add: (item: Omit<CartItem, "quantity">, qty = 1) => {
      const cur = read();
      const ix = cur.findIndex((c) => c.id === item.id);
      if (ix >= 0) cur[ix].quantity += qty;
      else cur.push({ ...item, quantity: qty });
      write(cur);
    },
    remove: (id: string) => write(read().filter((i) => i.id !== id)),
    setQty: (id: string, qty: number) => {
      const cur = read().map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i));
      write(cur);
    },
    clear: () => write([]),
  };
}
