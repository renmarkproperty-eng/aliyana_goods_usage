import Link from "next/link";
import { CalendarDays, ExternalLink, History } from "lucide-react";
import { connection } from "next/server";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PurposeMenuCell } from "@/components/purpose-menu-cell";
import { RiwayatExport } from "@/components/riwayat-export";
import { RiwayatFilter } from "@/components/riwayat-filter";
import {
  getPicOptions,
  getRiwayatLengkap,
} from "@/lib/pengambilan-barang";

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  const monthName = MONTH_NAMES[Number(month) - 1];

  if (!year || !monthName || !day) {
    return value;
  }

  return `${day.padStart(2, "0")} ${monthName} ${year}`;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value ?? "";
}

export default async function RiwayatPengambilanPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await connection();

  const params = await searchParams;
  const picParam = firstParam(params.pic);
  const dari = firstParam(params.dari);
  const sampai = firstParam(params.sampai);
  const userId = picParam ? Number.parseInt(picParam, 10) : undefined;

  const [picOptions, { data: riwayat, supabaseConfigured }] = await Promise.all(
    [
      getPicOptions(),
      getRiwayatLengkap({
        userId: Number.isInteger(userId) ? userId : undefined,
        tanggalDari: dari || undefined,
        tanggalSampai: sampai || undefined,
      }),
    ]
  );

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Riwayat Pengambilan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catatan pengambilan dan pemakaian barang
        </p>
      </div>

      <RiwayatFilter
        picOptions={picOptions}
        current={{ pic: picParam, dari, sampai }}
      />

      <Card className="rounded-lg border-stone-200 shadow-sm dark:border-neutral-800">
        <CardHeader className="gap-3 border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" />
              Riwayat
              <Badge variant="secondary">{riwayat.length} baris</Badge>
            </CardTitle>
            <RiwayatExport rows={riwayat} />
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b bg-muted text-left">
                  <th className="px-3 py-2 font-medium">Tanggal</th>
                  <th className="px-3 py-2 font-medium">Nama PIC</th>
                  <th className="px-3 py-2 font-medium">Departemen</th>
                  <th className="px-3 py-2 font-medium">Shift</th>
                  <th className="px-3 py-2 font-medium">Nama Barang</th>
                  <th className="px-3 py-2 font-medium">Satuan</th>
                  <th className="px-3 py-2 text-right font-medium">Diambil</th>
                  <th className="px-3 py-2 text-right font-medium">Terpakai</th>
                  <th className="px-3 py-2 font-medium">Purpose &amp; Menu</th>
                  <th className="px-3 py-2 text-right font-medium">Sisa</th>
                  <th className="px-3 py-2 font-medium">Keterangan</th>
                  <th className="px-3 py-2 text-right font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.length > 0 ? (
                  riwayat.map((item, index) => (
                    <tr
                      key={`${item.pengambilanId}-${index}`}
                      className="border-b last:border-0 hover:bg-muted/40"
                    >
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {formatDateLabel(item.tanggal)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-medium">
                        {item.nama}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
                        {item.departemen}
                      </td>
                      <td className="px-3 py-2.5">{item.shift}</td>
                      <td className="whitespace-nowrap px-3 py-2.5">
                        {item.nama_barang}
                      </td>
                      <td className="px-3 py-2.5">{item.satuan}</td>
                      <td className="px-3 py-2.5 text-right">
                        {item.jumlah_diambil}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {item.jumlah_terpakai}
                      </td>
                      <td className="px-3 py-2.5">
                        <PurposeMenuCell groups={item.purposeMenus} />
                      </td>
                      <td className="px-3 py-2.5 text-right">{item.sisa}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {item.keterangan}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Link
                          href={`/riwayat-pengambilan/${item.pengambilanId}`}
                          className="inline-flex items-center text-muted-foreground transition-colors hover:text-foreground"
                          aria-label="Lihat detail"
                        >
                          <ExternalLink className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="px-3 py-10">
                      <div className="flex flex-col items-center justify-center gap-2 text-center">
                        <CalendarDays className="size-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {supabaseConfigured
                            ? "Tidak ada riwayat untuk filter ini."
                            : "Supabase belum dikonfigurasi."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
