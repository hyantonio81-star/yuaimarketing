/**
 * Client-side export: CSV / JSON download for Market Intel and other pages.
 */

function escapeCsvCell(value) {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * @param {Record<string, unknown>[]} rows - Array of objects (keys = columns)
 * @param {string} filename - e.g. "market-intel-news.csv"
 */
export function downloadCsv(rows, filename = "export.csv") {
  if (!Array.isArray(rows) || rows.length === 0) {
    const headers = ["(no data)"];
    const blob = new Blob(["\uFEFF", headers.join(",")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  const keys = Object.keys(rows[0]);
  const header = keys.map(escapeCsvCell).join(",");
  const body = rows.map((row) => keys.map((k) => escapeCsvCell(row[k])).join(",")).join("\n");
  const blob = new Blob(["\uFEFF", header, "\n", body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * @param {unknown} data - Object or array to export as JSON
 * @param {string} filename - e.g. "report-settings.json"
 */
export function downloadJson(data, filename = "export.json") {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
