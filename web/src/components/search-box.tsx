"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchSuggestions, type Suggestion } from "@/lib/suggest";

/* ============================================================
   Header search with autocomplete (library §3): grouped panel —
   Products (name + mono SKU) · Categories · Reference IDs
   (signed-in buyer only). Min 2 chars; arrows/Enter/Esc;
   listbox semantics; matched substring in semibold, no
   highlight colour. Chalk panel, raised shadow, hairline groups.

   Animated "Search for <keyword>" placeholder layered over the real
   (blanked) native placeholder — decorative only, pointer-events-none,
   so it never intercepts clicks and never touches the real `q` value.
   Visible only while idle (unfocused + empty); hidden the instant the
   field is focused, so there's never a fake cursor next to the real
   caret. prefers-reduced-motion freezes it on the first keyword.
   ============================================================ */

const ROTATING_WORDS = [
  "cricket", "football", "badminton", "basketball", "tennis", "sports shoes", "gym equipment",
];

/** Drives the type → pause → delete → next-word cycle. Returns the
 *  current partial keyword; the effect is a no-op while `active` is
 *  false (so no timers run once the overlay is hidden).
 *
 *  `setText` is called with plain values only, never an updater
 *  function — React's dev-mode Strict Mode intentionally invokes
 *  updater functions TWICE to catch impurity, and the previous version
 *  scheduled its next setTimeout *inside* the updater, so every single
 *  tick silently scheduled itself twice (the entire animation ran at
 *  ~2x speed). All side effects (timer scheduling, phase/position
 *  tracking) now live in plain local variables mutated only from
 *  `step()` itself, never from inside a setState callback. */
function useTypewriterWord(active: boolean, reduced: boolean): string {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!active || reduced) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let phase: "typing" | "pausing" | "deleting" = "typing";
    let pos = 0;
    const word = ROTATING_WORDS[wordIndex % ROTATING_WORDS.length];

    const step = () => {
      if (cancelled) return;
      if (phase === "typing") {
        pos += 1;
        setText(word.slice(0, pos));
        if (pos >= word.length) {
          phase = "pausing";
          timer = setTimeout(step, 2200);
        } else {
          timer = setTimeout(step, 280 + Math.random() * 60);
        }
        return;
      }
      if (phase === "pausing") {
        phase = "deleting";
        timer = setTimeout(step, 120);
        return;
      }
      // deleting
      pos -= 1;
      setText(word.slice(0, Math.max(pos, 0)));
      if (pos <= 0) {
        setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
      } else {
        timer = setTimeout(step, 150 + Math.random() * 30);
      }
    };

    setText("");
    timer = setTimeout(step, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [active, reduced, wordIndex]);

  return reduced ? ROTATING_WORDS[0] : text;
}

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

export function SearchBox({
  variant = "header",
  onNavigate,
}: {
  /** header: ink band styling · drawer: on-ink full-width row */
  variant?: "header" | "drawer";
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const listId = useId();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [items, setItems] = useState<Suggestion[]>([]);
  const rootRef = useRef<HTMLFormElement>(null);
  const [focused, setFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);

  // avoids a hydration mismatch: SSR/first client render both show the
  // plain native placeholder; the animated overlay takes over post-mount
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setReduced(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  // idle only: hidden the instant the field is focused or holds text —
  // never fights the user's own caret, never touches their typed value
  const showTypewriter = mounted && !focused && q.length === 0;
  const typedWord = useTypewriterWord(showTypewriter, reduced);

  // debounced server suggestions (integration point I2)
  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      if (q.trim().length < 2) {
        setItems([]);
        return;
      }
      void fetchSuggestions(q, ctrl.signal)
        .then(setItems)
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const showPanel = open && items.length > 0;

  // close on outside click
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

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { setOpen(false); setActive(-1); return; }
    if (!showPanel) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % items.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? items.length - 1 : a - 1)); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); go(items[active].href); }
  };

  // group rendering preserves item order within fixed group order
  const groups = useMemo(() => {
    const order: Suggestion["group"][] = ["Products", "Categories", "Reference IDs"];
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
        if (active >= 0 && showPanel) { go(items[active].href); return; }
        setOpen(false);
        onNavigate?.();
        router.push(`/search?q=${encodeURIComponent(q)}`);
      }}
    >
      <svg
        viewBox="0 0 24 24" aria-hidden
        className={
          "pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 fill-none stroke-current " +
          (variant === "header" ? "text-n600" : "text-white/55")
        }
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
      </svg>
      <input
        name="q"
        type="search"
        placeholder={mounted ? "" : "Search equipment, categories…"}
        aria-label="Search"
        autoComplete="off"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => { setOpen(true); setFocused(true); }}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        className={
          variant === "header"
            ? "h-12 w-full rounded-full border border-transparent bg-n100 pl-11 pr-4 text-base text-ink placeholder:text-n600 focus:border-n400 focus:outline-none md:text-sm"
            : "h-10 w-full rounded-[4px] border border-white/25 bg-ink2 pl-10 pr-3 text-base text-white placeholder:text-white/45 md:text-sm"
        }
      />
      {showTypewriter && (
        <div
          aria-hidden
          className={
            "pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center overflow-hidden whitespace-nowrap text-base md:text-sm " +
            (variant === "header" ? "left-11 right-4 text-n600" : "left-10 right-3 text-white/45")
          }
        >
          <span className="truncate">
            Search for {typedWord ? <>&ldquo;{typedWord}&rdquo;</> : null}
          </span>
          <span className="search-cursor ml-px inline-block w-px shrink-0 self-stretch bg-current" />
        </div>
      )}
      {showPanel && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-[60vh] overflow-y-auto rounded-[2px] border border-n200 bg-chalk py-1 shadow-raised"
        >
          {groups.map(({ g, rows }) => (
            <li key={g} role="presentation" className="border-b border-n100 py-1 last:border-b-0">
              <div className="px-3 pb-0.5 pt-1 font-mono text-[10px] uppercase tracking-[.08em] text-n400" aria-hidden>
                {g}
              </div>
              <ul role="presentation">
                {rows.map(({ s, i }) => (
                  <li
                    key={s.href}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={active === i}
                    className={
                      "flex cursor-pointer items-baseline gap-3 px-3 py-2 text-sm text-ink " +
                      (active === i ? "bg-n100" : "hover:bg-n100")
                    }
                    onPointerDown={(e) => { e.preventDefault(); go(s.href); }}
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
