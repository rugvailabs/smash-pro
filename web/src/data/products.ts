import type { Category, Product } from "@/lib/types";

/** SAMPLE DATA — illustrative preview catalogue. Kept apart from UI;
 *  consumed only via src/lib/catalog.ts (the future API boundary). */

export const CATEGORIES: Category[] = [
  { slug: "cricket", name: "Cricket", count: 312 },
  { slug: "football", name: "Football", count: 198 },
  { slug: "basketball", name: "Basketball", count: 86 },
  { slug: "volleyball", name: "Volleyball", count: 64 },
  { slug: "badminton", name: "Badminton", count: 214 },
  { slug: "tennis", name: "Tennis", count: 121 },
  { slug: "athletics", name: "Athletics", count: 153 },
  { slug: "gym-fitness", name: "Gym & Fitness", count: 240 },
  { slug: "indoor-games", name: "Indoor Games", count: 92 },
  { slug: "outdoor-games", name: "Outdoor Games", count: 77 },
  { slug: "sportswear", name: "Sportswear", count: 168 },
  { slug: "accessories", name: "Accessories", count: 134 },
];

export const PRODUCTS: Product[] = [
  {
    sku: "CR-0417", name: "English Willow Bat — Grade 2, Short Handle",
    cat: "cricket", sub: "Bats", img: "/img/cricket/eng-willow-bat-g2-hero.jpg",
    meta: "1,180–1,250 g · 8–10 grains", std: 4850, buyer: 4122.5,
    specs: [
      ["Willow grade", "Grade 2 English willow, 8–10 grains"],
      ["Weight range", "1,180 – 1,250 g"],
      ["Handle", "Short handle, 12-piece cane, octagonal"],
      ["Edge / spine", "38–40 mm edge · 63 mm spine"],
      ["Supplied", "With full-length bat cover; knocking-in recommended"],
    ],
  },
  {
    sku: "CR-0301", name: "Kashmir Willow Bat — Match, Full Size",
    cat: "cricket", sub: "Bats", img: "/img/cricket/kashmir-willow-match-hero.jpg",
    meta: "1,200–1,280 g · full size", std: 1650, buyer: 1402.5,
    specs: [
      ["Willow", "Kashmir willow, match grade"],
      ["Weight range", "1,200 – 1,280 g"],
      ["Handle", "Short handle, cane"],
    ],
  },
  {
    sku: "CR-0512", name: "Leather Match Ball — 4-Piece Red, Box of 6",
    cat: "cricket", sub: "Balls", img: "/img/cricket/leather-match-ball-hero.jpg",
    meta: "156 g · alum-tanned leather", std: 2940, buyer: 2499,
    specs: [
      ["Construction", "4-piece, alum-tanned leather"],
      ["Weight", "156 g"],
      ["Pack", "Box of 6"],
    ],
  },
  {
    sku: "CR-0613", name: "Batting Pads — Youth, Ambidextrous Pair",
    cat: "cricket", sub: "Protection", img: "/img/cricket/batting-pads-hero.jpg",
    meta: "Cane-reinforced · 2 sizes", std: 1320, buyer: 1122,
    specs: [
      ["Construction", "Cane-reinforced, PVC facing"],
      ["Sizes", "Youth S / M"],
    ],
  },
  {
    sku: "CR-0624", name: "Batting Gloves — Match Grade, Right Hand",
    cat: "cricket", sub: "Protection", img: "/img/cricket/batting-gloves-hero.jpg",
    meta: "Sheep leather palm", std: 980, buyer: 833,
    specs: [
      ["Palm", "Sheep leather"],
      ["Protection", "Sectioned foam, finger rolls"],
    ],
  },
  {
    sku: "CR-0705", name: "Cricket Helmet — Steel Grille, Size M",
    cat: "cricket", sub: "Protection", img: "/img/cricket/helmet-hero.jpg",
    meta: "Adjustable · steel grille", std: 1760, buyer: 1496,
    specs: [
      ["Grille", "Steel, adjustable"],
      ["Size", "M (56–58 cm), adjustable"],
    ],
  },
  {
    sku: "CR-0808", name: "Team Kit Bag — 85 L, Wheeled",
    cat: "cricket", sub: "Kit & storage", img: "/img/cricket/team-kit-bag-hero.jpg",
    meta: "600D polyester · wheeled", std: 2310, buyer: 1963.5,
    specs: [
      ["Capacity", "85 L"],
      ["Material", "600D polyester, wheeled base"],
    ],
  },
  {
    sku: "CR-0901", name: "Practice Net — 60 × 10 ft, HDPE",
    cat: "cricket", sub: "Ground equipment", img: "/img/cricket/practice-net-hero.jpg",
    meta: "UV-stabilised HDPE twine", std: 3480, buyer: 2958,
    specs: [
      ["Size", "60 × 10 ft"],
      ["Material", "UV-stabilised HDPE twine"],
    ],
  },
  {
    sku: "BD-2001", name: "Tour Carbon Racquet — 3U, Head-Heavy",
    cat: "badminton", sub: "Racquets", img: "/img/badminton/racquet-tour-hero.jpg",
    meta: "Full graphite · 88 g · strung to order", std: 5400, buyer: 4590,
    configurable: true,
    specs: [
      ["Frame", "Full graphite, head-heavy balance"],
      ["Weight", "3U (85–89 g)"],
      ["Max tension", "30 lbs"],
      ["Shaft", "Medium flex"],
      ["Supplied", "Strung & gripped to order · full-length cover"],
    ],
  },
  {
    sku: "BD-1104", name: "Feather Shuttlecocks — Tournament, Tube of 12",
    cat: "badminton", sub: "Shuttles", img: "/img/badminton/shuttlecocks-hero.jpg",
    meta: "Speed 77 · tube of 12", std: 1240, buyer: 1054,
    specs: [
      ["Feather", "Goose feather, tournament grade"],
      ["Speed", "77"],
      ["Pack", "Tube of 12"],
    ],
  },
  {
    sku: "BB-0101", name: "Competition Basketball — Size 7, Indoor/Outdoor",
    cat: "basketball", sub: "Balls", img: "/img/basketball/comp-size7-hero.jpg",
    meta: "Size 7 · indoor/outdoor rubber", std: 1980, buyer: 1683,
    specs: [
      ["Size", "7 (official)"],
      ["Surface", "Indoor / outdoor rubber"],
    ],
  },
  {
    sku: "SW-3001", name: "Polyester Match Jersey Set — Team of 11",
    cat: "sportswear", sub: "Team wear", img: "/img/sportswear/match-jersey-hero.jpg",
    meta: "Sublimation print · team of 11", std: 5720, buyer: 4862,
    specs: [
      ["Fabric", "Breathable polyester"],
      ["Print", "Full sublimation"],
      ["Set", "11 jerseys + shorts"],
    ],
  },
];

/** Racquet configurator options (owner-directed feature; option pricing
 *  ILLUSTRATIVE — pending approval; product-options capability is a new
 *  requirement to document). */
export const RACQUET_OPTIONS = {
  string: [
    { value: "Tour Nylon", note: "included", delta: 0 },
    { value: "Premium Gauge", note: "+ ₹350.00 · illustrative", delta: 350 },
  ],
  tension: [
    { value: "22 lbs", note: "control · beginners" },
    { value: "24 lbs", note: "all-round" },
    { value: "26 lbs", note: "club play" },
    { value: "28 lbs", note: "advanced" },
    { value: "30 lbs", note: "tournament" },
  ],
  grip: [
    { value: "G4", note: "standard" },
    { value: "G5", note: "slim" },
  ],
};
