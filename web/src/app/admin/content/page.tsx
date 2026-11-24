import { Suspense } from "react";
import type { Metadata } from "next";
import { NoteFlag, Sect } from "@/components/buyer-ui";
import { PanelSkeleton } from "@/components/skeletons";
import { AdminGate } from "@/components/admin-shell";
import { AdminHead } from "@/components/admin-ui";
import { CategoryHeroRow, CategoryIntroRow, HeroSlideEditor } from "@/components/admin-content-actions";
import { getAdminCounts, getSiteContentAdmin } from "@/lib/admin-api";

/* ADM website content (ADR-0021) — homepage hero carousel slides and
   per-category hero image/intro text, all previously hardcoded in
   hero-carousel.tsx / nav-catalogue.ts / catalog-copy.ts. Those files
   now hold only the seed/fallback values; this page edits the live
   site_content rows that the public pages actually read. */

export const metadata: Metadata = { title: "Website Content" };

export default function AdminContentPage() {
  return (
    <Suspense fallback={<main><PanelSkeleton /></main>}>
      <AdminContentPageContent />
    </Suspense>
  );
}

async function AdminContentPageContent() {
  const counts = await getAdminCounts();
  if (!counts) return <AdminGate />;

  const content = await getSiteContentAdmin();
  if (!content) return <AdminGate />;

  const nextSortOrder = content.heroSlides.length
    ? Math.max(...content.heroSlides.map((s) => s.sortOrder)) + 1
    : 0;

  return (
    <main>
      <AdminHead
        title="Website Content"
        sub="Homepage hero carousel and per-category banner images/text — changes go live immediately on the public site"
      />

      <Sect>Homepage hero slides</Sect>
      <div className="grid gap-4">
        {content.heroSlides.map((s) => <HeroSlideEditor key={s.id} slide={s} />)}
        <HeroSlideEditor nextSortOrder={nextSortOrder} />
      </div>
      <NoteFlag className="mt-2.5">
        slides render in sort-order; inactive slides are hidden from the public homepage but kept here for reuse
      </NoteFlag>

      <Sect>Category hero images</Sect>
      <div className="rounded-[2px] border border-n200 bg-chalk">
        {content.categoryHero.map((row) => <CategoryHeroRow key={row.slug} row={row} />)}
      </div>

      <Sect>Category intro text</Sect>
      <div className="rounded-[2px] border border-n200 bg-chalk">
        {content.categoryIntro.map((row) => <CategoryIntroRow key={row.slug} row={row} />)}
      </div>
    </main>
  );
}
