/**
 * Source-of-truth Google Sheet configuration.
 *
 * Sheet ID resolution order:
 *   1. VITE_GOOGLE_SHEET_ID environment variable (.env)
 *   2. FALLBACK_SHEET_ID constant below
 *
 * The sheet must be published publicly:
 *   File > Share > Publish to web → each tab as CSV
 *
 * Required tabs: "rates", "stones", "slabs"
 */

const FALLBACK_SHEET_ID = "1KWHxzODjoqEDYpXz6FqhPzggpM2YvsRLVwgwQ-Yfgv0";

export const SHEET_ID: string =
  (import.meta.env.VITE_GOOGLE_SHEET_ID as string | undefined) ||
  FALLBACK_SHEET_ID;

/**
 * Returns the public CSV export URL for a given sheet tab (by name).
 * Works only when the sheet is published to the web.
 */
export function getSheetTabCsvUrl(sheetId: string, tabName: string): string {
  // gviz/tq with tq=select * and output=csv gives clean CSV for named tabs
  const encodedQuery = encodeURIComponent("select *");
  const encodedSheet = encodeURIComponent(tabName);
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodedSheet}&tq=${encodedQuery}`;
}
