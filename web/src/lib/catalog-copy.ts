/* ============================================================
   Catalogue category copy — SERVER-SAFE shared module (no
   "use client"): imported by the catalogue page (server) to give
   each of the 12 categories its own breadcrumb description and a
   context-appropriate label for the subcategory ("type") filter.

   Every description is factual and derived from the category's
   ACTUAL subcategory coverage in the product data — no fabricated
   claims (no ratings, stock, delivery or discount language). If a
   slug is missing here the page falls back to a neutral default,
   so adding a category never breaks the build.
   ============================================================ */

/** One-line category description shown under the catalogue heading. */
export const CATEGORY_INTRO: Record<string, string> = {
  cricket:
    "Bats, balls, protective gear, ground equipment and kit storage — sourced at wholesale for clubs, academies and institutions.",
  football:
    "Match and training balls, goals and nets, training aids and protection for teams, schools and grounds.",
  basketball:
    "Indoor and outdoor balls, court equipment and team kit storage for schools, clubs and academies.",
  volleyball:
    "Match balls, nets, posts and court equipment for institutions, academies and training programmes.",
  badminton:
    "Racquets, shuttlecocks, nets, posts, strings and grips for clubs, schools and coaching programmes.",
  tennis:
    "Racquets, balls, nets, posts and court equipment for academies, clubs and institutions.",
  athletics:
    "Track equipment, field equipment and timing & measurement gear for meets, schools and training.",
  "gym-fitness":
    "Free weights, conditioning tools, mats and flooring for institutional strength and conditioning.",
  "indoor-games":
    "Table tennis, carrom and board games for recreation rooms, hostels and institutions.",
  "outdoor-games":
    "Field games, playground equipment and skating gear for schools and community grounds.",
  sportswear:
    "Team wear, training wear, outerwear, socks and baselayers — kitted in sets for squads and institutions.",
  accessories:
    "Hydration, bags, officiating gear, inflation & care and first aid to complete every institutional order.",
};

/** Context label for the subcategory filter, per category. Falls back to
 *  the neutral "Type" when a category isn't listed. Purely cosmetic — the
 *  options themselves are always derived from that category's own products. */
export const TYPE_FILTER_LABEL: Record<string, string> = {
  cricket: "Equipment",
  football: "Equipment",
  basketball: "Equipment",
  volleyball: "Equipment",
  badminton: "Category",
  tennis: "Category",
  athletics: "Equipment",
  "gym-fitness": "Equipment",
  "indoor-games": "Game",
  "outdoor-games": "Category",
  sportswear: "Apparel",
  accessories: "Category",
};

export const defaultIntro =
  "Wholesale sports equipment and kit for schools, academies, clubs and institutional buyers.";
