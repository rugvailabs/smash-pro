import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { amountInWords } from "@/lib/number-words";
import type { AdminInvoiceDetail } from "@/lib/admin-types";

/** The PDF's built-in Helvetica (PDF standard-14 font, WinAnsi encoding)
 *  has no ₹ glyph — it renders as garbage. "Rs." is the safe, universal
 *  substitute here; the HTML/print view (invoice-document.tsx) still uses
 *  the real ₹ symbol via lib/format's inr(), since browsers render it fine. */
function inr(n: number): string {
  return "Rs. " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ============================================================
   PDF rendering of the invoice document — same content/structure
   as components/invoice-document.tsx (the on-screen/print HTML
   view), built with @react-pdf/renderer's own primitives so it can
   render server-side to a real .pdf file (no headless browser).
   Keep the two views in sync when the invoice structure changes.
   RECORD-KEEPING ONLY — see invoice-document.tsx's header comment.
   ============================================================ */

const C = { ink: "#1a1a1a", line: "#c9c9c9", muted: "#666666", bg: "#f6f4f0" };

const s = StyleSheet.create({
  page: { padding: 28, fontSize: 9, color: C.ink, fontFamily: "Helvetica" },
  titleRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 8, marginBottom: 8,
  },
  h1: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  ref: { fontSize: 8, color: C.muted, textTransform: "uppercase" },
  box: { borderWidth: 1, borderColor: C.line, padding: 6 },
  rowBoxes: { flexDirection: "row" },
  colHalf: { width: "50%" },
  label: { fontSize: 7, color: C.muted, textTransform: "uppercase", marginBottom: 1 },
  bold: { fontFamily: "Helvetica-Bold" },
  metaGrid: { flexDirection: "row", flexWrap: "wrap" },
  metaCell: { width: "50%", marginBottom: 4 },
  table: { marginTop: 8, borderWidth: 1, borderColor: C.line },
  trHead: { flexDirection: "row", backgroundColor: C.bg, borderBottomWidth: 1, borderBottomColor: C.line },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.line },
  th: { fontSize: 7, color: C.muted, textTransform: "uppercase", padding: 4 },
  td: { fontSize: 8.5, padding: 4 },
  right: { textAlign: "right" },
  totals: { marginTop: 6, alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: 220, paddingVertical: 1.5 },
  totalFinal: {
    flexDirection: "row", justifyContent: "space-between", width: 220,
    borderTopWidth: 1, borderTopColor: C.line, paddingTop: 3, marginTop: 2,
  },
  footer: {
    marginTop: 14, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8,
    flexDirection: "row", justifyContent: "space-between",
  },
  disclaimer: { marginTop: 14, fontSize: 7, color: C.muted, textAlign: "center" },
});

// column widths shared by the header row and every data row, sr/desc/hsn/qty/uom/rate/disc/taxable/gst/tax.../amount
const COLS_INTRA = [5, 23, 9, 6, 7, 8, 7, 9, 6, 7, 7, 6];
const COLS_INTER = [5, 25, 10, 6, 7, 9, 7, 10, 6, 9, 6];

