import { CalendarDays, History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RiwayatPengambilanPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Riwayat Pengambilan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Catatan pengambilan barang
        </p>
      </div>

      <Card className="rounded-lg border-stone-200 shadow-sm dark:border-neutral-800">
        <CardHeader className="gap-2 border-b">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="size-4" />
              Riwayat
            </CardTitle>
            <Badge variant="secondary">0 data</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="overflow-x-auto rounded-lg border">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-4 bg-muted px-3 py-2 text-sm font-medium">
                <span>Tanggal</span>
                <span>Departemen</span>
                <span>Shift</span>
                <span>Status</span>
              </div>
              <div className="flex min-h-36 flex-col items-center justify-center gap-2 px-3 py-8 text-center">
                <CalendarDays className="size-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Belum ada riwayat pengambilan.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
