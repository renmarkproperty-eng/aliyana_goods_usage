"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";

import { authOptions } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type MenuInput = { menu: string; jumlah: number; purpose_id: number };

type DetailPengambilanBarangInput = {
  nama_barang: string;
  satuan: string;
  jumlah_diambil: number;
  jumlah_terpakai: number;
  keterangan: string;
  menus: MenuInput[];
};

type PengambilanPayload = {
  tanggal: string;
  shift: string;
  items: DetailPengambilanBarangInput[];
};

function getRequiredString(formData: FormData, name: string, label: string) {
  const value = formData.get(name);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} wajib diisi.`);
  }

  return value.trim();
}

function assertInt(value: unknown, label: string, min: number) {
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num < min) {
    throw new Error(`${label} tidak valid (minimal ${min}).`);
  }
  return Math.trunc(num);
}

function parsePayload(formData: FormData): PengambilanPayload {
  const raw = formData.get("payload");
  if (typeof raw !== "string") {
    throw new Error("Data tidak valid.");
  }

  let parsed: PengambilanPayload;
  try {
    parsed = JSON.parse(raw) as PengambilanPayload;
  } catch {
    throw new Error("Data tidak dapat diproses.");
  }

  const tanggal = parsed.tanggal?.trim();
  const shift = parsed.shift?.trim();
  if (!tanggal) throw new Error("Tanggal wajib diisi.");
  if (!shift) throw new Error("Shift wajib diisi.");
  if (!Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error("Detail pengambilan barang wajib diisi.");
  }

  const items: DetailPengambilanBarangInput[] = parsed.items.map(
    (item, index) => {
      const posisi = `Barang ${index + 1}`;
      const nama_barang = item.nama_barang?.trim();
      const satuan = item.satuan?.trim();
      const keterangan = item.keterangan?.trim();

      if (!nama_barang) throw new Error(`${posisi}: Nama Barang wajib diisi.`);
      if (!satuan) throw new Error(`${posisi}: Satuan wajib diisi.`);
      if (!keterangan) throw new Error(`${posisi}: Keterangan wajib diisi.`);

      const jumlah_diambil = assertInt(
        item.jumlah_diambil,
        `${posisi}: Jumlah Diambil`,
        1
      );
      const jumlah_terpakai = assertInt(
        item.jumlah_terpakai,
        `${posisi}: Jumlah Terpakai`,
        0
      );
      if (jumlah_terpakai > jumlah_diambil) {
        throw new Error(
          `${posisi}: Jumlah Terpakai tidak boleh melebihi Jumlah Diambil.`
        );
      }

      const menus: MenuInput[] = Array.isArray(item.menus) ? item.menus : [];
      if (jumlah_terpakai > 0 && menus.length === 0) {
        throw new Error(`${posisi}: Rincian menu wajib diisi.`);
      }

      let totalMenu = 0;
      const cleanMenus = menus.map((m, mIndex) => {
        const menuName = m.menu?.trim();
        if (!menuName) {
          throw new Error(
            `${posisi} menu ${mIndex + 1}: Nama menu wajib diisi.`
          );
        }
        const jumlah = assertInt(
          m.jumlah,
          `${posisi} menu ${mIndex + 1}: Jumlah`,
          1
        );
        const purpose_id = assertInt(
          m.purpose_id,
          `${posisi} menu ${mIndex + 1}: Purpose`,
          1
        );
        totalMenu += jumlah;
        return { menu: menuName, jumlah, purpose_id };
      });

      if (totalMenu > jumlah_terpakai) {
        throw new Error(
          `${posisi}: Total menu (${totalMenu}) melebihi jumlah terpakai (${jumlah_terpakai}).`
        );
      }

      return {
        nama_barang,
        satuan,
        jumlah_diambil,
        jumlah_terpakai,
        keterangan,
        menus: cleanMenus,
      };
    }
  );

  return { tanggal, shift, items };
}

export async function createPengambilanBarang(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const userId = Number.parseInt(session.user.id, 10);

  if (!Number.isInteger(userId)) {
    throw new Error("Session user tidak valid.");
  }

  const payload = parsePayload(formData);
  const supabase = createSupabaseAdminClient();

  const { data: pengambilan, error: pengambilanError } = await supabase
    .from("pengambilan_barang")
    .insert({
      tanggal: payload.tanggal,
      user_id: userId,
      shift: payload.shift,
    })
    .select("id")
    .single();

  if (pengambilanError) {
    throw new Error(
      `Gagal menyimpan pengambilan barang: ${pengambilanError.message}`
    );
  }

  // Rollback manual bila ada kegagalan di tengah (cascade menghapus anak).
  async function rollback(): Promise<never> {
    await supabase.from("pengambilan_barang").delete().eq("id", pengambilan.id);
    throw new Error("Gagal menyimpan data pengambilan.");
  }

  for (const item of payload.items) {
    const { data: satuan, error: satuanError } = await supabase
      .from("master_satuan")
      .upsert({ nama: item.satuan }, { onConflict: "nama" })
      .select("id")
      .single();

    if (satuanError || !satuan) {
      await rollback();
    }

    const { data: detail, error: detailError } = await supabase
      .from("detail_pengambilan_barang")
      .insert({
        pengambilan_barang_id: pengambilan.id,
        nama_barang: item.nama_barang,
        satuan_id: satuan!.id,
        jumlah_diambil: item.jumlah_diambil,
        jumlah_terpakai: item.jumlah_terpakai,
        keterangan: item.keterangan,
      })
      .select("id")
      .single();

    if (detailError || !detail) {
      await rollback();
    }

    if (item.menus.length > 0) {
      const { error: menuError } = await supabase
        .from("detail_pemakaian_menu")
        .insert(
          item.menus.map((m) => ({
            detail_pengambilan_barang_id: detail!.id,
            menu: m.menu,
            jumlah: m.jumlah,
            purpose_id: m.purpose_id,
          }))
        );

      if (menuError) {
        // Bisa dari trigger threshold DB.
        await supabase
          .from("pengambilan_barang")
          .delete()
          .eq("id", pengambilan.id);
        throw new Error(`Gagal menyimpan rincian menu: ${menuError.message}`);
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/riwayat-pengambilan");
}

async function assertAuthenticated() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session;
}

function getRequiredId(formData: FormData, name: string, label: string) {
  const raw = formData.get(name);
  const value = Number.parseInt(typeof raw === "string" ? raw : "", 10);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} tidak valid.`);
  }

  return value;
}

