"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSuggestions, loadSearchHistory, pushSearchHistory, clearSearchHistory, type Suggestion } from "@/lib/suggest";

/* ============================================================
   Storefront header search — rounded field (radius capped at 4px
   per Court Ink), leading icon, live suggestions grouped by
   Products/Categories, plus a "recent searches" panel when the
   field is empty. Fully client-side (ADR-0008) — no network call.
   ============================================================ */

function Match({ text, q }: { text: string; q: string }) {
  const i = text.toLowerCase().indexOf(q.trim().toLowerCase());
  if (i < 0 || !q.trim()) return <>{text}</>;
  const end = i + q.trim().length;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-semibold">{text.slice(i, end)}</span>
      {text.slice(end)}
    </>
  );
}

export function SearchBox({ variant = "header", onNavigate }: { variant?: "header" | "drawer"; onNavigate?: () => void }) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [history, setHistory] = useState<string[]>([]);
  const rootRef = useRef<HTMLFormElement>(null);

  useEffect(() => setHistory(loadSearchHistory()), [open]);

  const items = useMemo(() => getSuggestions(q), [q]);
  const showSuggestions = open && q.trim().length >= 2 && items.length > 0;
  const showHistory = open && q.trim().length < 2 && history.length > 0;
  const showPanel = showSuggestions || showHistory;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    setActive(-1);
    onNavigate?.();
    router.push(href);
  };

  const runSearch = (term: string) => {
    pushSearchHistory(term);
    setOpen(false);
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); setActive(-1); return; }
    if (showSuggestions) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); }
      else if (e.key === "Enter" && active >= 0) { e.preventDefault(); go(items[active].href); }
    }
  };

  const groups = useMemo(() => {
    const order: Suggestion["group"][] = ["Categories", "Products"];
    return order
      .map((g) => ({ g, rows: items.map((s, i) => ({ s, i })).filter((r) => r.s.group === g) }))
      .filter((x) => x.rows.length > 0);
  }, [items]);

  return (
    <form
      ref={rootRef}
      role="search"
      className={variant === "header" ? "relative hidden max-w-[680px] flex-1 md:block" : "relative"}
      onSubmit={(e) => {
        e.preventDefault();
        if (active >= 0 && showSuggestions) { go(items[active].href); return; }
        if (q.trim()) runSearch(q);
      }}
    >
      <svg viewBox="0 0 24 24" aria-hidden className={"pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 fill-none stroke-current " + (variant === "header" ? "text-n600" : "text-white/55")} strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
      </svg>
      <input
        name="q"
        type="search"
        placeholder="Search equipment, categories…"
        aria-label="Search"
        autoComplete="off"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        className={
          variant === "header"
            ? "h-12 w-full rounded-full border border-transparent bg-n100 pl-11 pr-4 text-base text-ink placeholder:text-n600 focus:border-n400 focus:outline-none md:text-sm"
            : "h-10 w-full rounded-[4px] border border-white/25 bg-ink2 pl-10 pr-3 text-base text-white placeholder:text-white/45 md:text-sm"
        }
      />
      {showPanel && (
        <ul id={listId} role="listbox" aria-label="Search suggestions" className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[60vh] overflow-y-auto rounded-[4px] border border-n200 bg-chalk py-1 shadow-raised">
          {showHistory && (
            <li role="presentation" className="border-b border-n100 py-1">
              <div className="flex items-center justify-between px-3 pb-0.5 pt-1">
                <span className="font-mono text-[10px] uppercase tracking-[.08em] text-n400">Recent searches</span>
                <button type="button" onClick={() => { clearSearchHistory(); setHistory([]); }} className="text-[11px] font-medium text-ember-deep hover:underline">Clear</button>
              </div>
              <ul role="presentation">
                {history.map((h) => (
                  <li key={h}>
                    <button type="button" onPointerDown={(e) => { e.preventDefault(); setQ(h); runSearch(h); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink hover:bg-n100">
                      <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 shrink-0 fill-none stroke-n400" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>
                      {h}
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          )}
          {groups.map(({ g, rows }) => (
            <li key={g} role="presentation" className="border-b border-n100 py-1 last:border-b-0">
              <div className="px-3 pb-0.5 pt-1 font-mono text-[10px] uppercase tracking-[.08em] text-n400" aria-hidden>{g}</div>
              <ul role="presentation">
                {rows.map(({ s, i }) => (
                  <li
                    key={s.href}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={active === i}
                    className={"flex cursor-pointer items-baseline gap-3 px-3 py-2 text-sm text-ink " + (active === i ? "bg-n100" : "hover:bg-n100")}
                    onPointerDown={(e) => { e.preventDefault(); pushSearchHistory(q); go(s.href); }}
                    onPointerEnter={() => setActive(i)}
                  >
                    <span className="min-w-0 flex-1 truncate"><Match text={s.label} q={q} /></span>
                    {s.meta && <span className="shrink-0 font-mono text-[11px] text-n600">{s.meta}</span>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
