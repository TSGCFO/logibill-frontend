/**
 * Lightweight CSV/Excel export utilities for DataTable.
 * No external dependencies - uses pure browser APIs.
 */

export interface ExportColumn {
  key: string;
  label: string;
}

/**
 * Escapes a cell value for CSV format.
 * Wraps in quotes if the value contains commas, quotes, or newlines.
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);

  // If value contains comma, double-quote, or newline, wrap in quotes
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Resolves a nested key path (e.g., "customer.name") to a value from a record.
 */
function resolveValue(record: Record<string, unknown>, key: string): unknown {
  return key.split(".").reduce<unknown>((obj, part) => {
    if (obj && typeof obj === "object" && part in (obj as Record<string, unknown>)) {
      return (obj as Record<string, unknown>)[part];
    }
    return undefined;
  }, record);
}

/**
 * Converts an array of data records into a CSV string.
 */
function buildCSVContent(
  data: Record<string, unknown>[],
  columns?: ExportColumn[]
): string {
  if (data.length === 0) {
    return "";
  }

  // If no columns specified, derive from the first data record keys
  const cols: ExportColumn[] =
    columns ??
    Object.keys(data[0]).map((key) => ({
      key,
      label: key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    }));

  // Build header row
  const headerRow = cols.map((col) => escapeCSVValue(col.label)).join(",");

  // Build data rows
  const dataRows = data.map((record) =>
    cols.map((col) => escapeCSVValue(resolveValue(record, col.key))).join(",")
  );

  return [headerRow, ...dataRows].join("\r\n");
}

/**
 * Triggers a file download in the browser.
 */
function triggerDownload(content: string, filename: string, mimeType: string): void {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports data as a CSV file and triggers a browser download.
 *
 * @param data - Array of records to export
 * @param filename - Base filename (without extension)
 * @param columns - Optional column definitions for header labels and key ordering
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns?: ExportColumn[]
): void {
  const csv = buildCSVContent(data, columns);
  const timestamp = new Date().toISOString().slice(0, 10);
  triggerDownload(csv, `${filename}-${timestamp}.csv`, "text/csv");
}

/**
 * Exports data as an Excel-compatible file (.xlsx) and triggers a browser download.
 * Uses tab-separated values which Excel opens natively, avoiding heavy library deps.
 *
 * @param data - Array of records to export
 * @param filename - Base filename (without extension)
 * @param columns - Optional column definitions for header labels and key ordering
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  columns?: ExportColumn[]
): void {
  if (data.length === 0) {
    triggerDownload("", `${filename}.xlsx`, "application/vnd.ms-excel");
    return;
  }

  // If no columns specified, derive from the first data record keys
  const cols: ExportColumn[] =
    columns ??
    Object.keys(data[0]).map((key) => ({
      key,
      label: key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    }));

  // Build XML-based Excel spreadsheet (SpreadsheetML) for proper .xlsx compatibility
  const headerCells = cols
    .map((col) => `<Cell><Data ss:Type="String">${escapeXML(col.label)}</Data></Cell>`)
    .join("");

  const dataRows = data
    .map((record) => {
      const cells = cols
        .map((col) => {
          const raw = resolveValue(record, col.key);
          const value = raw === null || raw === undefined ? "" : String(raw);
          const isNumeric = value !== "" && !isNaN(Number(value)) && value.trim() !== "";
          const type = isNumeric ? "Number" : "String";
          return `<Cell><Data ss:Type="${type}">${escapeXML(value)}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Export">
    <Table>
      <Row ss:StyleID="Header">${headerCells}</Row>
      ${dataRows}
    </Table>
  </Worksheet>
</Workbook>`;

  const timestamp = new Date().toISOString().slice(0, 10);
  triggerDownload(xml, `${filename}-${timestamp}.xls`, "application/vnd.ms-excel");
}

/**
 * Escapes special XML characters in a string.
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
