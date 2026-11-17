"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* In-app notification bell (PHASE 2). Lives in the header for every signed-in
   role. OBD-13 note: in-app feed only — no external channels. */

interface Notification {
  id: number;
  body: string;
  href: string | null;
  read: boolean;
  at: string;
}

export function NotificationBell({ onInk = true }: { onInk?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { headers: { "content-type": "application/json" } });
      if (!res.ok) return;
      const data = (await res.json()) as { items: Notification[]; unread: number };
      setItems(data.items);
      setUnread(data.unread);
    } catch {
      /* silent — notifications never block the UI */
    }
  }, []);

  // initial load + light polling while mounted (after paint; no cascading render)
  useEffect(() => {
    const t = setTimeout(() => void load(), 0);
    const iv = setInterval(() => void load(), 60_000);
    return () => { clearTimeout(t); clearInterval(iv); };
  }, [load]);

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const markAll = async () => {
    try {
      await fetch("/api/notifications/read", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
      setItems((xs) => xs.map((x) => ({ ...x, read: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  const openItem = async (n: Notification) => {
    if (!n.read) {
      void fetch("/api/notifications/read", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: n.id }) });
      setItems((xs) => xs.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
    if (n.href) router.push(n.href);
  };

  const iconColor = onInk ? "text-white" : "text-ink";

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className={`relative flex h-9 w-9 items-center justify-center rounded-[2px] ${iconColor} hover:bg-white/10`}
      >
        <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
          <path d="M6 8a6 6 0 0 1 12 0c0 5 1.5 6.5 2 7H4c.5-.5 2-2 2-7Z" strokeLinejoin="round" />
          <path d="M9.5 19a2.5 2.5 0 0 0 5 0" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[16px] items-center justify-center rounded-full bg-ember px-1 font-mono text-[10px] font-semibold leading-none text-white" style={{ height: 16 }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(360px,88vw)] overflow-hidden rounded-[2px] border border-n200 bg-chalk shadow-raised">
          <div className="flex items-center justify-between border-b border-n200 px-4 py-2.5">
            <span className="font-mono text-[11px] uppercase tracking-[.07em] text-n600">Notifications</span>
            {unread > 0 && (
              <button onClick={() => void markAll()} className="text-[12px] font-semibold text-ember-deep hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-n600">You&rsquo;re all caught up.</div>
            ) : (
              items.map((n) => {
                const inner = (
                  <div className={`flex gap-2.5 border-b border-n100 px-4 py-3 text-left last:border-b-0 hover:bg-paper ${n.read ? "" : "bg-info-t/40"}`}>
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.read ? "bg-n400" : "bg-ember"}`} aria-hidden />
                    <span className="min-w-0">
                      <span className="block text-[13px] leading-snug text-ink">{n.body}</span>
                      <span className="mt-0.5 block font-mono text-[10px] text-n600">{n.at}</span>
                    </span>
                  </div>
                );
                return n.href ? (
                  <button key={n.id} onClick={() => void openItem(n)} className="block w-full">{inner}</button>
                ) : (
                  <button key={n.id} onClick={() => void openItem(n)} className="block w-full cursor-default">{inner}</button>
                );
              })
            )}
          </div>
          <div className="border-t border-n200 px-4 py-2 text-center">
            <span className="font-mono text-[10px] uppercase tracking-wide text-n400">in-app only · channels pending (obd-13)</span>
          </div>
        </div>
      )}
    </div>
  );
}

