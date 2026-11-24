"use client";

import { useState } from "react";
import { Panel, PanelHead } from "@/components/buyer-ui";
import { ActionError, useAdminCall } from "@/components/admin-actions";
import { AuditNote, btnEmber, btnEmberSm, btnGhostSm, inputCls, labelCls } from "@/components/admin-ui";
import { SiteImagePathField } from "@/components/admin-site-image-field";
import type { AdminCategoryHeroRow, AdminCategoryIntroRow, AdminHeroSlideRow } from "@/lib/admin-types";

/* ============================================================
   Admin content controls (ADR-0021) — hero slide add/edit/delete,
   per-category hero image, per-category intro text. Same
   useAdminCall()/ActionError pattern as every other admin mutation
   control (busy state, server error surfaced verbatim, success
   toast + router.refresh — PLT-003 audit note shown alongside).
   ============================================================ */

const emptySlide = (sortOrder: number): Omit<AdminHeroSlideRow, "id"> => ({
  sortOrder, active: true, img: "", imgPosition: "center",
  eyebrow: "", titleA: "", accent: "", titleB: "", body: "",
  ctaLabel: "", ctaHref: "/catalog?cat=cricket", institutional: false,
});

export function HeroSlideEditor({
  slide, nextSortOrder, onDone,
}: { slide?: AdminHeroSlideRow; nextSortOrder?: number; onDone?: () => void }) {
  const { busy, error, call } = useAdminCall();
  const [form, setForm] = useState<Omit<AdminHeroSlideRow, "id">>(slide ?? emptySlide(nextSortOrder ?? 0));
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const canSubmit =
    !busy && form.img.trim().length > 0 && form.eyebrow.trim().length > 0 &&
    form.titleA.trim().length > 0 && form.titleB.trim().length > 0 &&
    form.body.trim().length > 0 && form.ctaLabel.trim().length > 0 &&
    form.ctaHref.trim().startsWith("/");

  const submit = async () => {
    if (!canSubmit) return;
    const ok = await call("/api/admin/content/hero-slides", {
      body: { ...form, id: slide?.id },
      done: slide ? "Hero slide updated." : "Hero slide added.",
    });
    if (ok) {
      if (slide) onDone?.();
      else setForm(emptySlide((nextSortOrder ?? 0) + 1));
    }
  };

  const remove = async () => {
    if (!slide) return;
    if (await call(`/api/admin/content/hero-slides/${encodeURIComponent(slide.id)}`, { method: "DELETE", done: "Hero slide deleted." })) {
      onDone?.();
    }
  };

  const idp = slide?.id ?? "new";

  return (
    <Panel>
      <PanelHead
        title={slide ? `Edit — ${slide.eyebrow || slide.id}` : "Add hero slide"}
        aside={slide && (
          <label className="flex items-center gap-2 text-[13px] font-medium text-n600">
            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
            Active
          </label>
        )}
      />
      <div className="p-4">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <SiteImagePathField value={form.img} onChange={(v) => set("img", v)} folder="hero" idPrefix={`hs-img-${idp}`} />
          </div>
          <div>
            <label className={labelCls} htmlFor={`hs-pos-${idp}`}>Image position</label>
            <input id={`hs-pos-${idp}`} type="text" value={form.imgPosition} onChange={(e) => set("imgPosition", e.target.value)}
              placeholder="e.g. 78% center" className={`${inputCls} font-mono text-[12.5px]`} />
          </div>
          <div>
            <label className={labelCls} htmlFor={`hs-eyebrow-${idp}`}>Eyebrow (required)</label>
            <input id={`hs-eyebrow-${idp}`} type="text" value={form.eyebrow} onChange={(e) => set("eyebrow", e.target.value)}
              placeholder="e.g. Every sport · one catalogue" className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor={`hs-titlea-${idp}`}>Title — part A (required)</label>
            <input id={`hs-titlea-${idp}`} type="text" value={form.titleA} onChange={(e) => set("titleA", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor={`hs-accent-${idp}`}>Title — accent word</label>
            <input id={`hs-accent-${idp}`} type="text" value={form.accent} onChange={(e) => set("accent", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor={`hs-titleb-${idp}`}>Title — part B (required)</label>
            <input id={`hs-titleb-${idp}`} type="text" value={form.titleB} onChange={(e) => set("titleB", e.target.value)} className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor={`hs-body-${idp}`}>Supporting text (required)</label>
            <textarea id={`hs-body-${idp}`} value={form.body} onChange={(e) => set("body", e.target.value)} rows={2} className={`${inputCls} h-auto py-2`} />
          </div>
          <div>
            <label className={labelCls} htmlFor={`hs-ctalabel-${idp}`}>CTA label (required)</label>
            <input id={`hs-ctalabel-${idp}`} type="text" value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor={`hs-ctahref-${idp}`}>CTA link (required, internal path)</label>
            <input id={`hs-ctahref-${idp}`} type="text" value={form.ctaHref} onChange={(e) => set("ctaHref", e.target.value)}
              placeholder="/catalog?cat=cricket" className={`${inputCls} font-mono text-[12.5px]`} />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-2 text-[13px] font-medium text-ink">
              <input type="checkbox" checked={form.institutional} onChange={(e) => set("institutional", e.target.checked)} />
              Institutional slide — CTA swaps to &ldquo;Browse the catalogue&rdquo; for already-approved buyers
            </label>
          </div>
        </div>

        <ActionError error={error} />
        <div className="mt-4 flex items-center gap-2.5">
          <button onClick={() => void submit()} disabled={!canSubmit} className={btnEmber}>
            {busy ? "Saving…" : slide ? "Save changes" : "Add slide"}
          </button>
          {slide && (
            <>
              <button onClick={() => void remove()} disabled={busy} className={btnGhostSm}>Delete</button>
              {onDone && <button onClick={onDone} disabled={busy} className={btnGhostSm}>Cancel</button>}
            </>
          )}
        </div>
        <AuditNote />
      </div>
    </Panel>
  );
}

export function CategoryHeroRow({ row }: { row: AdminCategoryHeroRow }) {
  const { busy, error, call } = useAdminCall();
  const [img, setImg] = useState(row.img);
  const dirty = img.trim() !== row.img.trim();

  const save = async () => {
    await call(`/api/admin/content/category-hero/${encodeURIComponent(row.slug)}`, {
      method: "PATCH", body: { img: img.trim() }, done: `${row.label} hero image updated.`,
    });
  };

  return (
    <div className="border-b border-n100 p-4 last:border-b-0">
      <div className="mb-2 flex items-center justify-between">
        <b className="text-sm font-semibold text-ink">{row.label}</b>
        <button onClick={() => void save()} disabled={busy || !dirty} className={btnEmberSm}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      <SiteImagePathField value={img} onChange={setImg} folder={`category/${row.slug}`} idPrefix={`ch-${row.slug}`} />
      <ActionError error={error} />
    </div>
  );
}

export function CategoryIntroRow({ row }: { row: AdminCategoryIntroRow }) {
  const { busy, error, call } = useAdminCall();
  const [body, setBody] = useState(row.body);
  const dirty = body.trim() !== row.body.trim();

  const save = async () => {
    if (!body.trim()) return;
    await call(`/api/admin/content/category-intro/${encodeURIComponent(row.slug)}`, {
      method: "PATCH", body: { body: body.trim() }, done: `${row.label} description updated.`,
    });
  };

  return (
    <div className="border-b border-n100 p-4 last:border-b-0">
      <div className="mb-2 flex items-center justify-between">
        <b className="text-sm font-semibold text-ink">{row.label}</b>
        <button onClick={() => void save()} disabled={busy || !dirty || !body.trim()} className={btnEmberSm}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      <textarea
        value={body} onChange={(e) => setBody(e.target.value)} rows={2}
        className={`${inputCls} h-auto py-2`} placeholder="Category intro copy shown on the catalogue page"
      />
      <ActionError error={error} />
    </div>
  );
}
