import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Boxes } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PurposeMenuCell } from "@/components/purpose-menu-cell";
import { getDetailPengambilan } from "@/lib/pengambilan-barang";

export const dynamic = "force-dynamic";

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

export default async function DetailRiwayatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number.parseInt(id, 10);

  if (!Number.isInteger(numericId)) {
    notFound();
  }

  const { header, items } = await getDetailPengambilan(numericId);

  if (!header) {
    notFound();
  }

  const totalDiambil = items.reduce((sum, item) => sum + item.jumlah_diambil, 0);
  const totalTerpakai = items.reduce(
    (sum, item) => sum + item.jumlah_terpakai,
    0
  );
  const totalSisa = totalDiambil - totalTerpakai;

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Link
          href="/riwayat-pengambilan"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Riwayat Pengambilan
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Detail Pengambilan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateLabel(header.tanggal)} · {header.nama}
          </p>
        </div>
      </div>

      <Card className="rounded-lg border-stone-200 shadow-sm dark:border-neutral-800">
        <CardHeader className="gap-2 border-b">
          <CardTitle className="text-base">Informasi Pengambilan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Tanggal</p>
            <p className="text-sm font-medium">
              {formatDateLabel(header.tanggal)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nama PIC</p>
            <p className="text-sm font-medium">{header.nama}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Departemen</p>
            <p className="text-sm font-medium">{header.departemen}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Shift</p>
            <p className="text-sm font-medium">{header.shift}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border-stone-200 shadow-sm dark:border-neutral-800">
        <CardHeader className="gap-2 border-b">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Boxes className="size-4" />
              Detail Barang
            </CardTitle>
            <Badge variant="secondary">{items.length} barang</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="w-10 px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Nama Barang</th>
                  <th className="px-3 py-2 font-medium">Satuan</th>
                  <th className="px-3 py-2 text-right font-medium">Diambil</th>
                  <th className="px-3 py-2 text-right font-medium">Terpakai</th>
                  <th className="px-3 py-2 font-medium">Purpose &amp; Menu</th>
                  <th className="px-3 py-2 text-right font-medium">Sisa</th>
                  <th className="px-3 py-2 font-medium">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2.5 font-medium">
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
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/40 font-medium">
                  <td className="px-3 py-2.5" colSpan={3}>
                    Total
                  </td>
                  <td className="px-3 py-2.5 text-right">{totalDiambil}</td>
                  <td className="px-3 py-2.5 text-right">{totalTerpakai}</td>
                  <td className="px-3 py-2.5" />
                  <td className="px-3 py-2.5 text-right">{totalSisa}</td>
                  <td className="px-3 py-2.5" />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <div>
        <Button
          render={<Link href="/riwayat-pengambilan" />}
          nativeButton={false}
          variant="outline"
        >
          <ArrowLeft data-icon="inline-start" />
          Kembali
        </Button>
      </div>
    </div>
  );
}
