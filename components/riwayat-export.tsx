"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PurposeMenuGroup } from "@/lib/pengambilan-barang";

const EXCELJS_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js";
const JSPDF_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const AUTOTABLE_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";

export type ExportRow = {
  tanggal: string;
  nama: string;
  departemen: string;
  shift: string;
  nama_barang: string;
  satuan: string;
  jumlah_diambil: number;
  jumlah_terpakai: number;
  sisa: number;
  purposeMenus: PurposeMenuGroup[];
  keterangan: string;
};

// Format multi-baris (seperti tampilan tabel web):
//   Event
//   1. Nasi goreng (1)
//   2. Nasi liwet (2)
//
//   Resto
//   1. Nasi tumpeng (1)
function purposeMenusToLines(groups: PurposeMenuGroup[]) {
  if (!groups || groups.length === 0) {
    return "-";
  }
  return groups
    .map((group) => {
      const total = group.menus.reduce((sum, row) => sum + row.jumlah, 0);
      return [
        `${group.purpose} (${total})`,
        ...group.menus.map(
          (row, index) => `${index + 1}. ${row.menu} (${row.jumlah})`
        ),
      ].join("\n");
    })
    .join("\n\n");
}

/* ---- Tipe minimal untuk lib CDN (tanpa @types) ---- */
type ExcelAlignment = {
  vertical?: string;
  horizontal?: string;
  wrapText?: boolean;
};
type ExcelBorderSide = { style: string };
type ExcelCell = {
  value: string | number | null;
  font?: { bold?: boolean; color?: { argb: string } };
  fill?: { type: string; pattern: string; fgColor: { argb: string } };
  alignment?: ExcelAlignment;
  border?: Record<string, ExcelBorderSide>;
};
type ExcelRow = {
  eachCell: (cb: (cell: ExcelCell) => void) => void;
};
type ExcelColumn = { width?: number };
type ExcelWorksheet = {
  addRow: (values: (string | number)[]) => ExcelRow;
  getColumn: (index: number) => ExcelColumn;
  eachRow: (cb: (row: ExcelRow, rowNumber: number) => void) => void;
};
type ExcelWorkbook = {
  addWorksheet: (name: string) => ExcelWorksheet;
  xlsx: { writeBuffer: () => Promise<ArrayBuffer> };
};
type ExcelJSNamespace = { Workbook: new () => ExcelWorkbook };

type JsPdfDoc = {
  text: (text: string, x: number, y: number) => void;
  setFontSize: (size: number) => void;
  autoTable: (options: Record<string, unknown>) => void;
  save: (filename: string) => void;
};

function loadScript(src: string, ready: () => boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ready()) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error(`Gagal memuat ${src}`))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Gagal memuat ${src}`));
    document.body.appendChild(script);
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function formatTanggal(value: string) {
  const [year, month, day] = value.split("-");
  const monthName = MONTH_NAMES[Number(month) - 1];
  if (!year || !monthName || !day) {
    return value;
  }
  return `${day.padStart(2, "0")} ${monthName} ${year}`;
}

function fileStamp() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

const HEADERS = [
  "No",
  "Tanggal",
  "Nama PIC",
  "Departemen",
  "Shift",
  "Nama Barang",
  "Satuan",
  "Jumlah Diambil",
  "Jumlah Terpakai",
  "Purpose & Menu",
  "Sisa",
  "Keterangan",
];

function toRow(row: ExportRow, index: number): (string | number)[] {
  return [
    index + 1,
    formatTanggal(row.tanggal),
    row.nama,
    row.departemen,
    row.shift,
    row.nama_barang,
    row.satuan,
    row.jumlah_diambil,
    row.jumlah_terpakai,
    purposeMenusToLines(row.purposeMenus),
    row.sisa,
    row.keterangan,
  ];
}

function computeColumnWidths(dataRows: (string | number)[][]) {
  return HEADERS.map((_, col) => {
    let max = 0;
    for (const row of dataRows) {
      const value = row[col];
      const text = value == null ? "" : String(value);
      const longestLine = text
        .split("\n")
        .reduce((m, line) => Math.max(m, line.length), 0);
      max = Math.max(max, longestLine);
    }
    return Math.min(Math.max(max + 2, 6), 50);
  });
}

export function RiwayatExport({ rows }: { rows: ExportRow[] }) {
  const [busy, setBusy] = useState<"excel" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const disabled = rows.length === 0 || busy !== null;

  async function exportExcel() {
    setError(null);
    setBusy("excel");
    try {
      await loadScript(
        EXCELJS_SRC,
        () =>
          typeof (window as unknown as { ExcelJS?: ExcelJSNamespace })
            .ExcelJS !== "undefined"
      );
      const ExcelJS = (window as unknown as { ExcelJS: ExcelJSNamespace })
        .ExcelJS;

      const bodyRows = rows.map(toRow);
      const allRows = [HEADERS, ...bodyRows];
      const widths = computeColumnWidths(allRows);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Riwayat");

      worksheet.addRow(HEADERS);
      for (const row of bodyRows) {
        worksheet.addRow(row);
      }

      widths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
      });

      const thin: ExcelBorderSide = { style: "thin" };
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: thin,
            left: thin,
            bottom: thin,
            right: thin,
          };
          if (rowNumber === 1) {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF171717" },
            };
            cell.alignment = {
              vertical: "middle",
              horizontal: "left",
              wrapText: true,
            };
          } else {
            cell.alignment = { vertical: "top", wrapText: true };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      downloadBlob(
        new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
        `riwayat-pengambilan-${fileStamp()}.xlsx`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal export Excel.");
    } finally {
      setBusy(null);
    }
  }

  async function exportPdf() {
    setError(null);
    setBusy("pdf");
    try {
      await loadScript(
        JSPDF_SRC,
        () =>
          typeof (window as unknown as { jspdf?: unknown }).jspdf !== "undefined"
      );
      await loadScript(AUTOTABLE_SRC, () => {
        const jspdf = (
          window as unknown as { jspdf?: { jsPDF?: { prototype?: unknown } } }
        ).jspdf;
        return Boolean(
          jspdf?.jsPDF &&
            (jspdf.jsPDF.prototype as { autoTable?: unknown })?.autoTable
        );
      });

      const { jsPDF } = (
        window as unknown as {
          jspdf: { jsPDF: new (opts?: unknown) => JsPdfDoc };
        }
      ).jspdf;

      const doc = new jsPDF({ orientation: "landscape" });
      doc.setFontSize(14);
      doc.text("Riwayat Pengambilan Barang", 14, 16);

      doc.autoTable({
        startY: 22,
        theme: "grid",
        head: [HEADERS],
        body: rows.map(toRow),
        styles: { fontSize: 7, cellPadding: 2, valign: "top" },
        headStyles: { fillColor: [23, 23, 23], valign: "middle" },
      });

      doc.save(`riwayat-pengambilan-${fileStamp()}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal export PDF.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={exportExcel}
        >
          <FileSpreadsheet data-icon="inline-start" />
          {busy === "excel" ? "Menyiapkan..." : "Export Excel"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={exportPdf}
        >
          <FileText data-icon="inline-start" />
          {busy === "pdf" ? "Menyiapkan..." : "Export PDF"}
        </Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
