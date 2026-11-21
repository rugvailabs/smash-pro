"use client";

import { useEffect, useRef } from "react";

/* ============================================================
   Generic centred modal (scrim, Esc, focus trap, body scroll lock)
   — same dialog anatomy as the mobile NavDrawer, just a centred
   panel instead of a side sheet. Callers own their own content and
   close(); this only supplies the overlay chrome and the × button.
   ============================================================ */

export function Modal({
  open, onClose, label, maxWidth = "720px", children,
}: {
  open: boolean;
  onClose: () => void;
  /** aria-label for the dialog */
  label: string;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("[data-modal-close]")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-0 overflow-y-auto p-4 md:p-8">
        <div ref={panelRef} className="relative mx-auto w-full" style={{ maxWidth }}>
          <button
            data-modal-close
            onClick={onClose}
            aria-label="Close"
            className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white shadow-overlay hover:bg-ink2"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
              <path d="M5 5l14 14M19 5L5 19" />
            </svg>
          </button>
          {children}
        </div>
      </div>
    </div>
  );
}
