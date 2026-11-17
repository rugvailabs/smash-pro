# ProSmash — Product Image Shopping List & Drop-in Pipeline

> Generated 2026-11-17 (Photography milestone).
> Coverage after this milestone: **29 of 84 products** carry a representative image
> (12 original + 17 new CC-licensed, attributed in `web/public/img/LICENSES.md`).
> The **55 products below have no image** and render the labelled placeholder
> frame. Per owner instruction, **no incorrect or misleading image was
> substituted** where an accurate, permissively-licensed match could not be
> verified by eye — most of these are generic/institutional items for which
> Wikimedia Commons has no clean, accurate, freely-licensed product photo.

## Why these 55 are unsourced

Representative images were sourced only from Wikimedia Commons under permissive
licences (CC0 / CC BY / CC BY-SA / public domain), and every candidate was
reviewed by eye. Items were left on the placeholder when the only available
images were: in-use/contextual shots, damaged or antique examples, diagrams or
patents, person-centric photos, or simply absent. The correct source for these
is **owned or properly-licensed studio photography** — never copyrighted
manufacturer images used without a licence, and never AI-generated or random
stock (per the design doctrine and the owner's brief).

## How to add an image (drop-in pipeline)

1. Obtain an **owned or properly-licensed** photo of the product (clean/studio
   preferred). Do not use copyrighted manufacturer images without a licence.
2. Save it as JPG at the **exact path** in the table below (folder = category,
   under `web/public/img/<category>/`). Recommended: ~1200px on the long edge,
   landscape or square, product centred on a clean background.
3. In `web/src/data/products.ts`, find the product by SKU and add
   `img: "<path>",` immediately after its `sub: "...",` entry (copy any existing
   product that already has an image as the template — e.g. `CR-0417`).
4. For multiple angles, also set `gallery: ["<path2>", "<path3>"]` — the product
   detail page shows a thumbnail rail automatically when a gallery is present.
5. If the image is third-party licensed, add an attribution row to
   `web/public/img/LICENSES.md`. Owned photography needs no attribution.
6. Alt text is generated from the product name automatically — no extra step.

No code change is needed beyond the `img:` field; the catalogue cards, product
detail page, search results and related-products rails all read it and swap the
placeholder for the image.

## Missing products (55) — suggested drop-in paths

### Cricket (2)
| SKU | Product | Drop-in path |
|---|---|---|
| CR-0915 | Stumps & Bails Set — Seasoned Wood, Two Ends | web/public/img/cricket/stumps-bails-set-hero.jpg |
| CR-0922 | Boundary Cones — 23 cm, Set of 50 | web/public/img/cricket/boundary-cones-hero.jpg |

### Football (6)
| SKU | Product | Drop-in path |
|---|---|---|
| FB-0112 | Football — Size 5, Stitched Training, Box of 6 | web/public/img/football/training-football-hero.jpg |
| FB-0118 | Football — Size 3, Junior Training, Box of 6 | web/public/img/football/junior-football-hero.jpg |
| FB-0210 | Football Goal Net — Full Size, 4 mm HDPE Pair | web/public/img/football/football-goal-net-hero.jpg |
| FB-0216 | Pop-up Training Goal — 1.8 m, Pair | web/public/img/football/pop-up-training-goal-hero.jpg |
| FB-0305 | Training Bibs — Mesh, Set of 12 | web/public/img/football/training-bibs-hero.jpg |
| FB-0404 | Shin Guards — Slip-in, Pair | web/public/img/football/shin-guards-hero.jpg |

### Basketball (4)
| SKU | Product | Drop-in path |
|---|---|---|
| BB-0115 | Junior Basketball — Size 5, Rubber, Box of 5 | web/public/img/basketball/junior-basketball-hero.jpg |
| BB-0208 | Acrylic Backboard — 1.8 × 1.05 m, Fixed Rim | web/public/img/basketball/acrylic-backboard-hero.jpg |
| BB-0214 | Scoreboard — Manual Flip, Tabletop | web/public/img/basketball/scoreboard-hero.jpg |
| BB-0302 | Ball Carry Net — Holds 12 Balls | web/public/img/basketball/ball-carry-net-hero.jpg |

### Volleyball (3)
| SKU | Product | Drop-in path |
|---|---|---|
| VB-0110 | Volleyball — Training, Rubber, Box of 6 | web/public/img/volleyball/training-volleyball-hero.jpg |
| VB-0209 | Volleyball Posts — Telescopic Steel, Pair | web/public/img/volleyball/volleyball-posts-hero.jpg |
| VB-0302 | Court Boundary Tape — 50 mm, Full Court | web/public/img/volleyball/court-boundary-tape-hero.jpg |

### Badminton (4)
| SKU | Product | Drop-in path |
|---|---|---|
| BD-1110 | Nylon Shuttlecocks — Club, Tube of 6 | web/public/img/badminton/nylon-shuttlecocks-hero.jpg |
| BD-2203 | Badminton Net — Competition, 6.1 m | web/public/img/badminton/badminton-net-hero.jpg |
| BD-2209 | Badminton Posts — Mobile Steel, Pair | web/public/img/badminton/badminton-posts-hero.jpg |
| BD-2304 | Replacement Grip — PU Overgrip, Pack of 10 | web/public/img/badminton/replacement-grip-hero.jpg |

### Tennis (4)
| SKU | Product | Drop-in path |
|---|---|---|
| TN-0103 | Graphite Composite Racquet — 27 in, L2 Grip | web/public/img/tennis/graphite-composite-racquet-hero.jpg |
| TN-0109 | Junior Racquet — 25 in, Set of 4 | web/public/img/tennis/junior-racquet-hero.jpg |
| TN-0210 | Tennis Balls — Pressureless Training, Bag of 60 | web/public/img/tennis/training-tennis-balls-hero.jpg |
| TN-0402 | Court Squeegee — 90 cm Foam Roller | web/public/img/tennis/court-squeegee-hero.jpg |

### Athletics (6)
| SKU | Product | Drop-in path |
|---|---|---|
| AT-0102 | Relay Batons — Aluminium, Set of 8 | web/public/img/athletics/relay-batons-hero.jpg |
| AT-0108 | Starting Block — Adjustable Rail | web/public/img/athletics/starting-block-hero.jpg |
| AT-0204 | Shot Put — Cast Iron, 4 kg | web/public/img/athletics/shot-put-hero.jpg |
| AT-0210 | Discus — Composite, 1 kg | web/public/img/athletics/discus-hero.jpg |
| AT-0303 | Stopwatch — 60-Lap Memory | web/public/img/athletics/stopwatch-hero.jpg |
| AT-0309 | Measuring Tape — 100 m, Open Reel | web/public/img/athletics/measuring-tape-hero.jpg |

### Gym & Fitness (7)
| SKU | Product | Drop-in path |
|---|---|---|
| GF-0104 | Rubber Hex Dumbbells — 5 kg Pair | web/public/img/gym-fitness/rubber-hex-dumbbells-hero.jpg |
| GF-0110 | Rubber Plate Set — 60 kg, Olympic Bore | web/public/img/gym-fitness/rubber-plate-set-hero.jpg |
| GF-0116 | Barbell — 7 ft, 20 kg, Knurled | web/public/img/gym-fitness/barbell-hero.jpg |
| GF-0205 | Skipping Ropes — Speed Bearing, Set of 10 | web/public/img/gym-fitness/skipping-ropes-hero.jpg |
| GF-0211 | Kettlebell — Cast Iron, 12 kg | web/public/img/gym-fitness/kettlebell-hero.jpg |
| GF-0304 | Exercise Mats — 10 mm NBR, Set of 10 | web/public/img/gym-fitness/exercise-mats-hero.jpg |
| GF-0310 | Rubber Gym Tiles — 20 mm, Pack of 10 | web/public/img/gym-fitness/rubber-gym-tiles-hero.jpg |

### Indoor Games (3)
| SKU | Product | Drop-in path |
|---|---|---|
| IG-0103 | Table Tennis Table — Indoor, 19 mm | web/public/img/indoor-games/table-tennis-table-hero.jpg |
| IG-0115 | Table Tennis Balls — 40 mm Match, Box of 12 | web/public/img/indoor-games/table-tennis-balls-hero.jpg |
| IG-0210 | Carrom Coins & Striker Set — Boxed | web/public/img/indoor-games/carrom-coins-striker-set-hero.jpg |

### Outdoor Games (4)
| SKU | Product | Drop-in path |
|---|---|---|
| OG-0102 | Kho-Kho Poles — Seasoned Wood, Pair | web/public/img/outdoor-games/kho-kho-poles-hero.jpg |
| OG-0108 | Tug-of-War Rope — 30 m, Manila | web/public/img/outdoor-games/tug-of-war-rope-hero.jpg |
| OG-0114 | Throwball — Match, Set of 3 | web/public/img/outdoor-games/throwball-hero.jpg |
| OG-0203 | Play Parachute — 6 m, 16 Handles | web/public/img/outdoor-games/play-parachute-hero.jpg |

### Sportswear (5)
| SKU | Product | Drop-in path |
|---|---|---|
| SW-3008 | Training T-Shirts — Polyester, Pack of 10 | web/public/img/sportswear/training-t-shirts-hero.jpg |
| SW-3014 | Track Pants — Warp-knit, Pack of 10 | web/public/img/sportswear/track-pants-hero.jpg |
| SW-3203 | Sports Socks — Cushioned Crew, Pack of 12 | web/public/img/sportswear/sports-socks-hero.jpg |
| SW-3209 | Compression Baselayer Tops — Pack of 5 | web/public/img/sportswear/compression-baselayer-tops-hero.jpg |
| SW-3302 | Team Rain Jackets — Set of 15 | web/public/img/sportswear/team-rain-jackets-hero.jpg |

### Accessories (7)
| SKU | Product | Drop-in path |
|---|---|---|
| AC-4002 | Drawstring Kit Bags — Pack of 20 | web/public/img/accessories/drawstring-kit-bags-hero.jpg |
| AC-4008 | Duffel Bag — 60 L, Institutional | web/public/img/accessories/duffel-bag-hero.jpg |
| AC-4103 | Water Bottles — 750 ml, Carrier of 8 | web/public/img/accessories/water-bottles-hero.jpg |
| AC-4109 | Cooler Jug — 15 L, Team Sideline | web/public/img/accessories/cooler-jug-hero.jpg |
| AC-4203 | Referee Whistles — Metal, Pack of 10 | web/public/img/accessories/referee-whistles-hero.jpg |
| AC-4209 | First Aid Kit — Team Sideline, 42-Piece | web/public/img/accessories/first-aid-kit-hero.jpg |
| AC-4215 | Ball Pump — Dual-Action, Needle Set | web/public/img/accessories/ball-pump-hero.jpg |

_Total: 55 products awaiting owned or licensed photography._
