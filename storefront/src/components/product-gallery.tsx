"use client";

import Image from "next/image";
import { useRef, useState } from "react";

/* ============================================================
   Product gallery — main frame + thumbnail rail + hover zoom
   (desktop pointer only). Same real imagery rule as the rest of
   the project: no frame, no fake photography — labelled
   placeholder instead.
   ============================================================ */

export function ProductGallery({ name, images }: { name: string; images: (string | undefined)[] }) {
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const frameRef = useRef<HTMLDivElement>(null);
  const frames = images.filter((src): src is string => Boolean(src));

  if (frames.length === 0) {
    return (
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2px] border border-n200 bg-n100">
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundImage: "repeating-linear-gradient(74deg, transparent, transparent 7px, var(--color-n200) 7px, var(--color-n200) 8px)" }}>
          <span className="bg-n100 px-1 text-center font-mono text-[9px] uppercase tracking-wide text-n400">awaiting approved photography</span>
        </div>
      </div>
    );
  }

  const main = frames[Math.min(idx, frames.length - 1)];
  const onMove = (e: React.MouseEvent) => {
    const r = frameRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div>
      <div
        ref={frameRef}
        className="relative aspect-[4/3] w-full cursor-zoom-in overflow-hidden rounded-[2px] border border-n200 bg-n100"
        onMouseEnter={() => setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={onMove}
      >
        <Image
          key={main}
          src={main}
          alt={`${name} — representative image`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 640px"
          className="object-cover transition-transform duration-150 ease-out"
          style={zoom ? { transform: "scale(1.8)", transformOrigin: `${pos.x}% ${pos.y}%` } : undefined}
        />
        <span className="pointer-events-none absolute right-2 top-2 hidden items-center gap-1 rounded-[2px] bg-ink/70 px-2 py-1 font-mono text-[10px] text-white md:flex">
          <svg viewBox="0 0 24 24" aria-hidden className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" /></svg>
          Hover to zoom
        </span>
      </div>
      {frames.length > 1 && (
        <div className="edge-fade-x mt-2.5 flex gap-2 overflow-x-auto" role="group" aria-label="Product images">
          {frames.map((src, i) => (
            <button key={src} onClick={() => setIdx(i)} aria-label={`Image ${i + 1} of ${frames.length}`} aria-pressed={i === idx} className={"relative h-16 w-16 shrink-0 overflow-hidden rounded-[2px] border bg-n100 " + (i === idx ? "border-ember-deep shadow-[inset_0_0_0_1px_var(--color-ember-deep)]" : "border-n200 hover:border-n400")}>
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-n400">representative image · cc-licensed</p>
    </div>
  );
}
