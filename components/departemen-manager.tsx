"use client";

import { useState, useTransition } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";

import {
  createDepartemen,
  deleteDepartemen,
  updateDepartemen,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

export type Departemen = {
  id: number;
  nama: string;
  created_at: string;
};

function formatTanggal(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function DepartemenManager({
  departemen,
}: {
  departemen: Departemen[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Departemen | null>(null);
  const [nama, setNama] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Departemen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setNama("");
    setError(null);
    setFormOpen(true);
  }

  function openEdit(item: Departemen) {
    setEditing(item);
    setNama(item.nama);
    setError(null);
    setFormOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = nama.trim();
    if (!trimmed) {
      setError("Nama departemen wajib diisi.");
      return;
    }

    const formData = new FormData();
    formData.set("nama", trimmed);
    if (editing) {
      formData.set("id", String(editing.id));
    }

    startTransition(async () => {
      try {
        if (editing) {
          await updateDepartemen(formData);
        } else {
          await createDepartemen(formData);
        }
        setFormOpen(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Terjadi kesalahan."
        );
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("id", String(deleteTarget.id));

    startTransition(async () => {
      try {
        await deleteDepartemen(formData);
        setDeleteTarget(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Terjadi kesalahan."
        );
      }
    });
  }

  return (
    <Card className="rounded-lg border-stone-200 shadow-sm dark:border-neutral-800">
      <CardHeader className="gap-2 border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4" />
            Departemen
          </CardTitle>
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Tambah Departemen
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {departemen.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Belum ada departemen. Klik &ldquo;Tambah Departemen&rdquo; untuk
            menambahkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="w-12 px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Nama</th>
                  <th className="px-3 py-2 font-medium">Dibuat</th>
                  <th className="w-24 px-3 py-2 text-right font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {departemen.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2.5 font-medium">{item.nama}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {formatTanggal(item.created_at)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${item.nama}`}
                          onClick={() => openEdit(item)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Hapus ${item.nama}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(item)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* Modal tambah / edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Departemen" : "Tambah Departemen"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Ubah nama departemen lalu simpan."
                  : "Masukkan nama departemen baru."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="nama-departemen">Nama Departemen</Label>
              <Input
                id="nama-departemen"
                value={nama}
                onChange={(event) => setNama(event.target.value)}
                placeholder="Contoh: Dapur"
                autoFocus
                required
              />
              {error ? (
                <p className="text-sm text-destructive">{error}</p>
              ) : null}
            </div>

            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline" disabled={isPending} />
                }
              >
                Batal
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal konfirmasi hapus */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Departemen</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus departemen
              {deleteTarget ? ` "${deleteTarget.nama}"` : ""}? Tindakan ini
              tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isPending} />
              }
            >
              Batal
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