export async function createDepartemen(formData: FormData) {
  await assertAuthenticated();

  const nama = getRequiredString(formData, "nama", "Nama departemen");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("master_departemen")
    .insert({ nama });

  if (error) {
    throw new Error(`Gagal menambah departemen: ${error.message}`);
  }

  revalidatePath("/master-data/departemen");
}

export async function updateDepartemen(formData: FormData) {
  await assertAuthenticated();

  const id = getRequiredId(formData, "id", "ID departemen");
  const nama = getRequiredString(formData, "nama", "Nama departemen");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("master_departemen")
    .update({ nama, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`Gagal mengubah departemen: ${error.message}`);
  }

  revalidatePath("/master-data/departemen");
}

export async function deleteDepartemen(formData: FormData) {
  await assertAuthenticated();

  const id = getRequiredId(formData, "id", "ID departemen");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("master_departemen")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Gagal menghapus departemen: ${error.message}`);
  }

  revalidatePath("/master-data/departemen");
}

export async function createSatuan(formData: FormData) {
  await assertAuthenticated();

  const nama = getRequiredString(formData, "nama", "Nama satuan");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("master_satuan").insert({ nama });

  if (error) {
    throw new Error(`Gagal menambah satuan: ${error.message}`);
  }

  revalidatePath("/master-data/satuan");
}

export async function updateSatuan(formData: FormData) {
  await assertAuthenticated();

  const id = getRequiredId(formData, "id", "ID satuan");
  const nama = getRequiredString(formData, "nama", "Nama satuan");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("master_satuan")
    .update({ nama, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`Gagal mengubah satuan: ${error.message}`);
  }

  revalidatePath("/master-data/satuan");
}

export async function deleteSatuan(formData: FormData) {
  await assertAuthenticated();

  const id = getRequiredId(formData, "id", "ID satuan");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("master_satuan")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Gagal menghapus satuan: ${error.message}`);
  }

  revalidatePath("/master-data/satuan");
}

export async function createPurpose(formData: FormData) {
  await assertAuthenticated();

  const name = getRequiredString(formData, "name", "Nama purpose");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("master_purpose").insert({ name });

  if (error) {
    if (error.code === "23505") {
      throw new Error("Purpose sudah ada.");
    }
    throw new Error(`Gagal menambah purpose: ${error.message}`);
  }

  revalidatePath("/master-data/purpose");
}

