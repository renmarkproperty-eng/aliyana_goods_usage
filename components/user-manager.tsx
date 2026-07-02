"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, UserRoundCog } from "lucide-react";

import { createUser, deleteUser, updateUser } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type UserRole = "pic" | "admin";

export type UserRow = {
  id: number;
  username: string;
  role: UserRole;
  nama: string;
  departemenId: number | null;
  departemenNama: string | null;
};

export type DepartemenOption = {
  id: number;
  nama: string;
};

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  pic: "PIC",
};

export function UserManager({
  users,
  departemen,
}: {
  users: UserRow[];
  departemen: DepartemenOption[];
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("pic");
  const [nama, setNama] = useState("");
  const [departemenId, setDepartemenId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const noDepartemen = departemen.length === 0;

  function openCreate() {
    setEditing(null);
    setUsername("");
    setPassword("");
    setRole("pic");
    setNama("");
    setDepartemenId(departemen[0] ? String(departemen[0].id) : "");
    setError(null);
    setFormOpen(true);
  }

  function openEdit(item: UserRow) {
    setEditing(item);
    setUsername(item.username);
    setPassword("");
    setRole(item.role);
    setNama(item.nama);
    setDepartemenId(item.departemenId ? String(item.departemenId) : "");
    setError(null);
    setFormOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !nama.trim()) {
      setError("Username dan nama wajib diisi.");
      return;
    }

    if (!departemenId) {
      setError("Departemen wajib dipilih.");
      return;
    }

    if (!editing && password.trim().length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    const formData = new FormData();
    formData.set("username", username.trim());
    formData.set("role", role);
    formData.set("nama", nama.trim());
    formData.set("departemen_id", departemenId);
    if (password.trim()) {
      formData.set("password", password.trim());
    }
    if (editing) {
      formData.set("id", String(editing.id));
    }

    startTransition(async () => {
      try {
        if (editing) {
          await updateUser(formData);
        } else {
          await createUser(formData);
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
        await deleteUser(formData);
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
            <UserRoundCog className="size-4" />
            User
          </CardTitle>
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            disabled={noDepartemen}
          >
            <Plus data-icon="inline-start" />
            Tambah User
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {noDepartemen ? (
          <div className="mb-4 rounded-lg border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-400">
            Tambahkan minimal satu departemen dulu sebelum membuat user.
          </div>
        ) : null}

        {users.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Belum ada user. Klik &ldquo;Tambah User&rdquo; untuk menambahkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="w-12 px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Nama</th>
                  <th className="px-3 py-2 font-medium">Username</th>
                  <th className="px-3 py-2 font-medium">Departemen</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="w-24 px-3 py-2 text-right font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2.5 font-medium">{item.nama}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {item.username}
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">
                      {item.departemenNama ?? "-"}
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        variant={item.role === "admin" ? "default" : "secondary"}
                      >
                        {ROLE_LABEL[item.role]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${item.username}`}
                          onClick={() => openEdit(item)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Hapus ${item.username}`}
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
                {editing ? "Edit User" : "Tambah User"}
              </DialogTitle>
              <DialogDescription>
                {editing
                  ? "Ubah data user lalu simpan."
                  : "Lengkapi data user baru."}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2">
              <Label htmlFor="user-nama">Nama</Label>
              <Input
                id="user-nama"
                value={nama}
                onChange={(event) => setNama(event.target.value)}
                placeholder="Nama lengkap"
                autoFocus
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user-username">Username</Label>
              <Input
                id="user-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username login"
                autoComplete="off"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user-password">
                Password
                {editing ? (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    (kosongkan jika tidak diubah)
                  </span>
                ) : null}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={editing ? "••••••" : "Minimal 6 karakter"}
                autoComplete="new-password"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Departemen</Label>
                <Select
                  value={departemenId}
                  onValueChange={(value) => setDepartemenId(String(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih departemen">
                      {(value) =>
                        departemen.find((d) => String(d.id) === value)?.nama ??
                        "Pilih departemen"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    sideOffset={6}
                  >
                    {departemen.map((dept) => (
                      <SelectItem key={dept.id} value={String(dept.id)}>
                        {dept.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(value) => setRole(value as UserRole)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih role">
                      {(value) => ROLE_LABEL[value as UserRole] ?? "Pilih role"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    sideOffset={6}
                  >
                    <SelectItem value="pic">PIC</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}

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
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus user
              {deleteTarget ? ` "${deleteTarget.username}"` : ""}? Tindakan ini
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
