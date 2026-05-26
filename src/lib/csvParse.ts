export interface ParsedCsv {
  headers: string[];
  rows: string[][];
  rowCount: number;
  numericColumns: string[];
  categoricalColumns: string[];
  uniqueValues: Record<string, string[]>;
}

function parseLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result.map((s) => s.trim());
}

function isNumericString(v: string): boolean {
  if (!v) return false;
  // Accept either "55.88" or "55,88" — replace comma decimal then parse
  const cleaned = v.replace(",", ".");
  const num = Number(cleaned);
  return Number.isFinite(num);
}

export function parseCsv(text: string): ParsedCsv {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return {
      headers: [],
      rows: [],
      rowCount: 0,
      numericColumns: [],
      categoricalColumns: [],
      uniqueValues: {},
    };
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);

  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];
  const uniqueValues: Record<string, string[]> = {};

  headers.forEach((h, idx) => {
    const col = rows
      .map((r) => (r[idx] ?? "").trim())
      .filter((v) => v.length > 0);
    if (col.length === 0) return;

    const numericCount = col.filter(isNumericString).length;
    const allNumeric = numericCount === col.length;

    if (allNumeric) {
      numericColumns.push(h);
    } else {
      const uniq = Array.from(new Set(col));
      categoricalColumns.push(h);
      // Only keep enumerable categoricals (<=12 distinct values)
      if (uniq.length <= 12) {
        uniqueValues[h] = uniq;
      }
    }
  });

  return {
    headers,
    rows,
    rowCount: rows.length,
    numericColumns,
    categoricalColumns,
    uniqueValues,
  };
}
