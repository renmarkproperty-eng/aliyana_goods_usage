import {
  UserManager,
  type DepartemenOption,
  type UserRow,
} from "@/components/user-manager";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ManajemenUserPage() {
  const supabase = createSupabaseAdminClient();

  const [usersRes, detailRes, departemenRes] = await Promise.all([
    supabase
      .from("users")
      .select("id,username,role,created_at")
      .order("id", { ascending: true }),
    supabase.from("users_detail").select("user_id,nama,departemen_id"),
    supabase
      .from("master_departemen")
      .select("id,nama")
      .order("nama", { ascending: true }),
  ]);

  const error = usersRes.error ?? detailRes.error ?? departemenRes.error;

  const departemen: DepartemenOption[] = departemenRes.data ?? [];
  const departemenById = new Map(departemen.map((d) => [d.id, d.nama]));
  const detailByUserId = new Map(
    (detailRes.data ?? []).map((d) => [d.user_id, d])
  );

  const users: UserRow[] = (usersRes.data ?? []).map((user) => {
    const detail = detailByUserId.get(user.id);
    const departemenId = detail?.departemen_id ?? null;

    return {
      id: user.id,
      username: user.username,
      role: user.role,
      nama: detail?.nama ?? user.username,
      departemenId,
      departemenNama:
        departemenId !== null ? departemenById.get(departemenId) ?? null : null,
    };
  });

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Manajemen User
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Akses pengguna aplikasi
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Gagal memuat data user: {error.message}
        </div>
      ) : (
        <UserManager users={users} departemen={departemen} />
      )}
    </div>
  );
}
