/** Indian numbering (lakh/crore) amount-in-words — the standard closing
 *  line on a GST tax invoice ("Rupees Seventy Thousand ... Only"). Pure
 *  formatting, not a tax calculation. */

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function threeDigitsToWords(n: number): string {
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : ""));
  } else if (n > 0) {
    parts.push(ONES[n]);
  }
  return parts.join(" ");
}

function integerToWordsIndian(n: number): string {
  if (n === 0) return "Zero";
  const segments: [number, string][] = [
    [10000000, "Crore"], [100000, "Lakh"], [1000, "Thousand"], [100, "Hundred"],
  ];
  let out = "";
  for (const [value, label] of segments) {
    if (n >= value) {
      const count = Math.floor(n / value);
      out += `${label === "Hundred" ? ONES[count] : integerToWordsIndian(count)} ${label} `;
      n %= value;
    }
  }
  if (n > 0) out += threeDigitsToWords(n);
  return out.replace(/\s+/g, " ").trim();
}

/** e.g. amountInWords(70349) → "Seventy Thousand Three Hundred Forty Nine Rupees Only" */
export function amountInWords(rupees: number): string {
  const whole = Math.floor(Math.abs(rupees));
  const paise = Math.round((Math.abs(rupees) - whole) * 100);
  const words = `${integerToWordsIndian(whole)} Rupees`;
  return paise > 0 ? `${words} and ${integerToWordsIndian(paise)} Paise Only` : `${words} Only`;
}
