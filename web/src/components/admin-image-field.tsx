"use client";

import { useEffect, useRef, useState } from "react";
import { inputCls, labelCls } from "@/components/admin-ui";

/* ============================================================
   Shared product-image control — used by the Add Product form AND
   the per-row "Edit image" control on the Products table, so the
   three paths to a valid `img` value (upload / library / manual
   path) exist in exactly one place.

   Three paths, all writing the same plain string value: (1) "Upload
   from device" — real upload to DigitalOcean Spaces (ADR-0013,
   server/storage.ts), admin-trusted at the moment of upload, not a
   second approval step; (2) "Browse library" — read-only picker over
   files already committed under public/img/<category>/ by the
   photography programme (server/media.ts); (3) typing a known
   /img/... path directly. Server-side `assertImgPath` in
   server/admin.ts is the actual authority — it accepts only an
   /img/... path or a URL on this app's own configured upload host,
   never an arbitrary external URL; `isImgPathPlausible` below is only
   a client-side pre-check so the Save/Add button isn't needlessly
   disabled, never the security boundary.
   ============================================================ */

export const IMG_RE = /^\/img\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp)$/i;

/** Client-side plausibility check only — loose on purpose (any https://
 *  URL passes) since the server independently re-validates the host. */
export function isImgPathPlausible(value: string): boolean {
  const trimmed = value.trim();
  return trimmed === "" || IMG_RE.test(trimmed) || /^https:\/\//i.test(trimmed);
}

/** Thumbnail grid of files already committed under public/img/<catSlug>/ —
 *  browse-and-pick instead of typing the exact filename. Read-only: never
 *  uploads, never writes; re-fetches whenever the category changes since
 *  the library is scoped per category. */
function LibraryPicker({
  catSlug, onPick, onClose,
}: { catSlug: string; onPick: (path: string) => void; onClose: () => void }) {
  const [images, setImages] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setImages(null);
    setError(null);
    fetch(`/api/admin/catalog-images?cat=${encodeURIComponent(catSlug)}`)
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as { images?: string[]; error?: string } | null;
        if (cancelled) return;
        if (!res.ok) { setError(data?.error ?? "Couldn't load the library."); return; }
        setImages(data?.images ?? []);
      })
      .catch(() => { if (!cancelled) setError("Couldn't load the library — check your connection."); });
    return () => { cancelled = true; };
  }, [catSlug]);

  return (
    <div className="mt-2.5 rounded-[2px] border border-n200 bg-chalk p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wide text-n600">
          Approved library — {catSlug}
        </p>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-n600 hover:text-ink">
          Close
        </button>
      </div>
      {error ? (
        <p className="text-sm text-bad">{error}</p>
      ) : images === null ? (
        <p className="text-sm text-n600">Loading…</p>
      ) : images.length === 0 ? (
        <p className="text-sm text-n600">
          No approved photos on file for this category yet — the photography programme hasn&rsquo;t placed any under public/img/{catSlug}/.
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-8">
          {images.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => onPick(src)}
              title={src}
              className="group aspect-square overflow-hidden rounded-[2px] border border-n200 hover:border-ember-deep"
            >
              <img src={src} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ImagePathField({
  value, onChange, catSlug, idPrefix = "pf-img",
}: {
  value: string;
  onChange: (next: string) => void;
  /** scopes the library picker and the upload destination folder */
  catSlug: string;
  idPrefix?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const [imgFromUpload, setImgFromUpload] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trimmed = value.trim();

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("catSlug", catSlug);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        setUploadErr(data?.error ?? "Upload failed — please try again.");
        return;
      }
      onChange(data.url);
      setImgFromUpload(true);
      setImgError(false);
    } catch {
      setUploadErr("Upload failed — check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className={labelCls} htmlFor={idPrefix}>Image path</label>
        <div className="mb-1.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs font-semibold text-ember-deep hover:underline disabled:cursor-not-allowed disabled:text-n400"
          >
            {uploading ? "Uploading…" : "Upload from device…"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void uploadFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="text-xs font-semibold text-ember-deep hover:underline"
          >
            {pickerOpen ? "Hide library" : "Browse library…"}
          </button>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <input
          id={idPrefix} type="text" value={value}
          onChange={(e) => { onChange(e.target.value); setImgError(false); setImgFromUpload(false); }}
          placeholder="/img/cricket/new-bat-hero.jpg or upload/browse above"
          className={`${inputCls} font-mono text-[12.5px]`}
        />
        {trimmed && (IMG_RE.test(trimmed) || imgFromUpload) && (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[2px] border border-n200 bg-n100">
            {/* plain img, not next/image — admin-entered path, checked live via onError */}
            <img
              src={trimmed}
              alt=""
              className="h-full w-full object-cover"
              onError={() => setImgError(true)}
              onLoad={() => setImgError(false)}
            />
          </div>
        )}
      </div>
      {uploadErr ? (
        <p className="mt-1 text-xs font-medium text-bad">{uploadErr}</p>
      ) : trimmed && !IMG_RE.test(trimmed) && !imgFromUpload ? (
        <p className="mt-1 text-xs font-medium text-bad">
          Must look like /img/category/file-name.jpg — a path under this app&rsquo;s own approved-photography tree — or come from Upload/Browse above.
        </p>
      ) : trimmed && imgError ? (
        <p className="mt-1 text-xs font-medium text-bad">
          No file found at this path — confirm the photography programme has placed it under public/img/ first.
        </p>
      ) : (
        <p className="mt-1 text-xs text-n600">
          Upload a photo from this device, pick one already approved in the library, or type a known
          path. Leave blank to remove the image; the product shows the placeholder hatch instead.
        </p>
      )}
      {pickerOpen && (
        <LibraryPicker
          catSlug={catSlug}
          onClose={() => setPickerOpen(false)}
          onPick={(path) => { onChange(path); setImgError(false); setImgFromUpload(false); setUploadErr(null); setPickerOpen(false); }}
        />
      )}
    </div>
  );
}
