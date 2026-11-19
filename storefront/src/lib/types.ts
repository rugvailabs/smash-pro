/** Storefront data shapes — frontend-only fixtures (ADR-0008). Mirrors the
 *  shapes in web/src/lib/types.ts for the fields this project reuses; no
 *  import from web/ itself (projects stay fully independent). */

export interface Category {
  slug: string;
  name: string;
  /** Illustrative product count (fixture data). */
  count: number;
}

export interface Product {
  sku: string;
  name: string;
  cat: string;
  sub: string;
  /** Path under /img — real CC-licensed imagery only. Optional: SKUs
   *  without approved imagery render the labelled placeholder frame —
   *  never substitute stock photography. */
  img?: string;
  gallery?: string[];
  meta: string;
  /** Standard listed price (fixture, GST-inclusive presentation). */
  std: number;
  /** Illustrative "signed-in buyer" price fixture — mock only, see
   *  components/role-gate for the clearly-labelled demo toggle. */
  buyer?: number;
  configurable?: boolean;
  specs: [string, string][];
}

export interface RacquetConfig {
  string: string;
  tension: string;
  grip: string;
}

export interface CartLine {
  key: string;
  sku: string;
  qty: number;
  config: RacquetConfig | null;
  deltaPrice: number;
}

export type ViewRole = "visitor" | "signed-in";