export async function updatePurpose(formData: FormData) {
  await assertAuthenticated();

  const id = getRequiredId(formData, "id", "ID purpose");
  const name = getRequiredString(formData, "name", "Nama purpose");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("master_purpose")
    .update({ name })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      throw new Error("Purpose sudah ada.");
    }
    throw new Error(`Gagal mengubah purpose: ${error.message}`);
  }

  revalidatePath("/master-data/purpose");
}

export async function deletePurpose(formData: FormData) {
  await assertAuthenticated();

  const id = getRequiredId(formData, "id", "ID purpose");

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("master_purpose")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Gagal menghapus purpose: ${error.message}`);
  }

  revalidatePath("/master-data/purpose");
}

function getRole(formData: FormData): "pic" | "admin" {
  const value = formData.get("role");

  if (value === "pic" || value === "admin") {
    return value;
  }

  throw new Error("Role tidak valid.");
}

export async function createUser(formData: FormData) {
  await assertAuthenticated();

  const username = getRequiredString(formData, "username", "Username");
  const password = getRequiredString(formData, "password", "Password");
  const role = getRole(formData);
  const nama = getRequiredString(formData, "nama", "Nama");
  const departemenId = getRequiredId(
    formData,
    "departemen_id",
    "Departemen"
  );

  if (password.length < 6) {
    throw new Error("Password minimal 6 karakter.");
  }

  const supabase = createSupabaseAdminClient();
  const hashedPassword = await hash(password, 10);

  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({ username, password: hashedPassword, role })
    .select("id")
    .single();

  if (userError) {
    if (userError.code === "23505") {
      throw new Error("Username sudah digunakan.");
    }
    throw new Error(`Gagal menambah user: ${userError.message}`);
  }

  const { error: detailError } = await supabase
    .from("users_detail")
    .insert({ user_id: user.id, nama, departemen_id: departemenId });

  if (detailError) {
    // rollback user agar tidak ada baris yatim
    await supabase.from("users").delete().eq("id", user.id);
    throw new Error(`Gagal menyimpan detail user: ${detailError.message}`);
  }

  revalidatePath("/manajemen-user");
}

export async function updateUser(formData: FormData) {
  await assertAuthenticated();

  const id = getRequiredId(formData, "id", "ID user");
  const username = getRequiredString(formData, "username", "Username");
  const role = getRole(formData);
  const nama = getRequiredString(formData, "nama", "Nama");
  const departemenId = getRequiredId(
    formData,
    "departemen_id",
    "Departemen"
  );

  const passwordRaw = formData.get("password");
  const password =
    typeof passwordRaw === "string" ? passwordRaw.trim() : "";

  const supabase = createSupabaseAdminClient();

  const userUpdate: Database["public"]["Tables"]["users"]["Update"] = {
    username,
    role,
    updated_at: new Date().toISOString(),
  };

  if (password) {
    if (password.length < 6) {
      throw new Error("Password minimal 6 karakter.");
    }
    userUpdate.password = await hash(password, 10);
  }

  const { error: userError } = await supabase
    .from("users")
    .update(userUpdate)
    .eq("id", id);

  if (userError) {
    if (userError.code === "23505") {
      throw new Error("Username sudah digunakan.");
    }
    throw new Error(`Gagal mengubah user: ${userError.message}`);
  }

  const { error: detailError } = await supabase
    .from("users_detail")
    .upsert(
      {
        user_id: id,
        nama,
        departemen_id: departemenId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (detailError) {
    throw new Error(`Gagal mengubah detail user: ${detailError.message}`);
  }

  revalidatePath("/manajemen-user");
}

export async function deleteUser(formData: FormData) {
  const session = await assertAuthenticated();

  const id = getRequiredId(formData, "id", "ID user");

  if (String(id) === session.user.id) {
    throw new Error("Tidak dapat menghapus akun yang sedang login.");
  }

  const supabase = createSupabaseAdminClient();

  const { error: detailError } = await supabase
    .from("users_detail")
    .delete()
    .eq("user_id", id);

  if (detailError) {
    throw new Error(`Gagal menghapus detail user: ${detailError.message}`);
  }

  const { error: userError } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (userError) {
    throw new Error(`Gagal menghapus user: ${userError.message}`);
  }

  revalidatePath("/manajemen-user");
}