export function InvoicePdfDocument({ inv }: { inv: AdminInvoiceDetail }) {
  const cols = inv.taxMode === "intra" ? COLS_INTRA : COLS_INTER;
  const hsnGroups = new Map<string, { taxable: number; cgst: number; sgst: number; igst: number }>();
  for (const l of inv.lines) {
    const key = l.hsn || "—";
    const g = hsnGroups.get(key) ?? { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    g.taxable += l.taxableValue; g.cgst += l.cgst; g.sgst += l.sgst; g.igst += l.igst;
    hsnGroups.set(key, g);
  }
  const totalTax = inv.cgstTotal + inv.sgstTotal + inv.igstTotal;

  return (
    <Document title={`Invoice ${inv.id}`}>
      <Page size="A4" style={s.page}>
        <View style={s.titleRow}>
          <Text style={s.h1}>Tax Invoice</Text>
          <Text style={s.ref}>Internal reference {inv.id}</Text>
        </View>

        <View style={s.rowBoxes}>
          <View style={[s.box, s.colHalf]}>
            <Text style={s.label}>Seller</Text>
            <Text style={s.bold}>{inv.seller.legalName}</Text>
            <Text>{inv.seller.address || "—"}</Text>
            {!!inv.seller.phone && <Text>Mob/Phone: {inv.seller.phone}</Text>}
            {!!inv.seller.email && <Text>Email: {inv.seller.email}</Text>}
            <Text>GSTIN: {inv.seller.gstin || "—"}</Text>
          </View>
          <View style={[s.box, s.colHalf, { borderLeftWidth: 0 }]}>
            <View style={s.metaGrid}>
              <View style={s.metaCell}>
                <Text style={s.label}>Invoice No.</Text>
                <Text style={s.bold}>{inv.supplierInvoiceNo}</Text>
              </View>
              <View style={s.metaCell}>
                <Text style={s.label}>Dated</Text>
                <Text style={s.bold}>{inv.supplierInvoiceDate}</Text>
              </View>
              <View style={s.metaCell}>
                <Text style={s.label}>Transport mode</Text>
                <Text>{inv.transportMode || "—"}</Text>
              </View>
              <View style={s.metaCell}>
                <Text style={s.label}>Payment terms</Text>
                <Text>{inv.paymentTerms || "—"}</Text>
              </View>
              <View style={{ width: "100%" }}>
                <Text style={s.label}>Place of supply</Text>
                <Text>{inv.placeOfSupply || "—"}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[s.rowBoxes, { marginTop: -1 }]}>
          <View style={[s.box, s.colHalf]}>
            <Text style={s.label}>Consignee (shipped to)</Text>
            <Text style={s.bold}>{inv.buyer.legalName}</Text>
            <Text>{inv.buyer.address}</Text>
            <Text>GSTIN: {inv.buyer.gstin} · PAN: {inv.buyer.pan}</Text>
          </View>
          <View style={[s.box, s.colHalf, { borderLeftWidth: 0 }]}>
            <Text style={s.label}>Buyer (billed to)</Text>
            <Text style={s.bold}>{inv.buyer.legalName}</Text>
            <Text>{inv.buyer.address}</Text>
            <Text>GSTIN: {inv.buyer.gstin} · PAN: {inv.buyer.pan}</Text>
          </View>
        </View>

        <View style={s.table}>
          <View style={s.trHead} fixed>
            <Text style={[s.th, { width: `${cols[0]}%` }]}>Sr</Text>
            <Text style={[s.th, { width: `${cols[1]}%` }]}>Description</Text>
            <Text style={[s.th, { width: `${cols[2]}%` }]}>HSN</Text>
            <Text style={[s.th, s.right, { width: `${cols[3]}%` }]}>Qty</Text>
            <Text style={[s.th, { width: `${cols[4]}%` }]}>UOM</Text>
            <Text style={[s.th, s.right, { width: `${cols[5]}%` }]}>Rate</Text>
            <Text style={[s.th, s.right, { width: `${cols[6]}%` }]}>Disc.</Text>
            <Text style={[s.th, s.right, { width: `${cols[7]}%` }]}>Taxable</Text>
            <Text style={[s.th, s.right, { width: `${cols[8]}%` }]}>GST%</Text>
            {inv.taxMode === "intra" ? (
              <>
                <Text style={[s.th, s.right, { width: `${cols[9]}%` }]}>CGST</Text>
                <Text style={[s.th, s.right, { width: `${cols[10]}%` }]}>SGST</Text>
              </>
            ) : (
              <Text style={[s.th, s.right, { width: `${cols[9]}%` }]}>IGST</Text>
            )}
            <Text style={[s.th, s.right, { width: `${cols[cols.length - 1]}%` }]}>Amount</Text>
          </View>
          {inv.lines.map((l, i) => (
            <View style={s.tr} key={i} wrap={false}>
              <Text style={[s.td, { width: `${cols[0]}%` }]}>{i + 1}</Text>
              <Text style={[s.td, { width: `${cols[1]}%` }]}>{l.description}</Text>
              <Text style={[s.td, { width: `${cols[2]}%` }]}>{l.hsn || "—"}</Text>
              <Text style={[s.td, s.right, { width: `${cols[3]}%` }]}>{l.qty}</Text>
              <Text style={[s.td, { width: `${cols[4]}%` }]}>{l.uom}</Text>
              <Text style={[s.td, s.right, { width: `${cols[5]}%` }]}>{inr(l.rate)}</Text>
              <Text style={[s.td, s.right, { width: `${cols[6]}%` }]}>{l.disc ? inr(l.disc) : "—"}</Text>
              <Text style={[s.td, s.right, { width: `${cols[7]}%` }]}>{inr(l.taxableValue)}</Text>
              <Text style={[s.td, s.right, { width: `${cols[8]}%` }]}>{l.gstPercent}%</Text>
              {inv.taxMode === "intra" ? (
                <>
                  <Text style={[s.td, s.right, { width: `${cols[9]}%` }]}>{inr(l.cgst)}</Text>
                  <Text style={[s.td, s.right, { width: `${cols[10]}%` }]}>{inr(l.sgst)}</Text>
                </>
              ) : (
                <Text style={[s.td, s.right, { width: `${cols[9]}%` }]}>{inr(l.igst)}</Text>
              )}
              <Text style={[s.td, s.right, s.bold, { width: `${cols[cols.length - 1]}%` }]}>
                {inr(l.taxableValue + l.cgst + l.sgst + l.igst)}
              </Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={{ color: C.muted }}>Taxable total</Text>
            <Text>{inr(inv.taxableTotal)}</Text>
          </View>
          {inv.taxMode === "intra" ? (
            <>
              <View style={s.totalRow}>
                <Text style={{ color: C.muted }}>CGST</Text>
                <Text>{inr(inv.cgstTotal)}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={{ color: C.muted }}>SGST</Text>
                <Text>{inr(inv.sgstTotal)}</Text>
              </View>
            </>
          ) : (
            <View style={s.totalRow}>
              <Text style={{ color: C.muted }}>IGST</Text>
              <Text>{inr(inv.igstTotal)}</Text>
            </View>
          )}
          <View style={s.totalRow}>
            <Text style={{ color: C.muted }}>Round off</Text>
            <Text>{inr(inv.roundOff)}</Text>
          </View>
          <View style={s.totalFinal}>
            <Text style={s.bold}>Total</Text>
            <Text style={s.bold}>{inr(inv.grandTotal)}</Text>
          </View>
        </View>

        <Text style={{ marginTop: 6 }}>
          <Text style={s.label}>Amount chargeable (in words){"  "}</Text>
          <Text>{amountInWords(inv.grandTotal)}</Text>
        </Text>

        <View style={s.table}>
          <View style={s.trHead}>
            <Text style={[s.th, { width: "25%" }]}>HSN/SAC</Text>
            <Text style={[s.th, s.right, { width: "25%" }]}>Taxable value</Text>
            {inv.taxMode === "intra" ? (
              <>
                <Text style={[s.th, s.right, { width: "20%" }]}>Central tax</Text>
                <Text style={[s.th, s.right, { width: "20%" }]}>State tax</Text>
              </>
            ) : (
              <Text style={[s.th, s.right, { width: "25%" }]}>Integrated tax</Text>
            )}
            <Text style={[s.th, s.right, { width: "15%" }]}>Total tax</Text>
          </View>
          {[...hsnGroups.entries()].map(([hsn, g]) => (
            <View style={s.tr} key={hsn}>
              <Text style={[s.td, { width: "25%" }]}>{hsn}</Text>
              <Text style={[s.td, s.right, { width: "25%" }]}>{inr(g.taxable)}</Text>
              {inv.taxMode === "intra" ? (
                <>
                  <Text style={[s.td, s.right, { width: "20%" }]}>{inr(g.cgst)}</Text>
                  <Text style={[s.td, s.right, { width: "20%" }]}>{inr(g.sgst)}</Text>
                </>
              ) : (
                <Text style={[s.td, s.right, { width: "25%" }]}>{inr(g.igst)}</Text>
              )}
              <Text style={[s.td, s.right, { width: "15%" }]}>{inr(g.cgst + g.sgst + g.igst)}</Text>
            </View>
          ))}
          <View style={s.tr}>
            <Text style={[s.td, s.bold, { width: "25%" }]}>Total</Text>
            <Text style={[s.td, s.right, s.bold, { width: "25%" }]}>{inr(inv.taxableTotal)}</Text>
            {inv.taxMode === "intra" ? (
              <>
                <Text style={[s.td, s.right, s.bold, { width: "20%" }]}>{inr(inv.cgstTotal)}</Text>
                <Text style={[s.td, s.right, s.bold, { width: "20%" }]}>{inr(inv.sgstTotal)}</Text>
              </>
            ) : (
              <Text style={[s.td, s.right, s.bold, { width: "25%" }]}>{inr(inv.igstTotal)}</Text>
            )}
            <Text style={[s.td, s.right, s.bold, { width: "15%" }]}>{inr(totalTax)}</Text>
          </View>
        </View>

        <Text style={{ marginTop: 6 }}>
          <Text style={s.label}>Tax amount (in words){"  "}</Text>
          <Text>{amountInWords(totalTax)}</Text>
        </Text>

        <View style={s.footer}>
          <Text style={{ maxWidth: "55%", color: C.muted }}>
            Declaration: this record shows the price and tax figures as stated on the
            supplier&apos;s own invoice {inv.supplierInvoiceNo || "(number pending)"}, dated{" "}
            {inv.supplierInvoiceDate || "—"}.
          </Text>
          <View style={{ textAlign: "right" }}>
            <Text>
              For <Text style={s.bold}>{inv.buyer.legalName}</Text>
            </Text>
            <Text style={[s.label, { marginTop: 18 }]}>Recorded by Smash Pro Operations</Text>
          </View>
        </View>
        <Text style={s.disclaimer}>
          This is Smash Pro&apos;s internal record of a supplier-issued tax invoice — not a
          self-generated e-invoice. GST/HSN figures are transcribed, not computed or
          validated (OBD-11/OBD-20 pending).
        </Text>
      </Page>
    </Document>
  );
}
