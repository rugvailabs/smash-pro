import type { Category, Product } from "@/lib/types";

/** SAMPLE DATA — illustrative preview catalogue. Kept apart from UI;
 *  consumed only via src/lib/catalog.ts (the future API boundary).
 *  Complete across all 12 categories; imagery pending the photography
 *  programme for most SKUs (no `img` ⇒ labelled placeholder frame —
 *  never substitute stock photography). Category counts are the true
 *  sample-SKU counts. No brand names: brand display withheld pending
 *  authorization — generic institutional products only. */

export const CATEGORIES: Category[] = [
  { slug: "cricket", name: "Cricket", count: 10 },
  { slug: "football", name: "Football", count: 7 },
  { slug: "basketball", name: "Basketball", count: 7 },
  { slug: "volleyball", name: "Volleyball", count: 6 },
  { slug: "badminton", name: "Badminton", count: 7 },
  { slug: "tennis", name: "Tennis", count: 6 },
  { slug: "athletics", name: "Athletics", count: 7 },
  { slug: "gym-fitness", name: "Gym & Fitness", count: 7 },
  { slug: "indoor-games", name: "Indoor Games", count: 7 },
  { slug: "outdoor-games", name: "Outdoor Games", count: 6 },
  { slug: "sportswear", name: "Sportswear", count: 7 },
  { slug: "accessories", name: "Accessories", count: 7 },
];

