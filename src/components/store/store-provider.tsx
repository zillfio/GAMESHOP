"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type CartLine = { productId: string; quantity: number };
type StoreContextValue = {
  cart: CartLine[];
  favorites: string[];
  cartCount: number;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  addToCart: (productId: string) => void;
  setCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  toggleFavorite: (productId: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);
const STORAGE_KEY = "gameshop-store-v1";
const STORE_EVENT = "gameshop-store-change";
const EMPTY_STORE = JSON.stringify({ cart: [], favorites: [] });

function readStore(): { cart: CartLine[]; favorites: string[] } {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? EMPTY_STORE) as { cart?: CartLine[]; favorites?: string[] };
    return {
      cart: Array.isArray(value.cart) ? value.cart : [],
      favorites: Array.isArray(value.favorites) ? value.favorites : [],
    };
  } catch {
    return { cart: [], favorites: [] };
  }
}

function subscribeToStore(onStoreChange: () => void) {
  window.addEventListener(STORE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(STORE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function writeStore(update: (current: ReturnType<typeof readStore>) => ReturnType<typeof readStore>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(update(readStore())));
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeSnapshot = useSyncExternalStore(
    subscribeToStore,
    () => localStorage.getItem(STORAGE_KEY) ?? EMPTY_STORE,
    () => EMPTY_STORE,
  );
  const { cart, favorites } = useMemo(() => {
    try {
      const parsed = JSON.parse(storeSnapshot) as { cart?: CartLine[]; favorites?: string[] };
      return {
        cart: Array.isArray(parsed.cart) ? parsed.cart : [],
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      };
    } catch {
      return { cart: [], favorites: [] };
    }
  }, [storeSnapshot]);
  const [searchQuery, setSearchQuery] = useState("");

  const value = useMemo<StoreContextValue>(() => ({
    cart,
    favorites,
    cartCount: cart.reduce((total, line) => total + line.quantity, 0),
    searchQuery,
    setSearchQuery,
    addToCart(productId) {
      writeStore(({ cart: current, favorites }) => {
        const existing = current.find((line) => line.productId === productId);
        return {
          favorites,
          cart: existing
            ? current.map((line) => line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line)
            : [...current, { productId, quantity: 1 }],
        };
      });
    },
    setCartQuantity(productId, quantity) {
      writeStore(({ cart: current, favorites }) => ({
        favorites,
        cart: quantity < 1
          ? current.filter((line) => line.productId !== productId)
          : current.map((line) => line.productId === productId ? { ...line, quantity } : line),
      }));
    },
    removeFromCart(productId) {
      writeStore(({ cart, favorites }) => ({
        favorites,
        cart: cart.filter((line) => line.productId !== productId),
      }));
    },
    toggleFavorite(productId) {
      writeStore(({ cart, favorites: current }) => ({
        cart,
        favorites: current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId],
      }));
    },
  }), [cart, favorites, searchQuery]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}