/** Minimal CSV parser: handles quoted fields, escaped quotes, CRLF. */
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((c) => c !== "")) rows.push(row);
  }

  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((r) => {
    const rec: Record<string, string> = {};
    header.forEach((h, idx) => {
      rec[h.trim()] = (r[idx] ?? "").trim();
    });
    return rec;
  });
}

export function csvHeader(text: string): string[] {
  const first = text.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "";
  return first.split(",").map((h) => h.trim());
}
