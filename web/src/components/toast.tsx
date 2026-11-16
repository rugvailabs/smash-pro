"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

/* ============================================================
   Toast pattern (library §14): Chalk, raised shadow, success
   icon, 13px — bottom-left desktop / top mobile; auto-dismiss 5s
   with pause-on-hover + close button; aria-live="polite".
   Transient feedback only — durable confirmations get page
   sections, never toasts.
   ============================================================ */

interface ToastItem { id: number; message: string; }
interface ToastCtx { toast: (message: string) => void; }

const ToastContext = createContext<ToastCtx>({ toast: () => {} });
export function useToast() { return useContext(ToastContext); }

const DISMISS_MS = 5000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const schedule = useCallback((id: number) => {
    timers.current.set(id, setTimeout(() => dismiss(id), DISMISS_MS));
  }, [dismiss]);

  const pause = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
  }, []);

  const toast = useCallback((message: string) => {
    const id = nextId.current++;
    setItems((xs) => [...xs.slice(-2), { id, message }]);
    schedule(id);
  }, [schedule]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 top-3 z-[60] flex flex-col items-stretch gap-2 md:inset-x-auto md:bottom-5 md:left-5 md:top-auto md:w-[340px]"
      >
        {items.map((t) => (
          <div
            key={t.id}
            onMouseEnter={() => pause(t.id)}
            onMouseLeave={() => schedule(t.id)}
            className="pointer-events-auto flex items-center gap-2.5 rounded-[2px] border border-n200 bg-chalk px-3.5 py-2.5 text-[13px] text-ink shadow-raised"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0 fill-none stroke-ok" strokeWidth="2">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
            <span className="min-w-0 flex-1">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss notification"
              className="flex h-6 w-6 shrink-0 items-center justify-center text-n600 hover:text-ink"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
