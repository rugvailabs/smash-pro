"use client";

import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { ToastProvider } from "@/components/toast";
import type { RacquetConfig, Role } from "@/lib/types";
import type { CartDto } from "@/server/buyer";

/* ============================================================
   Client state over REAL sessions (integration point I1):
   - role comes from /api/auth/me (HTTP-only session cookie) —
     the server decides; this context only mirrors it for chrome
   - the cart is server-side per approved buyer (/api/cart)
   The preview localStorage switcher is gone; the demo ribbon
   performs real sign-ins against seeded accounts (DEMO_MODE).
   ============================================================ */

/** True only after client hydration — the server snapshot is false, so the
 *  hydration pass always matches server HTML (even inside Suspense). */
const emptySubscribe = () => () => {};
export function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/* ---------- role (session mirror) ---------- */
interface RoleCtx {
  role: Role;
  email?: string;
  orgName?: string;
  /** performs a real demo sign-in (seeded accounts) then refreshes */
  setRole: (r: Role) => void;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  ready: boolean;
}
const RoleContext = createContext<RoleCtx>({
  role: "visitor", setRole: () => {}, signOut: async () => {}, refresh: async () => {}, ready: false,
});
export function useRole() { return useContext(RoleContext); }

/* ---------- cart (server mirror) ---------- */
export interface UiCartLine {
  key: string; sku: string; qty: number; config: RacquetConfig | null; delta: number;
  name: string; img?: string; unit: number; total: number;
}
interface CartCtx {
  lines: UiCartLine[];
  count: number;
  summary: { itemsIncl: number; subtotalExGst: number; gst: number; shipping: number; total: number; freeDeliveryEligible: boolean };
  add: (sku: string, qty: number, config?: RacquetConfig) => Promise<void>;
  setQty: (key: string, qty: number) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;
}
const EMPTY_SUMMARY = { itemsIncl: 0, subtotalExGst: 0, gst: 0, shipping: 0, total: 0, freeDeliveryEligible: false };
const CartContext = createContext<CartCtx>({
  lines: [], count: 0, summary: EMPTY_SUMMARY,
  add: async () => {}, setQty: async () => {}, remove: async () => {}, clear: async () => {},
});
export function useCart() { return useContext(CartContext); }

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  if (!res.ok) throw new Error(String(res.status));
  return res.json() as Promise<T>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRoleState] = useState<Role>("visitor");
  const [email, setEmail] = useState<string | undefined>();
  const [orgName, setOrgName] = useState<string | undefined>();
  const [ready, setReady] = useState(false);
  const [cart, setCart] = useState<CartDto | null>(null);

  const refreshCart = useCallback(async () => {
    try {
      setCart(await fetchJson<CartDto>("/api/cart"));
    } catch {
      setCart(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await fetchJson<{ role: Role; email?: string; orgName?: string }>("/api/auth/me");
      setRoleState(me.role);
      setEmail(me.email);
      setOrgName(me.orgName);
    } catch {
      setRoleState("visitor");
    } finally {
      setReady(true);
    }
    await refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    // hydrate session + cart from the server after paint — setState stays
    // out of the synchronous effect body (no cascading first render)
    const t = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(t);
  }, [refresh]);

  /** Demo-account switch: a REAL sign-in/out against seeded accounts. */
  const setRole = useCallback(
    (r: Role) => {
      void (async () => {
        try {
          await fetchJson("/api/auth/demo", { method: "POST", body: JSON.stringify({ as: r }) });
        } catch {
          /* demo mode off or unseeded — role stays as the server says */
        }
        await refresh();
        router.refresh(); // server components re-render with the new session
      })();
    },
    [refresh, router]
  );

  const signOut = useCallback(async () => {
    await fetchJson("/api/auth/logout", { method: "POST" });
    await refresh();
    router.refresh();
  }, [refresh, router]);

  const add = useCallback(
    async (sku: string, qty: number, config?: RacquetConfig) => {
      // pricing (incl. configuration surcharges) is computed server-side only
      setCart(await fetchJson<CartDto>("/api/cart", {
        method: "POST", body: JSON.stringify({ sku, qty, config }),
      }));
    },
    []
  );
  const setQty = useCallback(async (key: string, qty: number) => {
    setCart(await fetchJson<CartDto>("/api/cart", { method: "PATCH", body: JSON.stringify({ key, qty }) }));
  }, []);
  const remove = useCallback(async (key: string) => {
    setCart(await fetchJson<CartDto>("/api/cart", { method: "DELETE", body: JSON.stringify({ key }) }));
  }, []);
  const clear = useCallback(async () => {
    setCart(await fetchJson<CartDto>("/api/cart", { method: "DELETE", body: JSON.stringify({ all: true }) }));
  }, []);

  const roleValue = useMemo(
    () => ({ role, email, orgName, setRole, signOut, refresh, ready }),
    [role, email, orgName, setRole, signOut, refresh, ready]
  );
  const cartValue = useMemo<CartCtx>(
    () => ({
      lines: (cart?.lines ?? []) as UiCartLine[],
      count: cart?.count ?? 0,
      summary: cart
        ? { itemsIncl: cart.itemsIncl, subtotalExGst: cart.subtotalExGst, gst: cart.gst, shipping: cart.shipping, total: cart.total, freeDeliveryEligible: cart.freeDeliveryEligible }
        : EMPTY_SUMMARY,
      add, setQty, remove, clear,
    }),
    [cart, add, setQty, remove, clear]
  );

  return (
    <RoleContext.Provider value={roleValue}>
      <CartContext.Provider value={cartValue}>
        <ToastProvider>{children}</ToastProvider>
      </CartContext.Provider>
    </RoleContext.Provider>
  );
}
