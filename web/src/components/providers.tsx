"use client";

import {
  createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore,
} from "react";
import type { CartLine, RacquetConfig, Role } from "@/lib/types";

/* ============================================================
   Preview-grade client state: demo role switcher + local cart.
   Real authentication and a server cart replace these later —
   consumers only use the hooks, so the swap is contained here.
   ============================================================ */

/** True only after client hydration — the server snapshot is false, so the
 *  hydration pass always matches server HTML (even inside Suspense). */
const emptySubscribe = () => () => {};
export function useIsClient() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

const ROLES: Role[] = ["visitor", "pending", "buyer", "supplier"];

/* ---------- role ---------- */
interface RoleCtx { role: Role; setRole: (r: Role) => void; ready: boolean; }
const RoleContext = createContext<RoleCtx>({ role: "visitor", setRole: () => {}, ready: false });

export function useRole() { return useContext(RoleContext); }

/* ---------- cart ---------- */
interface CartCtx {
  lines: CartLine[];
  count: number;
  add: (sku: string, qty: number, config?: RacquetConfig, delta?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}
const CartContext = createContext<CartCtx>({
  lines: [], count: 0, add: () => {}, setQty: () => {}, remove: () => {}, clear: () => {},
});

export function useCart() { return useContext(CartContext); }

/* ---------- provider ---------- */
export function Providers({ children }: { children: React.ReactNode }) {
  const isClient = useIsClient();

  // null = untouched this session; fall back to the stored value
  const [roleState, setRoleState] = useState<Role | null>(null);
  const [linesState, setLinesState] = useState<CartLine[] | null>(null);

  const storedRole = useMemo<Role>(() => {
    if (!isClient) return "visitor";
    const r = localStorage.getItem("ps_role") as Role | null;
    return r && ROLES.includes(r) ? r : "visitor";
  }, [isClient]);

  const storedLines = useMemo<CartLine[]>(() => {
    if (!isClient) return [];
    try {
      const c = JSON.parse(localStorage.getItem("ps_cart") ?? "[]") as CartLine[];
      return Array.isArray(c) ? c : [];
    } catch {
      return [];
    }
  }, [isClient]);

  const role = roleState ?? storedRole;
  const lines = linesState ?? storedLines;

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    localStorage.setItem("ps_role", r);
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLinesState(next);
    localStorage.setItem("ps_cart", JSON.stringify(next));
  }, []);

  const add = useCallback(
    (sku: string, qty: number, config?: RacquetConfig, delta = 0) => {
      const key = sku + (config ? "|" + JSON.stringify(config) : "");
      const next = lines.map((l) =>
        l.key === key ? { ...l, qty: l.qty + qty } : l
      );
      if (!next.some((l) => l.key === key)) {
        next.push({ key, sku, qty, config: config ?? null, delta });
      }
      persist(next);
    },
    [lines, persist]
  );

  const setQty = useCallback(
    (key: string, qty: number) => {
      persist(lines.map((l) => (l.key === key ? { ...l, qty: Math.max(1, qty) } : l)));
    },
    [lines, persist]
  );

  const remove = useCallback(
    (key: string) => persist(lines.filter((l) => l.key !== key)),
    [lines, persist]
  );

  const clear = useCallback(() => persist([]), [persist]);

  const count = useMemo(() => lines.reduce((s, l) => s + l.qty, 0), [lines]);

  const roleValue = useMemo(
    () => ({ role, setRole, ready: isClient }),
    [role, setRole, isClient]
  );
  const cartValue = useMemo(
    () => ({ lines, count, add, setQty, remove, clear }),
    [lines, count, add, setQty, remove, clear]
  );

  return (
    <RoleContext.Provider value={roleValue}>
      <CartContext.Provider value={cartValue}>{children}</CartContext.Provider>
    </RoleContext.Provider>
  );
}
