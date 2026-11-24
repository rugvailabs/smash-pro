"use client";

import { useRef, useState } from "react";
import { inputCls, labelCls } from "@/components/admin-ui";
import { IMG_RE } from "@/components/admin-image-field";

/* ============================================================
   Site-content image control (ADR-0021) — hero slides / category
   banners. Same upload mechanism as the product ImagePathField
   (DigitalOcean Spaces), but not scoped to a product category, so
   it posts to its own upload endpoint with a free-text `folder`
   instead of a validated catSlug. No library browser here (site
   images aren't pre-populated by the photography programme the way
   product categories are) — upload or type a known /img/... path.
   ============================================================ */

export function SiteImagePathField({
  value, onChange, folder, idPrefix,
}: { value: string; onChange: (next: string) => void; folder: string; idPrefix: string }) {
  const [imgError, setImgError] = useState(false);
  const [imgFromUpload, setImgFromUpload] = useState(false);
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
      fd.append("folder", folder);
      const res = await fetch("/api/admin/upload-site-image", { method: "POST", body: fd });
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
        <label className={labelCls} htmlFor={idPrefix}>Image</label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mb-1.5 text-xs font-semibold text-ember-deep hover:underline disabled:cursor-not-allowed disabled:text-n400"
        >
          {uploading ? "Uploading…" : "Upload from device…"}
        </button>
        <input
          ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
          onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; if (file) void uploadFile(file); }}
        />
      </div>
      <div className="flex items-start gap-3">
        <input
          id={idPrefix} type="text" value={value}
          onChange={(e) => { onChange(e.target.value); setImgError(false); setImgFromUpload(false); }}
          placeholder="/img/hero/slide.png or upload above"
          className={`${inputCls} font-mono text-[12.5px]`}
        />
        {trimmed && (IMG_RE.test(trimmed) || imgFromUpload) && (
          <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-[2px] border border-n200 bg-n100">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-entered path, checked live via onError, not worth next/image here */}
            <img src={trimmed} alt="" className="h-full w-full object-cover" onError={() => setImgError(true)} onLoad={() => setImgError(false)} />
          </div>
        )}
      </div>
      {uploadErr ? (
        <p className="mt-1 text-xs font-medium text-bad">{uploadErr}</p>
      ) : trimmed && !IMG_RE.test(trimmed) && !imgFromUpload ? (
        <p className="mt-1 text-xs font-medium text-bad">
          Must look like /img/hero/file.jpg — a path under this app&rsquo;s own approved tree — or come from Upload above.
        </p>
      ) : trimmed && imgError ? (
        <p className="mt-1 text-xs font-medium text-bad">No file found at this path.</p>
      ) : null}
    </div>
  );
}
