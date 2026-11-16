/** ₹ with Indian digit grouping and two decimals (OBD-20 precision). */
export function inr(n: number): string {
  return (
    "₹" +
    n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}
