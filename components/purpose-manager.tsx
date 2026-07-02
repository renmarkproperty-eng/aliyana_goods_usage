"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";

import { createPurpose, deletePurpose, updatePurpose } from "@/app/actions";
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

export type Purpose = {
  id: number;
  name: string;
};

export function PurposeManager({ purpose }: { purpose: Purpose[] }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Purpose | null>(null);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Purpose | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setName("");
    setError(null);
    setFormOpen(true);
  }

  function openEdit(item: Purpose) {
    setEditing(item);
    setName(item.name);
    setError(null);
    setFormOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setError("Nama purpose wajib diisi.");
      return;
    }

    const formData = new FormData();
    formData.set("name", trimmed);
    if (editing) {
      formData.set("id", String(editing.id));
    }

    startTransition(async () => {
      try {
        if (editing) {
          await updatePurpose(formData);
        } else {
          await createPurpose(formData);
        }
        setFormOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
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
        await deletePurpose(formData);
        setDeleteTarget(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      }
    });
  }

  return (
    <Card className="rounded-lg border-stone-200 shadow-sm dark:border-neutral-800">
      <CardHeader className="gap-2 border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4" />
            Purpose
          </CardTitle>
          <Button type="button" size="sm" onClick={openCreate}>
            <Plus data-icon="inline-start" />
            Tambah Purpose
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {purpose.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Belum ada purpose. Klik &ldquo;Tambah Purpose&rdquo; untuk
            menambahkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="w-12 px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Nama</th>
                  <th className="w-24 px-3 py-2 text-right font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {purpose.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2.5 font-medium">{item.name}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${item.name}`}
                          onClick={() => openEdit(item)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Hapus ${item.name}`}
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
                {editing ? "Edit Purpose" : "Tambah Purpose"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Ubah nama purpose lalu simpan."
                  : "Masukkan nama purpose baru."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="nama-purpose">Nama Purpose</Label>
              <Input
                id="nama-purpose"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Contoh: Produksi dapur"
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
            <DialogTitle>Hapus Purpose</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus purpose
              {deleteTarget ? ` "${deleteTarget.name}"` : ""}? Tindakan ini
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
