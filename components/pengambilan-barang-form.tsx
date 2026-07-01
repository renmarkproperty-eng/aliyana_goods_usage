"use client";

import { useMemo, useState } from "react";
import {
  CalendarIcon,
  ChevronDown,
  InfinityIcon,
  RotateCcw,
  Save,
} from "lucide-react";
import { id as idLocale } from "react-day-picker/locale";

import { createPengambilanBarang } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type DetailItem = {
  id: number;
  open: boolean;
  catatanId: string;
  namaBarang: string;
  satuan: string;
  jumlahDiambil: string;
  jumlahTerpakai: string;
  digunakanUntuk: string;
  menu: string;
  keterangan: string;
};

type DetailItemField = Exclude<keyof DetailItem, "id" | "open">;

function createDetailItem(id: number): DetailItem {
  return {
    id,
    open: true,
    catatanId: "",
    namaBarang: "",
    satuan: "",
    jumlahDiambil: "0",
    jumlahTerpakai: "0",
    digunakanUntuk: "",
    menu: "",
    keterangan: "",
  };
}

function toNumber(value: string) {
  return Number.parseInt(value || "0", 10) || 0;
}

function getSisa(item: DetailItem) {
  return toNumber(item.jumlahDiambil) - toNumber(item.jumlahTerpakai);
}

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

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

function formatDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  const monthName = MONTH_NAMES[Number(month) - 1];

  if (!year || !monthName || !day) {
    return "Pilih tanggal";
  }

  return `${day.padStart(2, "0")} ${monthName} ${year}`;
}

