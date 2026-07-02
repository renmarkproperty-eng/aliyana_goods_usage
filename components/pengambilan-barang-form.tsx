"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  ChevronDown,
  InfinityIcon,
  Info,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  TriangleAlert,
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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

type PurposeOption = { id: number; name: string };

type MenuRow = {
  id: number;
  menu: string;
  jumlah: string;
};

// Satu purpose menampung beberapa menu.
type PurposeGroup = {
  id: number;
  purposeId: string;
  menus: MenuRow[];
};

type DetailItem = {
  id: number;
  open: boolean;
  namaBarang: string;
  satuan: string;
  jumlahDiambil: string;
  jumlahTerpakai: string;
  keterangan: string;
  purposeGroups: PurposeGroup[];
};

type DetailItemField = Exclude<
  keyof DetailItem,
  "id" | "open" | "purposeGroups"
>;

const DRAFT_KEY = "pengambilan-barang-draft";
const DRAFT_TTL = 3 * 60 * 1000; // 3 menit

function createMenuRow(id: number): MenuRow {
  return { id, menu: "", jumlah: "1" };
}

function createPurposeGroup(id: number): PurposeGroup {
  return { id, purposeId: "", menus: [createMenuRow(1)] };
}

function createDetailItem(id: number): DetailItem {
  return {
    id,
    open: true,
    namaBarang: "",
    satuan: "",
    jumlahDiambil: "0",
    jumlahTerpakai: "0",
    keterangan: "",
    purposeGroups: [createPurposeGroup(1)],
  };
}

function toNumber(value: string) {
  return Number.parseInt(value || "0", 10) || 0;
}

function getSisa(item: DetailItem) {
  return toNumber(item.jumlahDiambil) - toNumber(item.jumlahTerpakai);
}

function getTotalMenu(item: DetailItem) {
  return item.purposeGroups.reduce(
    (sum, group) =>
      sum + group.menus.reduce((s, row) => s + toNumber(row.jumlah), 0),
    0
  );
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

type ValidationError = { message: string; itemId?: number };

// Validasi ketat mengikuti urutan kolom.
function validate(
  tanggal: string,
  shift: string,
  items: DetailItem[]
): ValidationError | null {
  if (!tanggal.trim()) {
    return { message: "Tanggal wajib dipilih." };
  }
  if (!shift.trim()) {
    return { message: "Shift wajib dipilih." };
  }
  if (items.length === 0) {
    return { message: "Minimal satu barang wajib diisi." };
  }

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const posisi = `Barang ${index + 1}`;

    if (!item.namaBarang.trim()) {
      return { message: `${posisi}: Nama Barang wajib diisi.`, itemId: item.id };
    }
    if (!item.satuan.trim()) {
      return { message: `${posisi}: Satuan wajib diisi.`, itemId: item.id };
    }
    if (!item.jumlahDiambil.trim() || toNumber(item.jumlahDiambil) <= 0) {
      return {
        message: `${posisi}: Jumlah Diambil harus lebih dari 0.`,
        itemId: item.id,
      };
    }
    if (!item.jumlahTerpakai.trim() || toNumber(item.jumlahTerpakai) < 0) {
      return {
        message: `${posisi}: Jumlah Terpakai wajib diisi (minimal 0).`,
        itemId: item.id,
      };
    }
    if (toNumber(item.jumlahTerpakai) > toNumber(item.jumlahDiambil)) {
      return {
        message: `${posisi}: Jumlah Terpakai tidak boleh melebihi Jumlah Diambil.`,
        itemId: item.id,
      };
    }
    const terpakai = toNumber(item.jumlahTerpakai);
    if (terpakai > 0) {
      if (item.purposeGroups.length === 0) {
        return {
          message: `${posisi}: Minimal satu purpose wajib diisi.`,
          itemId: item.id,
        };
      }
      for (let g = 0; g < item.purposeGroups.length; g += 1) {
        const group = item.purposeGroups[g];
        const labelGrup = `${posisi} purpose ${g + 1}`;
        if (!group.purposeId) {
          return {
            message: `${labelGrup}: Purpose wajib dipilih.`,
            itemId: item.id,
          };
        }
        if (group.menus.length === 0) {
          return {
            message: `${labelGrup}: Minimal satu menu wajib diisi.`,
            itemId: item.id,
          };
        }
        for (let m = 0; m < group.menus.length; m += 1) {
          const row = group.menus[m];
          if (!row.menu.trim()) {
            return {
              message: `${labelGrup} menu ${m + 1}: Nama menu wajib diisi.`,
              itemId: item.id,
            };
          }
          if (toNumber(row.jumlah) <= 0) {
            return {
              message: `${labelGrup} menu ${m + 1}: Jumlah harus lebih dari 0.`,
              itemId: item.id,
            };
          }
        }
      }
      const totalMenu = getTotalMenu(item);
      if (totalMenu > terpakai) {
        return {
          message: `${posisi}: Total menu (${totalMenu}) melebihi jumlah terpakai (${terpakai}).`,
          itemId: item.id,
        };
      }
    }

    if (!item.keterangan.trim()) {
      return { message: `${posisi}: Keterangan wajib diisi.`, itemId: item.id };
    }
  }

  return null;
}

