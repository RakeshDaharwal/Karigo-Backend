// Minimal RFC-4180 CSV parser (quoted fields, escaped quotes, commas/newlines
// inside quotes). Avoids adding a dependency. Returns an array of objects keyed
// by lower-cased trimmed header names.

const stripBom = (text: string) =>
  text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

// Splits raw CSV text into rows of cell strings. Handles CRLF/LF line endings.
const parseCsvRows = (input: string) => {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;
  const text = stripBom(input);

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        // RFC-4180: doubled quote inside a quoted field is a literal quote.
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }

    if (ch === "\r") {
      // CRLF or stray CR: peek and end the row.
      if (text[i + 1] === "\n") {
        i++;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  // Trailing cell/row if file does not end with a newline.
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
};

export type CsvRecord = Record<string, string>;

export const parseCsv = (input: string): CsvRecord[] => {
  const rows = parseCsvRows(input);
  if (rows.length === 0) {
    return [];
  }
  const headers = rows[0].map((h) => h.trim().toLowerCase());

  return rows.slice(1).map((cells) => {
    const rec: CsvRecord = {};
    headers.forEach((h, idx) => {
      rec[h] = (cells[idx] ?? "").trim();
    });
    return rec;
  });
};

export type ProductCsvRow = {
  name: string;
  description: string;
  price: number;
};

// Validates required columns and parses each row into a typed product record.
// Throws a 400-style error with row index on the first invalid row to keep
// the upload contract strict; partial imports require an explicit flag.
export const parseProductsCsv = (input: string): ProductCsvRow[] => {
  const records = parseCsv(input);
  if (records.length === 0) {
    return [];
  }

  const required = ["name", "price"];
  const firstRow = records[0];
  for (const col of required) {
    if (!(col in firstRow)) {
      const err = new Error(
        `CSV missing required column: ${col}. Required: name, price (description optional).`
      ) as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }
  }

  return records.map((rec, idx) => {
    const name = (rec.name ?? "").trim();
    const description = (rec.description ?? "").trim();
    const priceRaw = (rec.price ?? "").trim();

    if (!name) {
      const err = new Error(
        `CSV row ${idx + 2}: name is required`
      ) as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }

    const price = Number(priceRaw);
    if (!Number.isFinite(price) || price < 0) {
      const err = new Error(
        `CSV row ${idx + 2}: price "${priceRaw}" is not a valid non-negative number`
      ) as Error & { statusCode: number };
      err.statusCode = 400;
      throw err;
    }

    return { name, description, price };
  });
};
