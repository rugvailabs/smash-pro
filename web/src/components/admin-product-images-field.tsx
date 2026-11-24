"use client";

import { ImagePathField } from "@/components/admin-image-field";
import { btnGhostSm } from "@/components/admin-ui";

/* ============================================================
   Up to 4 images per product: one required "main" image (the card/
   list thumbnail and the PDP's first gallery frame) plus up to 3
   optional additional images (the PDP gallery's remaining frames —
   see product-gallery.tsx — and the catalogue card's hover-swap
   frame, which uses the first additional image). Each slot reuses
   the same ImagePathField control (upload / library / known path)
   as the main image always has.
   ============================================================ */

const MAX_EXTRA = 3;

export function ProductImagesField({
  img, onImgChange, gallery, onGalleryChange, catSlug, idPrefix = "pf",
}: {
  img: string;
  onImgChange: (next: string) => void;
  gallery: string[];
  onGalleryChange: (next: string[]) => void;
  catSlug: string;
  idPrefix?: string;
}) {
  const setAt = (i: number, v: string) => {
    const next = [...gallery];
    next[i] = v;
    onGalleryChange(next);
  };
  const removeAt = (i: number) => onGalleryChange(gallery.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3.5">
      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wide text-n600">
          Image 1 of {MAX_EXTRA + 1} — main image
        </p>
        <ImagePathField value={img} onChange={onImgChange} catSlug={catSlug} idPrefix={`${idPrefix}-img-main`} />
      </div>
      {gallery.map((g, i) => (
        <div key={i}>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-wide text-n600">
              Image {i + 2} of {MAX_EXTRA + 1}
            </p>
            <button type="button" onClick={() => removeAt(i)} className="text-xs font-semibold text-bad hover:underline">
              Remove
            </button>
          </div>
          <ImagePathField value={g} onChange={(v) => setAt(i, v)} catSlug={catSlug} idPrefix={`${idPrefix}-img-extra-${i}`} />
        </div>
      ))}
      {gallery.length < MAX_EXTRA && (
        <button type="button" onClick={() => onGalleryChange([...gallery, ""])} className={btnGhostSm}>
          + Add another image
        </button>
      )}
    </div>
  );
}
