"use client";

import Image from "next/image";
import { useState } from "react";

/* ============================================================
   Product gallery (library §7): 4:3 main frame + thumbnail rail.
   The rail renders only when a product has more than one frame —
   today's interim catalogue has one, so this ships rail-ready and
   Set A photography populates it with zero code change.
   ============================================================ */

export function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const [idx, setIdx] = useState(0);
  const main = images[Math.min(idx, images.length - 1)];

  return (
    <div>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[2px] border border-n200 bg-n100">
        <Image
          key={main}
          src={main}
          alt={`${name} — representative image`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 640px"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="edge-fade-x mt-2.5 flex gap-2 overflow-x-auto" role="group" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setIdx(i)}
              aria-label={`Image ${i + 1} of ${images.length}`}
              aria-pressed={i === idx}
              className={
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-[2px] border bg-n100 " +
                (i === idx ? "border-ember-deep shadow-[inset_0_0_0_1px_var(--color-ember-deep)]" : "border-n200 hover:border-n400")
              }
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-n400">
        representative image · cc-licensed · replaced by approved product photography
      </p>
    </div>
  );
}
