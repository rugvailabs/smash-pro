import "server-only";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/server/auth";
import { nextSkuSequence } from "@/server/admin";
import { parseStockSheet, type ImportedRow } from "@/lib/excel-import-mapping";

/* ============================================================
   ADR-0017 — reads an admin-uploaded supplier stock sheet (.xlsx) into
   a plain grid for the pure mapper (lib/excel-import-mapping.ts), then
   assigns each parsed row a candidate ProSmash SKU. This is PREVIEW
   only — no DB write happens here; server/admin.ts's
   bulkImportProducts() does the actual insert, from whatever the admin
   confirms (which may be fewer rows than this preview returned).
   ============================================================ */

export interface ImportPreviewRow extends ImportedRow {
  sku: string;
  /** false when this row is missing required pricing data and can't be
   *  imported as-is — still shown in the preview so admin sees why. */
  importable: boolean;
}

export interface ImportPreview {
  rows: ImportPreviewRow[];
  skippedBlankRows: number;
  headerNotFound: boolean;
}

type CellValue = string | number | null;

function flattenCell(raw: ExcelJS.CellValue): CellValue {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number" || typeof raw === "string") return raw;
  if (raw instanceof Date) return raw.toISOString();
  if (typeof raw === "object") {
    if ("result" in raw && raw.result !== undefined) return flattenCell(raw.result as ExcelJS.CellValue);
    if ("text" in raw && typeof (raw as { text?: unknown }).text === "string") {
      return (raw as { text: string }).text;
    }
    if ("richText" in raw && Array.isArray((raw as { richText: { text: string }[] }).richText)) {
      return (raw as { richText: { text: string }[] }).richText.map((t) => t.text).join("");
    }
  }
  return String(raw);
}

async function readGrid(buffer: ArrayBuffer): Promise<CellValue[][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const sheet = wb.worksheets[0];
  if (!sheet) throw new Error("400:No worksheet found in the uploaded file");
  const grid: CellValue[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const arr: CellValue[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      arr[colNumber - 1] = flattenCell(cell.value);
    });
    grid[rowNumber - 1] = arr;
  });
  return grid;
}

/** Parses an uploaded stock sheet and assigns each row a candidate SKU
 *  (continuing the existing `<prefix>-####` sequence) — preview only. */
export async function previewImport(buffer: ArrayBuffer, skuPrefix: string): Promise<ImportPreview> {
  await requireAdmin();
  const prefix = skuPrefix.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(prefix)) throw new Error("400:SKU prefix must be two letters");

  const grid = await readGrid(buffer);
  const { rows, skippedBlankRows, headerNotFound } = parseStockSheet(grid);
  if (headerNotFound) return { rows: [], skippedBlankRows, headerNotFound: true };
  if (rows.length === 0) return { rows: [], skippedBlankRows, headerNotFound: false };

  const skus = await nextSkuSequence(prefix, rows.length);
  const previewRows: ImportPreviewRow[] = rows.map((r, i) => ({
    ...r,
    sku: skus[i],
    importable: r.mrp !== null && r.mrp > 0 && r.dealerExGst !== null && r.dealerExGst > 0,
  }));
  return { rows: previewRows, skippedBlankRows, headerNotFound: false };
}
