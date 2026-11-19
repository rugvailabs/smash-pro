"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore,
} from "react";
import { PRODUCTS } from "@/data/products";
import { ToastProvider } from "@/components/toast";
import type { CartLine, RacquetConfig, ViewRole } from "@/lib/types";

/* ============================================================
   Storefront client state (ADR-0008) — EVERYTHING here is a frontend
   fixture persisted to localStorage. There is no server, no session,
   no real cart/order backend. "Signed in" is a labelled demo toggle,
   never real authentication — mirrors the spirit of web/'s demo-role
   switcher but with zero network calls.
   ============================================================ */

const emptySubscribe = () => () => {};
export function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/* ---------- role (local demo toggle only) ---------- */
interface RoleCtx {
  role: ViewRole;
  setRole: (r: ViewRole) => void;
}
const RoleContext = createContext<RoleCtx>({ role: "visitor", setRole: () => {} });
export function useRole() {
  return useContext(RoleContext);
}

const ROLE_KEY = "sp-sf-role";

/* ---------- cart (local fixture) ---------- */
export interface UiCartLine extends CartLine {
  name: string;
  img?: string;
  unit: number;
  total: number;
}
interface CartCtx {
  lines: UiCartLine[];
  count: number;
  summary: { subtotal: number; gst: number; total: number };
  add: (sku: string, qty: number, config?: RacquetConfig) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}
const EMPTY_SUMMARY = { subtotal: 0, gst: 0, total: 0 };
const CartContext = createContext<CartCtx>({
  lines: [], count: 0, summary: EMPTY_SUMMARY, add: () => {}, setQty: () => {}, remove: () => {}, clear: () => {},
});
export function useCart() {
  return useContext(CartContext);
}

const CART_KEY = "sp-sf-cart";
const GST_RATE = 0.12; // illustrative presentation only — real rate PENDING CONFIRMATION (OBD-11/20)

function loadCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]") as CartLine[];
  } catch {
    return [];
  }
}
function saveCart(lines: CartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    /* storage blocked — cart stays in-memory for this session */
  }
}

/* ---------- wishlist (local fixture) ---------- */
interface WishlistCtx {
  has: (sku: string) => boolean;
  toggle: (sku: string) => void;
  skus: string[];
}
const WishlistContext = createContext<WishlistCtx>({ has: () => false, toggle: () => {}, skus: [] });
export function useWishlist() {
  return useContext(WishlistContext);
}
const WISHLIST_KEY = "sp-sf-wishlist";

/* ---------- recently viewed (local fixture, real browsing behaviour) ---------- */
interface RecentlyViewedCtx {
  skus: string[];
  track: (sku: string) => void;
}
const RecentlyViewedContext = createContext<RecentlyViewedCtx>({ skus: [], track: () => {} });
export function useRecentlyViewed() {
  return useContext(RecentlyViewedContext);
}
const RECENT_KEY = "sp-sf-recently-viewed";
const RECENT_MAX = 8;

export function Providers({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<ViewRole>("visitor");
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [wishSkus, setWishSkus] = useState<string[]>([]);
  const [recentSkus, setRecentSkus] = useState<string[]>([]);

  // hydrate from localStorage after mount (keeps SSR markup = visitor/empty)
  useEffect(() => {
    try {
      const r = localStorage.getItem(ROLE_KEY);
      if (r === "signed-in") setRoleState("signed-in");
    } catch { /* ignore */ }
    setCartLines(loadCart());
    try {
      setWishSkus(JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]") as string[]);
    } catch { /* ignore */ }
    try {
      setRecentSkus(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[]);
    } catch { /* ignore */ }
  }, []);

  const trackRecentlyViewed = useCallback((sku: string) => {
    setRecentSkus((prev) => {
      const next = [sku, ...prev.filter((s) => s !== sku)].slice(0, RECENT_MAX);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const setRole = useCallback((r: ViewRole) => {
    setRoleState(r);
    try { localStorage.setItem(ROLE_KEY, r); } catch { /* ignore */ }
  }, []);

  const addLine = useCallback((sku: string, qty: number, config?: RacquetConfig) => {
    setCartLines((prev) => {
      const key = config ? `${sku}|${JSON.stringify(config)}` : sku;
      const existing = prev.find((l) => l.key === key);
      const next = existing
        ? prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
        : [...prev, { key, sku, qty, config: config ?? null, deltaPrice: 0 }];
      saveCart(next);
      return next;
    });
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setCartLines((prev) => {
      const next = qty <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, qty } : l));
      saveCart(next);
      return next;
    });
  }, []);

  const remove = useCallback((key: string) => {
    setCartLines((prev) => {
      const next = prev.filter((l) => l.key !== key);
      saveCart(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setCartLines([]);
    saveCart([]);
  }, []);

  const toggleWish = useCallback((sku: string) => {
    setWishSkus((prev) => {
      const next = prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku];
      try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const roleValue = useMemo(() => ({ role, setRole }), [role, setRole]);

  const cartValue = useMemo<CartCtx>(() => {
    const lines: UiCartLine[] = cartLines
      .map((l): UiCartLine | null => {
        const p = PRODUCTS.find((pr) => pr.sku === l.sku);
        if (!p) return null;
        const unit = (role === "signed-in" && p.buyer !== undefined ? p.buyer : p.std) + l.deltaPrice;
        return { ...l, name: p.name, img: p.img, unit, total: unit * l.qty };
      })
      .filter((l): l is UiCartLine => l !== null);
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const gst = Math.round(subtotal * GST_RATE * 100) / 100;
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      summary: { subtotal, gst, total: subtotal + gst },
      add: addLine,
      setQty,
      remove,
      clear,
    };
  }, [cartLines, role, addLine, setQty, remove, clear]);

  const wishlistValue = useMemo<WishlistCtx>(
    () => ({ has: (sku) => wishSkus.includes(sku), toggle: toggleWish, skus: wishSkus }),
    [wishSkus, toggleWish]
  );
  const recentlyViewedValue = useMemo<RecentlyViewedCtx>(
    () => ({ skus: recentSkus, track: trackRecentlyViewed }),
    [recentSkus, trackRecentlyViewed]
  );

  return (
    <RoleContext.Provider value={roleValue}>
      <CartContext.Provider value={cartValue}>
        <WishlistContext.Provider value={wishlistValue}>
          <RecentlyViewedContext.Provider value={recentlyViewedValue}>
            <ToastProvider>{children}</ToastProvider>
          </RecentlyViewedContext.Provider>
        </WishlistContext.Provider>
      </CartContext.Provider>
    </RoleContext.Provider>
  );
}
