/** Account states available in the preview role switcher.
 *  Real authentication replaces this in a later phase. */
export type Role = "visitor" | "pending" | "buyer" | "supplier";

export interface Category {
  slug: string;
  name: string;
  /** Illustrative product count (preview data). */
  count: number;
}

export interface Product {
  sku: string;
  name: string;
  cat: string;
  sub: string;
  /** Path under /img — interim CC-licensed imagery (see /img/LICENSES.md). */
  img: string;
  meta: string;
  /** Standard listed price, GST-inclusive (OBD-03/OBD-20). */
  std: number;
  /** Approved-buyer applicable price, GST-inclusive. Illustrative sample
   *  tier — configured discounts pending owner approval (OBD-20). */
  buyer: number;
  /** Requires the racquet configurator (stringing/tension/grip). */
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
  /** Option price delta (illustrative, pending approval). */
  delta: number;
}