export const PRODUCTS: Product[] = [
  /* ---------------- Cricket ---------------- */
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
    sku: "CR-0915", name: "Stumps & Bails Set — Seasoned Wood, Two Ends",
    cat: "cricket", sub: "Ground equipment",
    meta: "Seasoned hardwood · two ends", std: 1840, buyer: 1564,
    specs: [
      ["Set", "6 stumps + 4 bails (two ends)"],
      ["Material", "Seasoned hardwood, polished"],
      ["Height", "Standard 28 in"],
    ],
  },
  {
    sku: "CR-0922", name: "Boundary Cones — 23 cm, Set of 50",
    cat: "cricket", sub: "Ground equipment",
    meta: "Flexible PVC · set of 50", std: 1250, buyer: 1062.5,
    specs: [
      ["Material", "Flexible PVC, bright finish"],
      ["Height", "23 cm"],
      ["Pack", "Set of 50"],
    ],
  },

  /* ---------------- Football ---------------- */
  {
    sku: "FB-0105", name: "Football — Size 5, Thermo-bonded Match",
    cat: "football", sub: "Balls", img: "/img/football/match-football-hero.jpg",
    meta: "Size 5 · thermo-bonded, match grade", std: 1480, buyer: 1258,
    specs: [
      ["Size", "5 (official)"],
      ["Construction", "Thermo-bonded, 32-panel PU"],
      ["Bladder", "Butyl, high retention"],
      ["Grade", "Match"],
    ],
  },
  {
    sku: "FB-0112", name: "Football — Size 5, Stitched Training, Box of 6",
    cat: "football", sub: "Balls",
    meta: "Hand-stitched PU · box of 6", std: 4740, buyer: 4029,
    specs: [
      ["Size", "5"],
      ["Construction", "Hand-stitched, 32-panel PU"],
      ["Pack", "Box of 6"],
    ],
  },
  {
    sku: "FB-0118", name: "Football — Size 3, Junior Training, Box of 6",
    cat: "football", sub: "Balls",
    meta: "Size 3 · junior training · box of 6", std: 3540, buyer: 3009,
    specs: [
      ["Size", "3 (junior)"],
      ["Construction", "Machine-stitched PVC"],
      ["Pack", "Box of 6"],
    ],
  },
  {
    sku: "FB-0210", name: "Football Goal Net — Full Size, 4 mm HDPE Pair",
    cat: "football", sub: "Goals & nets",
    meta: "Fits 7.32 × 2.44 m · pair", std: 2860, buyer: 2431,
    specs: [
      ["Fits goal", "7.32 × 2.44 m (full size)"],
      ["Twine", "4 mm UV-stabilised HDPE"],
      ["Pack", "Pair"],
    ],
  },
  {
    sku: "FB-0216", name: "Pop-up Training Goal — 1.8 m, Pair",
    cat: "football", sub: "Goals & nets",
    meta: "Spring-steel frame · pair with bag", std: 3240, buyer: 2754,
    specs: [
      ["Width", "1.8 m"],
      ["Frame", "Spring steel, fold-flat"],
      ["Pack", "Pair, with carry bag and pegs"],
    ],
  },
  {
    sku: "FB-0305", name: "Training Bibs — Mesh, Set of 12",
    cat: "football", sub: "Training",
    meta: "Polyester mesh · set of 12", std: 1680, buyer: 1428,
    specs: [
      ["Fabric", "Breathable polyester mesh"],
      ["Set", "12, single colour"],
      ["Sizes", "Junior / Senior"],
    ],
  },
  {
    sku: "FB-0404", name: "Shin Guards — Slip-in, Pair",
    cat: "football", sub: "Protection",
    meta: "Polypropylene shell · 3 sizes", std: 420, buyer: 357,
    specs: [
      ["Shell", "Polypropylene, EVA backing"],
      ["Sizes", "S / M / L"],
      ["Pack", "Pair"],
    ],
  },

  /* ---------------- Basketball ---------------- */
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
    sku: "BB-0108", name: "Training Basketball — Size 6, Rubber, Box of 5",
    cat: "basketball", sub: "Balls", img: "/img/basketball/training-basketball-hero.jpg",
    meta: "Size 6 · moulded rubber · box of 5", std: 4200, buyer: 3570,
    specs: [
      ["Size", "6"],
      ["Surface", "Moulded rubber, deep channel"],
      ["Pack", "Box of 5"],
    ],
  },
  {
    sku: "BB-0115", name: "Junior Basketball — Size 5, Rubber, Box of 5",
    cat: "basketball", sub: "Balls",
    meta: "Size 5 · junior · box of 5", std: 3600, buyer: 3060,
    specs: [
      ["Size", "5 (junior)"],
      ["Surface", "Moulded rubber"],
      ["Pack", "Box of 5"],
    ],
  },
  {
    sku: "BB-0202", name: "Basketball Net — Heavy Nylon, Pair",
    cat: "basketball", sub: "Court equipment", img: "/img/basketball/basketball-net-hero.jpg",
    meta: "Heavy nylon · 12-loop · pair", std: 460, buyer: 391,
    specs: [
      ["Twine", "Heavy braided nylon"],
      ["Fit", "Standard 12-loop rim"],
      ["Pack", "Pair"],
    ],
  },
  {
    sku: "BB-0208", name: "Acrylic Backboard — 1.8 × 1.05 m, Fixed Rim",
    cat: "basketball", sub: "Court equipment",
    meta: "10 mm acrylic · fixed steel rim", std: 9800, buyer: 8330,
    specs: [
      ["Board", "10 mm acrylic, 1.8 × 1.05 m"],
      ["Rim", "Fixed steel, net included"],
      ["Mounting", "Wall or frame mount"],
    ],
  },
  {
    sku: "BB-0214", name: "Scoreboard — Manual Flip, Tabletop",
    cat: "basketball", sub: "Court equipment",
    meta: "Tabletop flip scorer · 0–99", std: 1560, buyer: 1326,
    specs: [
      ["Display", "Flip cards, 0–99 both ends"],
      ["Extras", "Period and possession indicators"],
      ["Build", "Folding PVC body"],
    ],
  },
  {
    sku: "BB-0302", name: "Ball Carry Net — Holds 12 Balls",
    cat: "basketball", sub: "Kit & storage",
    meta: "Drawstring net · holds 12", std: 540, buyer: 459,
    specs: [
      ["Capacity", "12 inflated balls"],
      ["Material", "Braided polyester net, drawstring"],
    ],
  },

  /* ---------------- Volleyball ---------------- */
  {
    sku: "VB-0104", name: "Volleyball — Match, 18-Panel PU",
    cat: "volleyball", sub: "Balls", img: "/img/volleyball/volleyball-match-hero.jpg",
    meta: "18-panel PU · match grade", std: 1260, buyer: 1071,
    specs: [
      ["Construction", "18-panel, machine-stitched PU"],
      ["Size", "Official (size 4 circumference class)"],
      ["Grade", "Match"],
    ],
  },
  {
    sku: "VB-0110", name: "Volleyball — Training, Rubber, Box of 6",
    cat: "volleyball", sub: "Balls",
    meta: "Moulded rubber · box of 6", std: 3900, buyer: 3315,
    specs: [
      ["Construction", "Moulded rubber"],
      ["Use", "Training, all surfaces"],
      ["Pack", "Box of 6"],
    ],
  },
  {
    sku: "VB-0203", name: "Volleyball Net — Competition, 9.5 m",
    cat: "volleyball", sub: "Nets & posts", img: "/img/volleyball/volleyball-net-hero.jpg",
    meta: "9.5 m · steel top cable", std: 1850, buyer: 1572.5,
    specs: [
      ["Length", "9.5 m"],
      ["Mesh", "10 cm square, HDPE"],
      ["Top", "Steel cable, double-stitched tape"],
    ],
  },
  {
    sku: "VB-0209", name: "Volleyball Posts — Telescopic Steel, Pair",
    cat: "volleyball", sub: "Nets & posts",
    meta: "Height-adjustable steel · pair", std: 9400, buyer: 7990,
    specs: [
      ["Material", "Powder-coated steel"],
      ["Height", "Adjustable 2.10 – 2.43 m"],
      ["Pack", "Pair, with ground sleeves"],
    ],
  },
  {
    sku: "VB-0215", name: "Net Antenna & Pocket Set — Fibreglass, Pair",
    cat: "volleyball", sub: "Nets & posts", img: "/img/volleyball/net-antenna-hero.jpg",
    meta: "Fibreglass rods · pair with pockets", std: 980, buyer: 833,
    specs: [
      ["Rod", "Fibreglass, 1.8 m, banded"],
      ["Pack", "Pair, with net pockets"],
    ],
  },
  {
    sku: "VB-0302", name: "Court Boundary Tape — 50 mm, Full Court",
    cat: "volleyball", sub: "Court equipment",
    meta: "Woven polyester · full-court set", std: 760, buyer: 646,
    specs: [
      ["Width", "50 mm"],
      ["Material", "Woven polyester, anchor pegs"],
      ["Set", "Marks one full court"],
    ],
  },

  /* ---------------- Badminton ---------------- */
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
    sku: "BD-2104", name: "Institutional Racquet — Aluminium, Set of 4",
    cat: "badminton", sub: "Racquets", img: "/img/badminton/racquet-aluminium-hero.jpg",
    meta: "Aluminium frame · set of 4, strung", std: 2360, buyer: 2006,
    specs: [
      ["Frame", "Aluminium, steel shaft"],
      ["Weight", "95–100 g"],
      ["Pack", "Set of 4, factory strung"],
    ],
  },
  {
    sku: "BD-1110", name: "Nylon Shuttlecocks — Club, Tube of 6",
    cat: "badminton", sub: "Shuttles",
    meta: "Nylon skirt · medium speed · tube of 6", std: 560, buyer: 476,
    specs: [
      ["Skirt", "Nylon, cork base"],
      ["Speed", "Medium (77)"],
      ["Pack", "Tube of 6"],
    ],
  },
  {
    sku: "BD-2203", name: "Badminton Net — Competition, 6.1 m",
    cat: "badminton", sub: "Nets & posts",
    meta: "6.1 m · 19 mm nylon mesh", std: 820, buyer: 697,
    specs: [
      ["Length", "6.1 m"],
      ["Mesh", "19 mm nylon"],
      ["Tape", "Double-stitched top tape"],
    ],
  },
  {
    sku: "BD-2209", name: "Badminton Posts — Mobile Steel, Pair",
    cat: "badminton", sub: "Nets & posts",
    meta: "1.55 m · weighted wheeled base · pair", std: 7200, buyer: 6120,
    specs: [
      ["Height", "1.55 m (net height)"],
      ["Base", "Weighted, wheeled"],
      ["Pack", "Pair"],
    ],
  },
  {
    sku: "BD-2304", name: "Replacement Grip — PU Overgrip, Pack of 10",
    cat: "badminton", sub: "Strings & grips",
    meta: "Tacky PU overgrip · pack of 10", std: 450, buyer: 382.5,
    specs: [
      ["Material", "Tacky PU, 0.6 mm"],
      ["Pack", "10 grips, assorted colours"],
    ],
  },

  /* ---------------- Tennis ---------------- */
  {
    sku: "TN-0103", name: "Graphite Composite Racquet — 27 in, L2 Grip",
    cat: "tennis", sub: "Racquets",
    meta: "Graphite composite · 27 in · strung", std: 2680, buyer: 2278,
    specs: [
      ["Frame", "Graphite composite"],
      ["Length", "27 in"],
      ["Grip", "L2"],
      ["Supplied", "Strung, with cover"],
    ],
  },
  {
    sku: "TN-0109", name: "Junior Racquet — 25 in, Set of 4",
    cat: "tennis", sub: "Racquets",
    meta: "25 in junior · set of 4", std: 4360, buyer: 3706,
    specs: [
      ["Frame", "Aluminium"],
      ["Length", "25 in (junior)"],
      ["Pack", "Set of 4, strung"],
    ],
  },
  {
    sku: "TN-0204", name: "Tennis Balls — Pressurised Match, Carton of 24",
    cat: "tennis", sub: "Balls", img: "/img/tennis/tennis-balls-hero.jpg",
    meta: "Pressurised felt · carton of 24", std: 3120, buyer: 2652,
    specs: [
      ["Type", "Pressurised, woven felt"],
      ["Grade", "Match"],
      ["Pack", "Carton of 24 (8 cans of 3)"],
    ],
  },
  {
    sku: "TN-0210", name: "Tennis Balls — Pressureless Training, Bag of 60",
    cat: "tennis", sub: "Balls",
    meta: "Pressureless · bag of 60", std: 5400, buyer: 4590,
    specs: [
      ["Type", "Pressureless, durable core"],
      ["Use", "Training machines and drills"],
      ["Pack", "Mesh bag of 60"],
    ],
  },
  {
    sku: "TN-0303", name: "Tennis Net — Double Top Braid, 12.8 m",
    cat: "tennis", sub: "Nets & posts", img: "/img/tennis/tennis-net-hero.jpg",
    meta: "12.8 m · 3 mm braided PE", std: 3880, buyer: 3298,
    specs: [
      ["Length", "12.8 m (doubles)"],
      ["Twine", "3 mm braided PE"],
      ["Headband", "Double-stitched polyester"],
    ],
  },
  {
    sku: "TN-0402", name: "Court Squeegee — 90 cm Foam Roller",
    cat: "tennis", sub: "Court equipment",
    meta: "90 cm roller · aluminium handle", std: 1140, buyer: 969,
    specs: [
      ["Width", "90 cm"],
      ["Roller", "PVA foam, replaceable"],
      ["Handle", "Aluminium, 1.4 m"],
    ],
  },

  /* ---------------- Athletics ---------------- */
  {
    sku: "AT-0102", name: "Relay Batons — Aluminium, Set of 8",
    cat: "athletics", sub: "Track equipment",
    meta: "Anodised aluminium · set of 8", std: 920, buyer: 782,
    specs: [
      ["Material", "Anodised aluminium"],
      ["Length", "Standard 30 cm"],
      ["Pack", "Set of 8, mixed colours"],
    ],
  },
  {
    sku: "AT-0108", name: "Starting Block — Adjustable Rail",
    cat: "athletics", sub: "Track equipment",
    meta: "Steel rail · adjustable pedals", std: 2450, buyer: 2082.5,
    specs: [
      ["Rail", "Steel, spiked base"],
      ["Pedals", "Adjustable angle and spacing"],
      ["Surface", "Synthetic and cinder tracks"],
    ],
  },
  {
    sku: "AT-0115", name: "Training Hurdles — Collapsible, Set of 10",
    cat: "athletics", sub: "Track equipment", img: "/img/athletics/hurdle-training-hero.jpg",
    meta: "Height-adjustable · set of 10", std: 8400, buyer: 7140,
    specs: [
      ["Heights", "Adjustable, 5 settings"],
      ["Build", "Steel base, collapsible top bar"],
      ["Pack", "Set of 10"],
    ],
  },
  {
    sku: "AT-0204", name: "Shot Put — Cast Iron, 4 kg",
    cat: "athletics", sub: "Field equipment",
    meta: "Cast iron · 4 kg, turned finish", std: 1180, buyer: 1003,
    specs: [
      ["Weight", "4 kg"],
      ["Material", "Cast iron, turned finish"],
    ],
  },
  {
    sku: "AT-0210", name: "Discus — Composite, 1 kg",
    cat: "athletics", sub: "Field equipment",
    meta: "Composite plates · steel rim · 1 kg", std: 1360, buyer: 1156,
    specs: [
      ["Weight", "1 kg"],
      ["Build", "Composite plates, steel rim"],
      ["Grade", "Training / inter-school"],
    ],
  },
  {
    sku: "AT-0303", name: "Stopwatch — 60-Lap Memory",
    cat: "athletics", sub: "Timing & measurement",
    meta: "60-lap memory · splash-proof", std: 1150, buyer: 977.5,
    specs: [
      ["Memory", "60 laps / splits"],
      ["Body", "Splash-proof, lanyard"],
      ["Battery", "Coin cell, included"],
    ],
  },
  {
    sku: "AT-0309", name: "Measuring Tape — 100 m, Open Reel",
    cat: "athletics", sub: "Timing & measurement",
    meta: "100 m fibreglass · open reel", std: 1480, buyer: 1258,
    specs: [
      ["Length", "100 m"],
      ["Tape", "Fibreglass, dual scale"],
      ["Reel", "Open frame, folding crank"],
    ],
  },

  /* ---------------- Gym & Fitness ---------------- */
  {
    sku: "GF-0104", name: "Rubber Hex Dumbbells — 5 kg Pair",
    cat: "gym-fitness", sub: "Free weights",
    meta: "Rubber-coated hex · 5 kg pair", std: 1980, buyer: 1683,
    specs: [
      ["Weight", "5 kg each"],
      ["Head", "Rubber-coated hex"],
      ["Handle", "Knurled chrome"],
      ["Pack", "Pair"],
    ],
  },
  {
    sku: "GF-0110", name: "Rubber Plate Set — 60 kg, Olympic Bore",
    cat: "gym-fitness", sub: "Free weights",
    meta: "60 kg set · 50 mm bore", std: 10560, buyer: 8976,
    specs: [
      ["Set", "2×15 kg, 2×10 kg, 2×5 kg"],
      ["Bore", "50 mm, steel insert"],
      ["Finish", "Rubber-coated"],
    ],
  },
  {
    sku: "GF-0116", name: "Barbell — 7 ft, 20 kg, Knurled",
    cat: "gym-fitness", sub: "Free weights",
    meta: "7 ft · 20 kg · rotating sleeves", std: 7400, buyer: 6290,
    specs: [
      ["Length", "7 ft (220 cm)"],
      ["Weight", "20 kg"],
      ["Sleeves", "Rotating, 50 mm"],
      ["Shaft", "Knurled alloy steel"],
    ],
  },
  {
    sku: "GF-0205", name: "Skipping Ropes — Speed Bearing, Set of 10",
    cat: "gym-fitness", sub: "Conditioning",
    meta: "Bearing handles · set of 10", std: 2400, buyer: 2040,
    specs: [
      ["Rope", "Adjustable PVC-coated wire"],
      ["Handles", "Ball-bearing swivel"],
      ["Pack", "Set of 10"],
    ],
  },
  {
    sku: "GF-0211", name: "Kettlebell — Cast Iron, 12 kg",
    cat: "gym-fitness", sub: "Conditioning",
    meta: "Cast iron · flat base · 12 kg", std: 2160, buyer: 1836,
    specs: [
      ["Weight", "12 kg"],
      ["Build", "Single-cast iron, flat base"],
      ["Handle", "Wide grip, powder-coated"],
    ],
  },
  {
    sku: "GF-0304", name: "Exercise Mats — 10 mm NBR, Set of 10",
    cat: "gym-fitness", sub: "Mats & flooring",
    meta: "10 mm NBR foam · set of 10", std: 5900, buyer: 5015,
    specs: [
      ["Size", "183 × 61 cm"],
      ["Thickness", "10 mm NBR foam"],
      ["Pack", "Set of 10, with straps"],
    ],
  },
  {
    sku: "GF-0310", name: "Rubber Gym Tiles — 20 mm, Pack of 10",
    cat: "gym-fitness", sub: "Mats & flooring",
    meta: "500 × 500 mm · 20 mm · pack of 10", std: 6800, buyer: 5780,
    specs: [
      ["Tile", "500 × 500 mm"],
      ["Thickness", "20 mm recycled rubber"],
      ["Pack", "10 tiles (2.5 m²)"],
    ],
  },

  /* ---------------- Indoor Games ---------------- */
  {
    sku: "IG-0103", name: "Table Tennis Table — Indoor, 19 mm",
    cat: "indoor-games", sub: "Table tennis",
    meta: "19 mm top · foldable, wheeled", std: 18400, buyer: 15640,
    specs: [
      ["Top", "19 mm MDF, matt finish"],
      ["Size", "Full size, 2.74 × 1.525 m"],
      ["Frame", "Foldable, lockable wheels"],
      ["Supplied", "With net and post set"],
    ],
  },
  {
    sku: "IG-0109", name: "Table Tennis Bats — Club, Set of 4",
    cat: "indoor-games", sub: "Table tennis", img: "/img/indoor-games/tt-bat-hero.jpg",
    meta: "Pimpled-in rubber · set of 4", std: 1720, buyer: 1462,
    specs: [
      ["Blade", "5-ply wood"],
      ["Rubber", "Pimpled-in, sponge backed"],
      ["Pack", "Set of 4, with covers"],
    ],
  },
  {
    sku: "IG-0115", name: "Table Tennis Balls — 40 mm Match, Box of 12",
    cat: "indoor-games", sub: "Table tennis",
    meta: "40 mm · match grade · box of 12", std: 540, buyer: 459,
    specs: [
      ["Diameter", "40 mm"],
      ["Grade", "Match"],
      ["Pack", "Box of 12, white"],
    ],
  },
  {
    sku: "IG-0204", name: "Carrom Board — Tournament, 84 cm",
    cat: "indoor-games", sub: "Carrom", img: "/img/indoor-games/carrom-board-hero.jpg",
    meta: "84 cm plywood surface", std: 4650, buyer: 3952.5,
    specs: [
      ["Playing surface", "84 cm, seasoned plywood"],
      ["Frame", "Hardwood, 7.5 cm border"],
      ["Grade", "Tournament"],
    ],
  },
  {
    sku: "IG-0210", name: "Carrom Coins & Striker Set — Boxed",
    cat: "indoor-games", sub: "Carrom",
    meta: "Full coin set · boxed with striker", std: 620, buyer: 527,
    specs: [
      ["Coins", "Full set, turned wood"],
      ["Striker", "Acrylic, standard weight"],
      ["Pack", "Boxed, with powder pouch"],
    ],
  },
  {
    sku: "IG-0303", name: "Chess Sets — Weighted, Folding Board, Set of 5",
    cat: "indoor-games", sub: "Board games", img: "/img/indoor-games/chess-set-hero.jpg",
    meta: "48 cm folding boards · set of 5", std: 3400, buyer: 2890,
    specs: [
      ["Board", "48 cm, folding"],
      ["Pieces", "Weighted plastic, felt base"],
      ["Pack", "Set of 5 complete sets"],
    ],
  },
  {
    sku: "IG-0309", name: "Ludo & Snakes Combo Boards — Set of 10",
    cat: "indoor-games", sub: "Board games", img: "/img/indoor-games/ludo-board-hero.jpg",
    meta: "Two-in-one boards · set of 10", std: 1900, buyer: 1615,
    specs: [
      ["Board", "Two-in-one, laminated"],
      ["Includes", "Dice, tokens per board"],
      ["Pack", "Set of 10"],
    ],
  },

  /* ---------------- Outdoor Games ---------------- */
  {
    sku: "OG-0102", name: "Kho-Kho Poles — Seasoned Wood, Pair",
    cat: "outdoor-games", sub: "Field games",
    meta: "Seasoned hardwood · pair", std: 2850, buyer: 2422.5,
    specs: [
      ["Material", "Seasoned hardwood, smooth turned"],
      ["Height", "Standard, with ground fixing"],
      ["Pack", "Pair"],
    ],
  },
  {
    sku: "OG-0108", name: "Tug-of-War Rope — 30 m, Manila",
    cat: "outdoor-games", sub: "Field games",
    meta: "30 m · 36 mm manila", std: 4100, buyer: 3485,
    specs: [
      ["Length", "30 m"],
      ["Diameter", "36 mm"],
      ["Material", "Manila, whipped ends"],
    ],
  },
  {
    sku: "OG-0114", name: "Throwball — Match, Set of 3",
    cat: "outdoor-games", sub: "Field games",
    meta: "Stitched PU · set of 3", std: 1980, buyer: 1683,
    specs: [
      ["Construction", "Machine-stitched PU"],
      ["Grade", "Match"],
      ["Pack", "Set of 3"],
    ],
  },
  {
    sku: "OG-0203", name: "Play Parachute — 6 m, 16 Handles",
    cat: "outdoor-games", sub: "Playground",
    meta: "6 m · 16 handles · carry bag", std: 2300, buyer: 1955,
    specs: [
      ["Diameter", "6 m"],
      ["Handles", "16, reinforced"],
      ["Fabric", "Ripstop polyester, carry bag"],
    ],
  },
  {
    sku: "OG-0209", name: "Flying Discs — 175 g, Set of 6",
    cat: "outdoor-games", sub: "Playground", img: "/img/outdoor-games/flying-discs-hero.jpg",
    meta: "175 g · set of 6", std: 1440, buyer: 1224,
    specs: [
      ["Weight", "175 g"],
      ["Material", "Flexible PE"],
      ["Pack", "Set of 6, mixed colours"],
    ],
  },
  {
    sku: "OG-0302", name: "Roller Skates — Adjustable Junior, Pair",
    cat: "outdoor-games", sub: "Skating", img: "/img/outdoor-games/roller-skates-hero.jpg",
    meta: "4-size adjustable · pair", std: 1850, buyer: 1572.5,
    specs: [
      ["Adjustment", "4 sizes per unit"],
      ["Wheels", "PU, lighted bearings"],
      ["Pack", "Pair, with carry strap"],
    ],
  },

  /* ---------------- Sportswear ---------------- */
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
  {
    sku: "SW-3102", name: "Team Tracksuits — Set of 15",
    cat: "sportswear", sub: "Team wear", img: "/img/sportswear/tracksuit-hero.jpg",
    meta: "Warp-knit polyester · set of 15", std: 13500, buyer: 11475,
    specs: [
      ["Fabric", "Warp-knit polyester"],
      ["Set", "15 jacket + trouser sets"],
      ["Sizes", "Assorted on order"],
    ],
  },
  {
    sku: "SW-3008", name: "Training T-Shirts — Polyester, Pack of 10",
    cat: "sportswear", sub: "Training wear",
    meta: "Quick-dry polyester · pack of 10", std: 2900, buyer: 2465,
    specs: [
      ["Fabric", "Quick-dry polyester, 140 gsm"],
      ["Pack", "10, single colour"],
      ["Sizes", "S – XXL assorted"],
    ],
  },
  {
    sku: "SW-3014", name: "Track Pants — Warp-knit, Pack of 10",
    cat: "sportswear", sub: "Training wear",
    meta: "Warp-knit · zip pockets · pack of 10", std: 4600, buyer: 3910,
    specs: [
      ["Fabric", "Warp-knit polyester"],
      ["Pockets", "Zipped side pockets"],
      ["Pack", "10, assorted sizes"],
    ],
  },
  {
    sku: "SW-3203", name: "Sports Socks — Cushioned Crew, Pack of 12",
    cat: "sportswear", sub: "Socks & baselayers",
    meta: "Cushioned sole · pack of 12", std: 1560, buyer: 1326,
    specs: [
      ["Build", "Cushioned sole, ribbed cuff"],
      ["Fabric", "Cotton-polyester blend"],
      ["Pack", "12 pairs"],
    ],
  },
  {
    sku: "SW-3209", name: "Compression Baselayer Tops — Pack of 5",
    cat: "sportswear", sub: "Socks & baselayers",
    meta: "4-way stretch · pack of 5", std: 2750, buyer: 2337.5,
    specs: [
      ["Fabric", "4-way stretch polyamide blend"],
      ["Fit", "Compression, long sleeve"],
      ["Pack", "5, single size per pack"],
    ],
  },
  {
    sku: "SW-3302", name: "Team Rain Jackets — Set of 15",
    cat: "sportswear", sub: "Outerwear",
    meta: "Water-resistant shell · set of 15", std: 8700, buyer: 7395,
    specs: [
      ["Shell", "Water-resistant polyester"],
      ["Features", "Hood, mesh lining"],
      ["Set", "15, assorted sizes"],
    ],
  },

  /* ---------------- Accessories ---------------- */
  {
    sku: "AC-4002", name: "Drawstring Kit Bags — Pack of 20",
    cat: "accessories", sub: "Bags",
    meta: "210D polyester · pack of 20", std: 2600, buyer: 2210,
    specs: [
      ["Material", "210D polyester"],
      ["Closure", "Drawstring, corner grommets"],
      ["Pack", "20, single colour"],
    ],
  },
  {
    sku: "AC-4008", name: "Duffel Bag — 60 L, Institutional",
    cat: "accessories", sub: "Bags",
    meta: "60 L · 600D polyester", std: 1450, buyer: 1232.5,
    specs: [
      ["Capacity", "60 L"],
      ["Material", "600D polyester"],
      ["Carry", "Shoulder strap + grab handles"],
    ],
  },
  {
    sku: "AC-4103", name: "Water Bottles — 750 ml, Carrier of 8",
    cat: "accessories", sub: "Hydration",
    meta: "750 ml squeeze · carrier of 8", std: 1760, buyer: 1496,
    specs: [
      ["Capacity", "750 ml"],
      ["Material", "LDPE squeeze, pull-top"],
      ["Pack", "8, with wire carrier"],
    ],
  },
  {
    sku: "AC-4109", name: "Cooler Jug — 15 L, Team Sideline",
    cat: "accessories", sub: "Hydration",
    meta: "15 L insulated · tap spout", std: 2250, buyer: 1912.5,
    specs: [
      ["Capacity", "15 L"],
      ["Insulation", "Foam-insulated body"],
      ["Dispensing", "Tap spout, carry handles"],
    ],
  },
  {
    sku: "AC-4203", name: "Referee Whistles — Metal, Pack of 10",
    cat: "accessories", sub: "Officiating",
    meta: "Metal pea whistle · pack of 10", std: 850, buyer: 722.5,
    specs: [
      ["Build", "Nickel-plated brass, pea type"],
      ["Includes", "Lanyards"],
      ["Pack", "10"],
    ],
  },
  {
    sku: "AC-4209", name: "First Aid Kit — Team Sideline, 42-Piece",
    cat: "accessories", sub: "First aid",
    meta: "42-piece · zip case", std: 1380, buyer: 1173,
    specs: [
      ["Contents", "42 pieces, sideline oriented"],
      ["Case", "Zip softcase, belt loop"],
      ["Includes", "Cold pack, crepe bandages"],
    ],
  },
  {
    sku: "AC-4215", name: "Ball Pump — Dual-Action, Needle Set",
    cat: "accessories", sub: "Inflation & care",
    meta: "Dual-action · 5 needles + hose", std: 520, buyer: 442,
    specs: [
      ["Action", "Dual (inflates both strokes)"],
      ["Includes", "5 needles, flexible hose"],
      ["Body", "Impact-resistant ABS"],
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
