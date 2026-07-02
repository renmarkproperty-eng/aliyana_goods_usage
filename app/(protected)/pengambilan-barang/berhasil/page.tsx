import Link from "next/link";
import { ArrowLeft, CircleCheckBig } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PengambilanBerhasilPage() {
  return (
    <div className="mx-auto grid max-w-md gap-5 py-8">
      <Card className="rounded-lg border-stone-200 text-center shadow-sm dark:border-neutral-800">
        <CardHeader className="items-center gap-3 pt-8">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <CircleCheckBig className="size-7" />
          </div>
          <CardTitle className="text-xl">Data Berhasil Disimpan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 pb-8">
          <p className="text-sm text-muted-foreground">
            Pengambilan barang sudah tersimpan. Kamu bisa menginput data baru
            kapan saja.
          </p>
          <Button
            render={<Link href="/pengambilan-barang" />}
            nativeButton={false}
            size="lg"
            className="w-full"
          >
            <ArrowLeft data-icon="inline-start" />
            Kembali
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
