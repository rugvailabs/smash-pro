import { CATEGORIES, PRODUCTS } from "@/data/products";

/* ============================================================
   Catalogue navigation model — the single source of truth for the
   buyer-facing mega menu (desktop panel + mobile accordion).

   Pure and synchronous: it derives everything from the static
   PRODUCTS array at module load, so the menu renders instantly with
   zero network cost. No pricing, no roles, no server boundary — this
   is navigation structure only (names, subcategories, SKUs, links).

   Links produced (routes that already exist — do not break them):
     • Category     /catalog?cat=<slug>
     • Subcategory  /catalog?cat=<slug>&sub=<encoded sub label>
     • Product      /product/<sku>
   ============================================================ */

/** Slug → display label for the 12 catalogue categories. */
export const CATEGORY_LABELS: Record<string, string> = {
  cricket: "Cricket",
  football: "Football",
  basketball: "Basketball",
  volleyball: "Volleyball",
  badminton: "Badminton",
  tennis: "Tennis",
  athletics: "Athletics",
  "gym-fitness": "Gym & Fitness",
  "indoor-games": "Indoor Games",
  "outdoor-games": "Outdoor Games",
  sportswear: "Sportswear",
  accessories: "Accessories",
};

/** Slug → featured hero image, or null when approved photography is
 *  pending (the menu then renders the labelled placeholder frame).
 *  Only real, on-disk imagery is referenced — never invent paths.
 *  Fill a slug in here as its hero photography lands. */
export const CATEGORY_HERO: Record<string, string | null> = {
  cricket: "/img/cricket/eng-willow-bat-g2-hero.jpg",
  football: "/img/football/match-football-hero.jpg",
  basketball: "/img/basketball/comp-size7-hero.jpg",
  volleyball: "/img/volleyball/volleyball-match-hero.jpg",
  badminton: "/img/badminton/racquet-tour-hero.jpg",
  tennis: "/img/tennis/tennis-balls-hero.jpg",
  athletics: "/img/athletics/hurdle-training-hero.jpg",
  "gym-fitness": "/img/gym-fitness/barbell-hero.jpg",
  "indoor-games": "/img/indoor-games/chess-set-hero.jpg",
  "outdoor-games": "/img/outdoor-games/roller-skates-hero.jpg",
  sportswear: "/img/sportswear/match-jersey-hero.jpg",
  accessories: "/img/accessories/duffel-bag-hero.jpg",
};

/** How many SKUs to surface as quick links under each subcategory. */
const SKUS_PER_SUB = 4;
/** How many "popular" SKUs to surface per category. */
const POPULAR_PER_CAT = 3;

export interface NavSku {
  sku: string;
  name: string;
  href: string;
}

export interface NavSub {
  label: string;
  href: string;
  skus: NavSku[];
}

export interface NavCategory {
  slug: string;
  label: string;
  /** Featured hero image path, or null ⇒ placeholder frame. */
  hero: string | null;
  /** Link to the full category view (/catalog?cat=slug). */
  href: string;
  subs: NavSub[];
  popular: NavSku[];
}

const categoryHref = (slug: string) => `/catalog?cat=${slug}`;
// the catalogue page filters subcategories via ?type=<sub> — link to it so the
// menu's subcategory links filter live (not just land on the category)
const subHref = (slug: string, sub: string) =>
  `/catalog?cat=${slug}&type=${encodeURIComponent(sub)}`;
const productHref = (sku: string) => `/product/${sku}`;

function buildCategory(slug: string): NavCategory {
  const label = CATEGORY_LABELS[slug] ?? slug;
  const items = PRODUCTS.filter((p) => p.cat === slug);

  // Subcategories in first-appearance order (mirrors the data's intent
  // ordering — no manual list to drift out of sync with the catalogue).
  const subOrder: string[] = [];
  const bySub = new Map<string, NavSku[]>();
  for (const p of items) {
    if (!bySub.has(p.sub)) {
      bySub.set(p.sub, []);
      subOrder.push(p.sub);
    }
    bySub.get(p.sub)!.push({ sku: p.sku, name: p.name, href: productHref(p.sku) });
  }

  const subs: NavSub[] = subOrder.map((sub) => ({
    label: sub,
    href: subHref(slug, sub),
    skus: bySub.get(sub)!.slice(0, SKUS_PER_SUB),
  }));

  const popular: NavSku[] = items
    .slice(0, POPULAR_PER_CAT)
    .map((p) => ({ sku: p.sku, name: p.name, href: productHref(p.sku) }));

  return { slug, label, hero: CATEGORY_HERO[slug] ?? null, href: categoryHref(slug), subs, popular };
}