export function PengambilanBarangForm({
  initialTanggal,
}: {
  initialTanggal: string;
}) {
  const [tanggal, setTanggal] = useState(initialTanggal);
  const [tanggalOpen, setTanggalOpen] = useState(false);
  const [detailItems, setDetailItems] = useState<DetailItem[]>([
    createDetailItem(1),
  ]);
  const [nextDetailId, setNextDetailId] = useState(2);

  const totalSisa = useMemo(
    () => detailItems.reduce((total, item) => total + getSisa(item), 0),
    [detailItems]
  );
  const selectedTanggal = useMemo(() => parseDateValue(tanggal), [tanggal]);

  function updateDetailItem(
    itemId: number,
    field: DetailItemField,
    value: string
  ) {
    setDetailItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  }

  function toggleDetailItem(itemId: number) {
    setDetailItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, open: !item.open } : item
      )
    );
  }

  function addDetailItem() {
    const newItemId = nextDetailId;

    setDetailItems((items) => [
      ...items.map((item) => ({ ...item, open: false })),
      createDetailItem(newItemId),
    ]);
    setNextDetailId(newItemId + 1);
  }

  function resetRepeater() {
    setTanggal(initialTanggal);
    setTanggalOpen(false);
    setDetailItems([createDetailItem(1)]);
    setNextDetailId(2);
  }

  return (
    <form action={createPengambilanBarang} onReset={resetRepeater}>
      <Card className="rounded-lg border-stone-200 shadow-sm dark:border-neutral-800">
        <CardHeader className="gap-3 border-b">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg">Data Pengambilan</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Lengkapi data utama, lalu isi detail barang.
              </p>
            </div>
            <Badge variant="secondary" className="w-fit">
              {detailItems.length} barang
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="grid gap-6 pt-5">
          <section className="grid gap-4">
            <div>
              <h2 className="text-sm font-medium">Pengambilan Barang</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="grid gap-2">
                <Label htmlFor="tanggal">Tanggal</Label>
                <input
                  id="tanggal"
                  name="tanggal"
                  type="hidden"
                  value={tanggal}
                  readOnly
                />
                <Popover open={tanggalOpen} onOpenChange={setTanggalOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      />
                    }
                  >
                    <CalendarIcon data-icon="inline-start" />
                    {formatDateLabel(tanggal)}
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedTanggal}
                      onSelect={(date) => {
                        if (date) {
                          setTanggal(formatDateValue(date));
                          setTanggalOpen(false);
                        }
                      }}
                      locale={idLocale}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="departemen">Departemen</Label>
                <Input
                  id="departemen"
                  name="departemen"
                  type="text"
                  placeholder="Contoh: Kitchen"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="shift">Shift</Label>
                <Select id="shift" name="shift" defaultValue="Pagi" required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pagi">Pagi</SelectItem>
                    <SelectItem value="Siang">Siang</SelectItem>
                    <SelectItem value="Malam">Malam</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="nama_pengambil">PIC</Label>
                <Input
                  id="nama_pengambil"
                  name="nama_pengambil"
                  type="text"
                  placeholder="Nama PIC"
                  required
                />
              </div>
            </div>
          </section>

          <Separator />

          <section className="grid gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-medium">
                  Detail Pengambilan Barang
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tambah item barang sesuai kebutuhan.
                </p>
              </div>
              <Badge variant="outline" className="w-fit">
                Total sisa {totalSisa}
              </Badge>
            </div>

            <div className="grid gap-3">
              {detailItems.map((item, index) => {
                const itemNumber = index + 1;
                const itemTitle =
                  item.namaBarang.trim() || `Barang ${itemNumber}`;
                const panelId = `detail-barang-${item.id}`;
                const sisa = getSisa(item);

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-lg border bg-background"
                  >
                    <input
                      type="hidden"
                      name="catatan_id"
                      value={item.catatanId}
                      readOnly
                    />
                    <input
                      type="hidden"
                      name="nama_barang"
                      value={item.namaBarang}
                      readOnly
                    />
                    <input
                      type="hidden"
                      name="satuan"
                      value={item.satuan}
                      readOnly
                    />
                    <input
                      type="hidden"
                      name="jumlah_diambil"
                      value={item.jumlahDiambil}
                      readOnly
                    />
                    <input
                      type="hidden"
                      name="jumlah_terpakai"
                      value={item.jumlahTerpakai}
                      readOnly
                    />
                    <input
                      type="hidden"
                      name="digunakan_untuk"
                      value={item.digunakanUntuk}
                      readOnly
                    />
                    <input
                      type="hidden"
                      name="menu"
                      value={item.menu}
                      readOnly
                    />
                    <input
                      type="hidden"
                      name="keterangan"
                      value={item.keterangan}
                      readOnly
                    />

                    <button
                      type="button"
                      aria-expanded={item.open}
                      aria-controls={panelId}
                      onClick={() => toggleDetailItem(item.id)}
                      className="flex w-full items-center justify-between gap-3 bg-muted/40 px-3 py-3 text-left transition-colors hover:bg-muted/70"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {itemTitle}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Item {itemNumber} | Diambil {item.jumlahDiambil || 0} |
                          Terpakai {item.jumlahTerpakai || 0}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="secondary">Sisa {sisa}</Badge>
                        <ChevronDown
                          className={`size-4 text-muted-foreground transition-transform ${
                            item.open ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {item.open ? (
                      <div id={panelId} className="grid gap-4 p-3 sm:p-4">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <div className="grid gap-2">
                            <Label htmlFor={`catatan_id_${item.id}`}>
                              ID Catatan
                            </Label>
                            <Input
                              id={`catatan_id_${item.id}`}
                              type="number"
                              min="1"
                              inputMode="numeric"
                              placeholder="Contoh: 12"
                              value={item.catatanId}
                              onChange={(event) =>
                                updateDetailItem(
                                  item.id,
                                  "catatanId",
                                  event.target.value
                                )
                              }
                              required
                            />
                          </div>

                          <div className="grid gap-2 md:col-span-1 xl:col-span-2">
                            <Label htmlFor={`nama_barang_${item.id}`}>
                              Nama Barang
                            </Label>
                            <Input
                              id={`nama_barang_${item.id}`}
                              type="text"
                              placeholder="Contoh: Beras premium"
                              value={item.namaBarang}
                              onChange={(event) =>
                                updateDetailItem(
                                  item.id,
                                  "namaBarang",
                                  event.target.value
                                )
                              }
                              required
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor={`satuan_${item.id}`}>Satuan</Label>
                            <Input
                              id={`satuan_${item.id}`}
                              type="text"
                              placeholder="kg, pcs, liter"
                              value={item.satuan}
                              onChange={(event) =>
                                updateDetailItem(
                                  item.id,
                                  "satuan",
                                  event.target.value
                                )
                              }
                              required
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor={`jumlah_diambil_${item.id}`}>
                              Jumlah Diambil
                            </Label>
                            <Input
                              id={`jumlah_diambil_${item.id}`}
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={item.jumlahDiambil}
                              onChange={(event) =>
                                updateDetailItem(
                                  item.id,
                                  "jumlahDiambil",
                                  event.target.value
                                )
                              }
                              required
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor={`jumlah_terpakai_${item.id}`}>
                              Jumlah Terpakai
                            </Label>
                            <Input
                              id={`jumlah_terpakai_${item.id}`}
                              type="number"
                              min="0"
                              inputMode="numeric"
                              value={item.jumlahTerpakai}
                              onChange={(event) =>
                                updateDetailItem(
                                  item.id,
                                  "jumlahTerpakai",
                                  event.target.value
                                )
                              }
                              required
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor={`sisa_${item.id}`}>Sisa</Label>
                            <Input
                              id={`sisa_${item.id}`}
                              type="number"
                              value={sisa}
                              readOnly
                              className="bg-muted font-medium text-muted-foreground"
                            />
                          </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          <div className="grid gap-2">
                            <Label htmlFor={`digunakan_untuk_${item.id}`}>
                              Digunakan Untuk
                            </Label>
                            <Input
                              id={`digunakan_untuk_${item.id}`}
                              type="text"
                              placeholder="Contoh: Produksi dapur pagi"
                              value={item.digunakanUntuk}
                              onChange={(event) =>
                                updateDetailItem(
                                  item.id,
                                  "digunakanUntuk",
                                  event.target.value
                                )
                              }
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor={`menu_${item.id}`}>Menu</Label>
                            <Input
                              id={`menu_${item.id}`}
                              type="text"
                              placeholder="Contoh: Nasi goreng"
                              value={item.menu}
                              onChange={(event) =>
                                updateDetailItem(
                                  item.id,
                                  "menu",
                                  event.target.value
                                )
                              }
                            />
                          </div>

                          <div className="grid gap-2 lg:col-span-2">
                            <Label htmlFor={`keterangan_${item.id}`}>
                              Keterangan
                            </Label>
                            <Textarea
                              id={`keterangan_${item.id}`}
                              placeholder="Catatan tambahan"
                              className="min-h-28 resize-y"
                              value={item.keterangan}
                              onChange={(event) =>
                                updateDetailItem(
                                  item.id,
                                  "keterangan",
                                  event.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="default"
              size="lg"
              className="w-full border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              onClick={addDetailItem}
            >
              <InfinityIcon data-icon="inline-start" />
              Tambah Data Barang
            </Button>
          </section>
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="reset"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <RotateCcw data-icon="inline-start" />
            Reset
          </Button>
          <Button type="submit" size="lg" className="w-full sm:w-auto">
            <Save data-icon="inline-start" />
            Simpan Pengambilan
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
