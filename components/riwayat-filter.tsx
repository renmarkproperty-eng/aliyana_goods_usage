"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PicOption } from "@/lib/pengambilan-barang";

const ALL = "all";

export function RiwayatFilter({
  picOptions,
  current,
}: {
  picOptions: PicOption[];
  current: { pic: string; dari: string; sampai: string };
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [pic, setPic] = useState(current.pic || ALL);
  const [dari, setDari] = useState(current.dari);
  const [sampai, setSampai] = useState(current.sampai);

  function apply() {
    const params = new URLSearchParams();
    if (pic && pic !== ALL) {
      params.set("pic", pic);
    }
    if (dari) {
      params.set("dari", dari);
    }
    if (sampai) {
      params.set("sampai", sampai);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function reset() {
    setPic(ALL);
    setDari("");
    setSampai("");
    router.push(pathname);
  }

  return (
    <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
      <div className="grid gap-2">
        <Label>Nama PIC</Label>
        <Select value={pic} onValueChange={(value) => setPic(String(value))}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Semua PIC">
              {(value) =>
                value === ALL
                  ? "Semua PIC"
                  : picOptions.find((p) => String(p.id) === value)?.nama ??
                    "Semua PIC"
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} sideOffset={6}>
            <SelectItem value={ALL}>Semua PIC</SelectItem>
            {picOptions.map((option) => (
              <SelectItem key={option.id} value={String(option.id)}>
                {option.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="filter-dari">Dari Tanggal</Label>
        <Input
          id="filter-dari"
          type="date"
          value={dari}
          max={sampai || undefined}
          onChange={(event) => setDari(event.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="filter-sampai">Sampai Tanggal</Label>
        <Input
          id="filter-sampai"
          type="date"
          value={sampai}
          min={dari || undefined}
          onChange={(event) => setSampai(event.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" className="flex-1" onClick={apply}>
          <Search data-icon="inline-start" />
          Terapkan
        </Button>
        <Button type="button" variant="outline" onClick={reset}>
          <RotateCcw data-icon="inline-start" />
          Reset
        </Button>
      </div>
    </div>
  );
}