/* Built once at module load, in the catalogue's canonical category order
   (CATEGORIES from the data layer). buildCatalogueNav() returns this shared,
   immutable structure — there is no per-call work. */
const CATALOGUE_NAV: readonly NavCategory[] = CATEGORIES.map((c) => buildCategory(c.slug));

/** The ordered catalogue navigation model — the menu's single source of
 *  truth. Pure/synchronous; safe to call in a client component. */
export function buildCatalogueNav(): readonly NavCategory[] {
  return CATALOGUE_NAV;
}

/* ============================================================
   Public header model (redesign): Sports & Equipment split,
   plus the Institutions / How-it-works / Suppliers panels.
   Every href points at an EXISTING route — no invented pages.
   ============================================================ */

/** Shop by Sport — the 9 play categories, in catalogue order. */
export const SPORT_SLUGS = [
  "cricket", "football", "basketball", "volleyball", "badminton",
  "tennis", "athletics", "indoor-games", "outdoor-games",
] as const;

/** Shop by Equipment — the 3 gear categories. "Sports Footwear" has no
 *  catalogue category, so it is deliberately omitted (never invented). */
export const EQUIPMENT_SLUGS = ["gym-fitness", "sportswear", "accessories"] as const;

export interface NavTile {
  slug: string;
  label: string;
  hero: string | null;
  href: string;
}
const tile = (slug: string): NavTile => ({
  slug,
  label: CATEGORY_LABELS[slug] ?? slug,
  hero: CATEGORY_HERO[slug] ?? null,
  href: categoryHref(slug),
});
export const SPORT_TILES: readonly NavTile[] = SPORT_SLUGS.map(tile);
export const EQUIPMENT_TILES: readonly NavTile[] = EQUIPMENT_SLUGS.map(tile);

export interface NavLink {
  label: string;
  href: string;
  note?: string;
}

/** For Institutions — audience segments converge on the existing
 *  registration flow; process / bulk route to existing pages. */
export const INSTITUTIONS_LINKS: readonly NavLink[] = [
  { label: "Schools & Colleges", href: "/register", note: "Register for approved institutional pricing" },
  { label: "Sports Academies", href: "/register", note: "Kit squads and training programmes" },
  { label: "Retail Shops", href: "/register", note: "Stock your store at wholesale standards" },
  { label: "Institutional Buyers", href: "/register", note: "One organisation account, every sport" },
  { label: "Bulk Purchasing", href: "/catalog?cat=cricket", note: "Browse the full wholesale catalogue" },
  { label: "Institutional Supply Process", href: "/#how", note: "How approval and ordering work" },
];
export const INSTITUTIONS_CTA: NavLink = { label: "Explore Institutional Supply", href: "/register" };

/** How It Works — five explanatory steps linking to existing pages/anchors. */
export const HOW_STEPS: readonly NavLink[] = [
  { label: "Catalogue discovery", href: "/catalog?cat=cricket", note: "Browse every sport in the open" },
  { label: "Organisation registration", href: "/register", note: "Register your institution" },
  { label: "Account approval", href: "/#how", note: "Reviewed before ordering is enabled" },
  { label: "Buyer-specific pricing", href: "/#how", note: "Your institutional price on approval" },
  { label: "Ordering & fulfilment", href: "/#how", note: "100% advance, managed end to end" },
];

/** For Suppliers — respects auth boundaries: public links go to registration,
 *  the supplier info section and sign-in — never to gated /supplier/* pages. */
export const SUPPLIER_LINKS: readonly NavLink[] = [
  { label: "Become a Supplier", href: "/register/supplier", note: "Register to supply Smash Pro" },
  { label: "Supply Requirements", href: "/#supply", note: "Demand matched to your categories" },
  { label: "Quotations", href: "/#supply", note: "Quote through a fair, structured process" },
  { label: "Purchase Orders", href: "/#supply", note: "Track awarded POs and payments" },
  { label: "Supplier Login", href: "/signin", note: "Access your supplier workspace" },
];