export function PengambilanBarangForm({
  initialTanggal,
  satuanOptions,
  purposeOptions,
}: {
  initialTanggal: string;
  satuanOptions: string[];
  purposeOptions: PurposeOption[];
}) {
  const router = useRouter();
  const [tanggal, setTanggal] = useState(initialTanggal);
  const [tanggalOpen, setTanggalOpen] = useState(false);
  const [shift, setShift] = useState("Pagi");
  const [detailItems, setDetailItems] = useState<DetailItem[]>([
    createDetailItem(1),
  ]);
  const [nextDetailId, setNextDetailId] = useState(2);

  const [error, setError] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const [hydrated, setHydrated] = useState(false);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalSisa = useMemo(
    () => detailItems.reduce((total, item) => total + getSisa(item), 0),
    [detailItems]
  );
  const selectedTanggal = useMemo(() => parseDateValue(tanggal), [tanggal]);

  // Muat draft dari cache (kalau belum kedaluwarsa) setelah hydrate,
  // supaya tidak terjadi hydration mismatch.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          savedAt?: number;
          tanggal?: string;
          shift?: string;
          detailItems?: DetailItem[];
        };

        const validDraft =
          parsed.savedAt &&
          Date.now() - parsed.savedAt < DRAFT_TTL &&
          parsed.detailItems?.length &&
          parsed.detailItems.every((item) =>
            Array.isArray(item.purposeGroups)
          );

        if (validDraft && parsed.detailItems) {
          setTanggal(parsed.tanggal || initialTanggal);
          setShift(parsed.shift || "Pagi");
          setDetailItems(parsed.detailItems);
          setNextDetailId(
            Math.max(...parsed.detailItems.map((item) => item.id)) + 1
          );
        } else {
          window.localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch {
      window.localStorage.removeItem(DRAFT_KEY);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simpan draft otomatis + jadwalkan clear 3 menit.
  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ tanggal, shift, detailItems, savedAt: Date.now() })
    );

    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
    }
    expiryTimer.current = setTimeout(() => {
      window.localStorage.removeItem(DRAFT_KEY);
    }, DRAFT_TTL);

    return () => {
      if (expiryTimer.current) {
        clearTimeout(expiryTimer.current);
      }
    };
  }, [tanggal, shift, detailItems, hydrated]);

  function clearDraft() {
    if (expiryTimer.current) {
      clearTimeout(expiryTimer.current);
    }
    try {
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {
      // abaikan
    }
  }

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
    // Item tunggal tidak bisa dikolaps (menghindari tampilan kosong).
    if (detailItems.length === 1) {
      return;
    }
    setDetailItems((items) =>
      items.map((item) =>
        item.id === itemId ? { ...item, open: !item.open } : item
      )
    );
  }

  function mapGroups(
    itemId: number,
    updater: (groups: PurposeGroup[]) => PurposeGroup[]
  ) {
    setDetailItems((items) =>
      items.map((item) =>
        item.id === itemId
          ? { ...item, purposeGroups: updater(item.purposeGroups) }
          : item
      )
    );
  }

  function updateGroupPurpose(itemId: number, groupId: number, value: string) {
    mapGroups(itemId, (groups) =>
      groups.map((group) =>
        group.id === groupId ? { ...group, purposeId: value } : group
      )
    );
  }

  function addPurposeGroup(itemId: number) {
    mapGroups(itemId, (groups) => {
      const newId = groups.reduce((max, g) => Math.max(max, g.id), 0) + 1;
      return [...groups, createPurposeGroup(newId)];
    });
  }

  function removePurposeGroup(itemId: number, groupId: number) {
    mapGroups(itemId, (groups) =>
      groups.filter((group) => group.id !== groupId)
    );
  }

  function updateMenuRow(
    itemId: number,
    groupId: number,
    menuId: number,
    field: "menu" | "jumlah",
    value: string
  ) {
    mapGroups(itemId, (groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              menus: group.menus.map((row) =>
                row.id === menuId ? { ...row, [field]: value } : row
              ),
            }
          : group
      )
    );
  }

  function addMenuRow(itemId: number, groupId: number) {
    mapGroups(itemId, (groups) =>
      groups.map((group) => {
        if (group.id !== groupId) {
          return group;
        }
        const newId =
          group.menus.reduce((max, row) => Math.max(max, row.id), 0) + 1;
        return { ...group, menus: [...group.menus, createMenuRow(newId)] };
      })
    );
  }

  function removeMenuRow(itemId: number, groupId: number, menuId: number) {
    mapGroups(itemId, (groups) =>
      groups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              menus: group.menus.filter((row) => row.id !== menuId),
            }
          : group
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

  function removeDetailItem(itemId: number) {
    setDetailItems((items) => {
      const filtered = items.filter((item) => item.id !== itemId);
      // Kalau tersisa satu, pastikan terbuka.
      if (filtered.length === 1) {
        return filtered.map((item) => ({ ...item, open: true }));
      }
      return filtered;
    });
    setDeleteItemId(null);
  }

  function resetRepeater() {
    setTanggal(initialTanggal);
    setTanggalOpen(false);
    setShift("Pagi");
    setDetailItems([createDetailItem(1)]);
    setNextDetailId(2);
    setError(null);
    clearDraft();
    setConfirmReset(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError = validate(tanggal, shift, detailItems);
    if (validationError) {
      setError(validationError.message);
      if (validationError.itemId) {
        setDetailItems((items) =>
          items.map((item) => ({
            ...item,
            open: item.id === validationError.itemId,
          }))
        );
      }
      return;
    }

    setConfirmSave(true);
  }

  function handleConfirmSave() {
    setError(null);

    const payload = {
      tanggal,
      shift,
      items: detailItems.map((item) => {
        const terpakai = toNumber(item.jumlahTerpakai);
        return {
          nama_barang: item.namaBarang.trim(),
          satuan: item.satuan.trim(),
          jumlah_diambil: toNumber(item.jumlahDiambil),
          jumlah_terpakai: terpakai,
          keterangan: item.keterangan.trim(),
          menus:
            terpakai > 0
              ? item.purposeGroups.flatMap((group) =>
                  group.menus.map((row) => ({
                    menu: row.menu.trim(),
                    jumlah: toNumber(row.jumlah),
                    purpose_id: Number.parseInt(group.purposeId, 10),
                  }))
                )
              : [],
        };
      }),
    };

    const formData = new FormData();
    formData.set("payload", JSON.stringify(payload));

    startTransition(async () => {
      try {
        await createPengambilanBarang(formData);
        clearDraft();
        setConfirmSave(false);
        router.push("/pengambilan-barang/berhasil");
      } catch (err) {
        setConfirmSave(false);
        setError(
          err instanceof Error ? err.message : "Gagal menyimpan data."
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
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
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
            <Info className="mt-0.5 size-4 shrink-0" />
            <span>
              Semua kolom wajib diisi. Draft tersimpan otomatis dan akan hilang
              sendiri setelah 3 menit tidak aktif.
            </span>
          </div>

          <section className="grid gap-4">
            <div>
              <h2 className="text-sm font-medium">Pengambilan Barang</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="tanggal">Tanggal</Label>
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
                <Label>Shift</Label>
                <Select value={shift} onValueChange={(v) => setShift(String(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih shift" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} sideOffset={6}>
                    <SelectItem value="Pagi">Pagi</SelectItem>
                    <SelectItem value="Siang">Siang</SelectItem>
                    <SelectItem value="Malam">Malam</SelectItem>
                  </SelectContent>
                </Select>
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
                const canCollapse = detailItems.length > 1;
                const isOpen = canCollapse ? item.open : true;
                const canDelete = index > 0;

                return (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-lg border bg-background"
                  >
                    <div className="flex items-stretch bg-muted/40">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        disabled={!canCollapse}
                        onClick={() => toggleDetailItem(item.id)}
                        className="flex flex-1 items-center justify-between gap-3 px-3 py-3 text-left transition-colors enabled:hover:bg-muted/70 disabled:cursor-default"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {itemTitle}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Item {itemNumber} | Diambil{" "}
                            {item.jumlahDiambil || 0} | Terpakai{" "}
                            {item.jumlahTerpakai || 0}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant="secondary">Sisa {sisa}</Badge>
                          {canCollapse ? (
                            <ChevronDown
                              className={`size-4 text-muted-foreground transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          ) : null}
                        </div>
                      </button>

                      {canDelete ? (
                        <button
                          type="button"
                          aria-label={`Hapus ${itemTitle}`}
                          onClick={() => setDeleteItemId(item.id)}
                          className="flex items-center border-l px-3 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : null}
                    </div>

                    {isOpen ? (
                      <div id={panelId} className="grid gap-4 p-3 sm:p-4">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          <div className="grid gap-2 md:col-span-2 xl:col-span-3">
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
                            />
                          </div>

                          <div className="grid gap-2">
                            <Label>Satuan</Label>
                            <Select
                              value={item.satuan}
                              onValueChange={(value) =>
                                updateDetailItem(
                                  item.id,
                                  "satuan",
                                  String(value)
                                )
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih satuan" />
                              </SelectTrigger>
                              <SelectContent
                                alignItemWithTrigger={false}
                                sideOffset={6}
                              >
                                {satuanOptions.length === 0 ? (
                                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                    Belum ada satuan
                                  </div>
                                ) : (
                                  satuanOptions.map((nama) => (
                                    <SelectItem key={nama} value={nama}>
                                      {nama}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
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

                        <div className="grid gap-4">
                          <div className="grid gap-2">
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

                        {/* Rincian pemakaian per menu */}
                        {toNumber(item.jumlahTerpakai) > 0 ? (
                          (() => {
                            const terpakai = toNumber(item.jumlahTerpakai);
                            const totalMenu = getTotalMenu(item);
                            const over = totalMenu > terpakai;
                            const sisaMenu = terpakai - totalMenu;

                            return (
                              <div className="grid gap-3 rounded-lg border p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <h3 className="text-sm font-medium">
                                      Rincian Menu
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                      Pecah {terpakai} terpakai ke beberapa
                                      menu.
                                    </p>
                                  </div>
                                  <Badge
                                    variant={over ? "outline" : "secondary"}
                                    className={
                                      over
                                        ? "border-destructive text-destructive"
                                        : ""
                                    }
                                  >
                                    {totalMenu} / {terpakai}
                                  </Badge>
                                </div>

                                {item.purposeGroups.map(
                                  (group, groupIndex) => (
                                    <div
                                      key={group.id}
                                      className="grid gap-3 rounded-lg border bg-muted/20 p-3"
                                    >
                                      <div className="flex items-end gap-2">
                                        <div className="grid flex-1 gap-1.5">
                                          <Label className="text-xs">
                                            Purpose {groupIndex + 1}
                                          </Label>
                                          <Select
                                            value={group.purposeId}
                                            onValueChange={(value) =>
                                              updateGroupPurpose(
                                                item.id,
                                                group.id,
                                                String(value)
                                              )
                                            }
                                          >
                                            <SelectTrigger className="w-full">
                                              <SelectValue placeholder="Pilih purpose">
                                                {(value) =>
                                                  purposeOptions.find(
                                                    (p) =>
                                                      String(p.id) === value
                                                  )?.name ?? "Pilih purpose"
                                                }
                                              </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent
                                              alignItemWithTrigger={false}
                                              sideOffset={6}
                                            >
                                              {purposeOptions.length === 0 ? (
                                                <div className="px-2 py-1.5 text-sm text-muted-foreground">
                                                  Belum ada purpose
                                                </div>
                                              ) : (
                                                purposeOptions.map((option) => (
                                                  <SelectItem
                                                    key={option.id}
                                                    value={String(option.id)}
                                                  >
                                                    {option.name}
                                                  </SelectItem>
                                                ))
                                              )}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          aria-label="Hapus purpose"
                                          className="text-destructive hover:text-destructive"
                                          disabled={
                                            item.purposeGroups.length === 1
                                          }
                                          onClick={() =>
                                            removePurposeGroup(
                                              item.id,
                                              group.id
                                            )
                                          }
                                        >
                                          <Trash2 />
                                        </Button>
                                      </div>

                                      {group.menus.map((row, menuIndex) => (
                                        <div
                                          key={row.id}
                                          className="grid gap-2 sm:grid-cols-[1fr_5rem_auto] sm:items-end"
                                        >
                                          <div className="grid gap-1.5">
                                            {menuIndex === 0 ? (
                                              <Label className="text-xs">
                                                Menu
                                              </Label>
                                            ) : null}
                                            <Input
                                              type="text"
                                              placeholder="Contoh: Nasi goreng"
                                              value={row.menu}
                                              onChange={(event) =>
                                                updateMenuRow(
                                                  item.id,
                                                  group.id,
                                                  row.id,
                                                  "menu",
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </div>
                                          <div className="grid gap-1.5">
                                            {menuIndex === 0 ? (
                                              <Label className="text-xs">
                                                Jumlah
                                              </Label>
                                            ) : null}
                                            <Input
                                              type="number"
                                              min="1"
                                              inputMode="numeric"
                                              value={row.jumlah}
                                              onChange={(event) =>
                                                updateMenuRow(
                                                  item.id,
                                                  group.id,
                                                  row.id,
                                                  "jumlah",
                                                  event.target.value
                                                )
                                              }
                                            />
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Hapus menu"
                                            className="text-destructive hover:text-destructive"
                                            disabled={group.menus.length === 1}
                                            onClick={() =>
                                              removeMenuRow(
                                                item.id,
                                                group.id,
                                                row.id
                                              )
                                            }
                                          >
                                            <Trash2 />
                                          </Button>
                                        </div>
                                      ))}

                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="w-fit"
                                        disabled={totalMenu >= terpakai}
                                        onClick={() =>
                                          addMenuRow(item.id, group.id)
                                        }
                                      >
                                        <Plus data-icon="inline-start" />
                                        Tambah Menu
                                      </Button>
                                    </div>
                                  )
                                )}

                                {over ? (
                                  <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                                    <span>
                                      Total menu {totalMenu} melebihi jumlah
                                      terpakai {terpakai}. Kurangi jumlah agar
                                      bisa disimpan.
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground">
                                    Sisa yang bisa dialokasikan: {sisaMenu}
                                  </p>
                                )}

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-fit"
                                  disabled={totalMenu >= terpakai}
                                  onClick={() => addPurposeGroup(item.id)}
                                >
                                  <Plus data-icon="inline-start" />
                                  Tambah Purpose
                                </Button>
                              </div>
                            );
                          })()
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Isi Jumlah Terpakai (lebih dari 0) untuk merinci
                            menu.
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {error ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

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
            type="button"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => setConfirmReset(true)}
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

      {/* Konfirmasi simpan */}
      <Dialog open={confirmSave} onOpenChange={setConfirmSave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simpan Pengambilan?</DialogTitle>
            <DialogDescription>
              Pastikan data sudah benar. Data akan langsung disimpan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isPending} />
              }
            >
              Batal
            </DialogClose>
            <Button type="button" disabled={isPending} onClick={handleConfirmSave}>
              {isPending ? "Menyimpan..." : "Ya, simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi reset */}
      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Formulir?</DialogTitle>
            <DialogDescription>
              Semua isian dan draft tersimpan akan dihapus. Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Batal
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={resetRepeater}
            >
              Ya, reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Konfirmasi hapus item */}
      <Dialog
        open={deleteItemId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteItemId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Barang?</DialogTitle>
            <DialogDescription>
              Item barang ini akan dihapus dari daftar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Batal
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (deleteItemId !== null) {
                  removeDetailItem(deleteItemId);
                }
              }}
            >
              Ya, hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
