import "server-only";

import {
  createSupabaseAdminClient,
  hasSupabaseAdminEnv,
} from "@/lib/supabase/server";

export type DashboardStats = {
  totalBarangDiambil: number;
  riwayatHariIni: number;
  userAktif: number;
  supabaseConfigured: boolean;
};

export type RiwayatPengambilan = {
  id: number;
  tanggal: string;
  nama: string;
  departemen: string;
  shift: string;
  created_at: string;
};

export type RiwayatFilters = {
  userId?: number;
  tanggalDari?: string;
  tanggalSampai?: string;
};

export type PicOption = {
  id: number;
  nama: string;
};

export type PurposeMenuGroup = {
  purpose: string;
  menus: { menu: string; jumlah: number }[];
};

export type DetailRiwayatItem = {
  nama_barang: string;
  satuan: string;
  jumlah_diambil: number;
  jumlah_terpakai: number;
  sisa: number;
  purposeMenus: PurposeMenuGroup[];
  keterangan: string;
};

export type DetailRiwayat = {
  header: {
    id: number;
    tanggal: string;
    nama: string;
    departemen: string;
    shift: string;
    created_at: string;
  } | null;
  items: DetailRiwayatItem[];
};

export type RiwayatLengkapRow = {
  pengambilanId: number;
  tanggal: string;
  nama: string;
  departemen: string;
  shift: string;
  nama_barang: string;
  satuan: string;
  jumlah_diambil: number;
  jumlah_terpakai: number;
  sisa: number;
  purposeMenus: PurposeMenuGroup[];
  keterangan: string;
};

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  if (!hasSupabaseAdminEnv()) {
    return {
      totalBarangDiambil: 0,
      riwayatHariIni: 0,
      userAktif: 1,
      supabaseConfigured: false,
    };
  }

  const supabase = createSupabaseAdminClient();
  const today = getTodayDateValue();

  const [barangResult, riwayatResult] = await Promise.all([
    supabase
      .from("detail_pengambilan_barang")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("pengambilan_barang")
      .select("id", { count: "exact", head: true })
      .eq("tanggal", today),
  ]);

  if (barangResult.error) {
    throw new Error(
      `Gagal mengambil total barang: ${barangResult.error.message}`
    );
  }

  if (riwayatResult.error) {
    throw new Error(
      `Gagal mengambil riwayat hari ini: ${riwayatResult.error.message}`
    );
  }

  return {
    totalBarangDiambil: barangResult.count ?? 0,
    riwayatHariIni: riwayatResult.count ?? 0,
    userAktif: 1,
    supabaseConfigured: true,
  };
}

export async function getPicOptions(): Promise<PicOption[]> {
  if (!hasSupabaseAdminEnv()) {
    return [];
  }

  const supabase = createSupabaseAdminClient();

  const { data: picUsers, error: picError } = await supabase
    .from("users")
    .select("id")
    .eq("role", "pic");

  if (picError) {
    throw new Error(`Gagal mengambil user PIC: ${picError.message}`);
  }

  const picIds = (picUsers ?? []).map((user) => user.id);

  if (picIds.length === 0) {
    return [];
  }

  const { data: details, error: detailError } = await supabase
    .from("users_detail")
    .select("user_id,nama")
    .in("user_id", picIds);

  if (detailError) {
    throw new Error(`Gagal mengambil nama PIC: ${detailError.message}`);
  }

  const namaByUserId = new Map(
    (details ?? []).map((detail) => [detail.user_id, detail.nama])
  );

  return picIds
    .map((id) => ({ id, nama: namaByUserId.get(id) ?? `User ${id}` }))
    .sort((a, b) => a.nama.localeCompare(b.nama));
}

export async function getRiwayatPengambilan(
  filters: RiwayatFilters = {}
): Promise<{
  data: RiwayatPengambilan[];
  supabaseConfigured: boolean;
}> {
  if (!hasSupabaseAdminEnv()) {
    return {
      data: [],
      supabaseConfigured: false,
    };
  }

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("pengambilan_barang")
    .select("id,tanggal,user_id,shift,created_at");

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters.tanggalDari) {
    query = query.gte("tanggal", filters.tanggalDari);
  }
  if (filters.tanggalSampai) {
    query = query.lte("tanggal", filters.tanggalSampai);
  }

  const { data, error } = await query
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw new Error(`Gagal mengambil riwayat: ${error.message}`);
  }

  const rows = data ?? [];

  if (rows.length === 0) {
    return {
      data: [],
      supabaseConfigured: true,
    };
  }

  const userIds = [...new Set(rows.map((item) => item.user_id))];
  const { data: userDetails, error: userDetailsError } = await supabase
    .from("users_detail")
    .select("user_id,nama,departemen_id")
    .in("user_id", userIds);

  if (userDetailsError) {
    throw new Error(`Gagal mengambil detail user: ${userDetailsError.message}`);
  }

  const departemenIds = [
    ...new Set((userDetails ?? []).map((item) => item.departemen_id)),
  ];

  if (departemenIds.length === 0) {
    return {
      data: rows.map((item) => ({
        id: item.id,
        tanggal: item.tanggal,
        nama: `User ${item.user_id}`,
        departemen: "-",
        shift: item.shift,
        created_at: item.created_at,
      })),
      supabaseConfigured: true,
    };
  }

  const { data: departemen, error: departemenError } = await supabase
    .from("master_departemen")
    .select("id,nama")
    .in("id", departemenIds);

  if (departemenError) {
    throw new Error(`Gagal mengambil departemen: ${departemenError.message}`);
  }

  return {
    data: rows.map((item) => {
      const detail = userDetails?.find((user) => user.user_id === item.user_id);
      const departemenItem = departemen?.find(
        (row) => row.id === detail?.departemen_id
      );

      return {
        id: item.id,
        tanggal: item.tanggal,
        nama: detail?.nama ?? `User ${item.user_id}`,
        departemen: departemenItem?.nama ?? "-",
        shift: item.shift,
        created_at: item.created_at,
      };
    }),
    supabaseConfigured: true,
  };
}

export async function getRiwayatLengkap(
  filters: RiwayatFilters = {}
): Promise<{ data: RiwayatLengkapRow[]; supabaseConfigured: boolean }> {
  if (!hasSupabaseAdminEnv()) {
    return { data: [], supabaseConfigured: false };
  }

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("pengambilan_barang")
    .select("id,tanggal,user_id,shift,created_at");

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }
  if (filters.tanggalDari) {
    query = query.gte("tanggal", filters.tanggalDari);
  }
  if (filters.tanggalSampai) {
    query = query.lte("tanggal", filters.tanggalSampai);
  }

  const { data: pengambilan, error } = await query
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    throw new Error(`Gagal mengambil riwayat: ${error.message}`);
  }

  const headerRows = pengambilan ?? [];

  if (headerRows.length === 0) {
    return { data: [], supabaseConfigured: true };
  }

  const userIds = [...new Set(headerRows.map((row) => row.user_id))];
  const pengambilanIds = headerRows.map((row) => row.id);

  const [detailRes, userDetailRes] = await Promise.all([
    supabase
      .from("detail_pengambilan_barang")
      .select(
        "id,pengambilan_barang_id,nama_barang,satuan_id,jumlah_diambil,jumlah_terpakai,keterangan,created_at"
      )
      .in("pengambilan_barang_id", pengambilanIds)
      .order("created_at", { ascending: true }),
    supabase
      .from("users_detail")
      .select("user_id,nama,departemen_id")
      .in("user_id", userIds),
  ]);

  if (detailRes.error) {
    throw new Error(`Gagal mengambil detail barang: ${detailRes.error.message}`);
  }
  if (userDetailRes.error) {
    throw new Error(
      `Gagal mengambil detail user: ${userDetailRes.error.message}`
    );
  }

  const userDetails = userDetailRes.data ?? [];
  const departemenIds = [
    ...new Set(userDetails.map((detail) => detail.departemen_id)),
  ];

  const departemenById = new Map<number, string>();
  if (departemenIds.length > 0) {
    const { data: departemen } = await supabase
      .from("master_departemen")
      .select("id,nama")
      .in("id", departemenIds);
    for (const item of departemen ?? []) {
      departemenById.set(item.id, item.nama);
    }
  }

  const detailRows = detailRes.data ?? [];
  const satuanIds = [...new Set(detailRows.map((row) => row.satuan_id))];
  const satuanById = new Map<number, string>();
  if (satuanIds.length > 0) {
    const { data: satuan } = await supabase
      .from("master_satuan")
      .select("id,nama")
      .in("id", satuanIds);
    for (const item of satuan ?? []) {
      satuanById.set(item.id, item.nama);
    }
  }

  // Rincian menu per detail (purpose ada di level ini) ->
  // string ringkas "Nasi Goreng (1) - Produksi, ...".
  const detailIds = detailRows.map((row) => row.id);
  const purposeMenusByDetail = new Map<number, PurposeMenuGroup[]>();
  if (detailIds.length > 0) {
    const { data: menus } = await supabase
      .from("detail_pemakaian_menu")
      .select(
        "detail_pengambilan_barang_id,menu,jumlah,purpose_id,created_at"
      )
      .in("detail_pengambilan_barang_id", detailIds)
      .order("created_at", { ascending: true });

    const menuRows = menus ?? [];
    const purposeIds = [...new Set(menuRows.map((row) => row.purpose_id))];
    const purposeById = new Map<number, string>();
    if (purposeIds.length > 0) {
      const { data: purpose } = await supabase
        .from("master_purpose")
        .select("id,name")
        .in("id", purposeIds);
      for (const item of purpose ?? []) {
        purposeById.set(item.id, item.name);
      }
    }

    // Kelompokkan per purpose -> daftar menu.
    const grouped = new Map<
      number,
      Map<string, { menu: string; jumlah: number }[]>
    >();
    for (const row of menuRows) {
      const purposeName = purposeById.get(row.purpose_id) ?? "-";
      const byPurpose =
        grouped.get(row.detail_pengambilan_barang_id) ??
        new Map<string, { menu: string; jumlah: number }[]>();
      const list = byPurpose.get(purposeName) ?? [];
      list.push({ menu: row.menu, jumlah: row.jumlah });
      byPurpose.set(purposeName, list);
      grouped.set(row.detail_pengambilan_barang_id, byPurpose);
    }
    for (const [detailId, byPurpose] of grouped) {
      purposeMenusByDetail.set(
        detailId,
        [...byPurpose.entries()].map(([purpose, menus]) => ({
          purpose,
          menus,
        }))
      );
    }
  }

  const userDetailByUserId = new Map(
    userDetails.map((detail) => [detail.user_id, detail])
  );

  const detailByPengambilan = new Map<number, typeof detailRows>();
  for (const row of detailRows) {
    const list = detailByPengambilan.get(row.pengambilan_barang_id) ?? [];
    list.push(row);
    detailByPengambilan.set(row.pengambilan_barang_id, list);
  }

  const data: RiwayatLengkapRow[] = [];

  for (const header of headerRows) {
    const userDetail = userDetailByUserId.get(header.user_id);
    const nama = userDetail?.nama ?? `User ${header.user_id}`;
    const departemen =
      userDetail?.departemen_id != null
        ? departemenById.get(userDetail.departemen_id) ?? "-"
        : "-";

    const items = detailByPengambilan.get(header.id) ?? [];

    if (items.length === 0) {
      data.push({
        pengambilanId: header.id,
        tanggal: header.tanggal,
        nama,
        departemen,
        shift: header.shift,
        nama_barang: "-",
        satuan: "-",
        jumlah_diambil: 0,
        jumlah_terpakai: 0,
        sisa: 0,
        purposeMenus: [],
        keterangan: "-",
      });
      continue;
    }

    for (const item of items) {
      data.push({
        pengambilanId: header.id,
        tanggal: header.tanggal,
        nama,
        departemen,
        shift: header.shift,
        nama_barang: item.nama_barang,
        satuan: satuanById.get(item.satuan_id) ?? "-",
        jumlah_diambil: item.jumlah_diambil,
        jumlah_terpakai: item.jumlah_terpakai,
        sisa: item.jumlah_diambil - item.jumlah_terpakai,
        purposeMenus: purposeMenusByDetail.get(item.id) ?? [],
        keterangan: item.keterangan,
      });
    }
  }

  return { data, supabaseConfigured: true };
}

export async function getDetailPengambilan(
  id: number
): Promise<DetailRiwayat> {
  if (!hasSupabaseAdminEnv()) {
    return { header: null, items: [] };
  }

  const supabase = createSupabaseAdminClient();

  const { data: pengambilan, error } = await supabase
    .from("pengambilan_barang")
    .select("id,tanggal,user_id,shift,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Gagal mengambil pengambilan: ${error.message}`);
  }

  if (!pengambilan) {
    return { header: null, items: [] };
  }

  const { data: detail } = await supabase
    .from("users_detail")
    .select("nama,departemen_id")
    .eq("user_id", pengambilan.user_id)
    .maybeSingle();

  let departemenNama = "-";
  if (detail?.departemen_id) {
    const { data: departemen } = await supabase
      .from("master_departemen")
      .select("nama")
      .eq("id", detail.departemen_id)
      .maybeSingle();
    departemenNama = departemen?.nama ?? "-";
  }

  const { data: detailItems, error: detailItemsError } = await supabase
    .from("detail_pengambilan_barang")
    .select(
      "id,nama_barang,satuan_id,jumlah_diambil,jumlah_terpakai,keterangan,created_at"
    )
    .eq("pengambilan_barang_id", id)
    .order("created_at", { ascending: true });

  if (detailItemsError) {
    throw new Error(
      `Gagal mengambil detail barang: ${detailItemsError.message}`
    );
  }

  const rows = detailItems ?? [];
  const satuanIds = [...new Set(rows.map((row) => row.satuan_id))];

  const satuanById = new Map<number, string>();
  if (satuanIds.length > 0) {
    const { data: satuan } = await supabase
      .from("master_satuan")
      .select("id,nama")
      .in("id", satuanIds);
    for (const item of satuan ?? []) {
      satuanById.set(item.id, item.nama);
    }
  }

  const detailIds = rows.map((row) => row.id);
  const purposeMenusByDetail = new Map<number, PurposeMenuGroup[]>();
  if (detailIds.length > 0) {
    const { data: menus } = await supabase
      .from("detail_pemakaian_menu")
      .select(
        "detail_pengambilan_barang_id,menu,jumlah,purpose_id,created_at"
      )
      .in("detail_pengambilan_barang_id", detailIds)
      .order("created_at", { ascending: true });

    const menuRows = menus ?? [];
    const purposeIds = [...new Set(menuRows.map((row) => row.purpose_id))];
    const purposeById = new Map<number, string>();
    if (purposeIds.length > 0) {
      const { data: purpose } = await supabase
        .from("master_purpose")
        .select("id,name")
        .in("id", purposeIds);
      for (const item of purpose ?? []) {
        purposeById.set(item.id, item.name);
      }
    }

    // Kelompokkan per purpose -> daftar menu.
    const grouped = new Map<
      number,
      Map<string, { menu: string; jumlah: number }[]>
    >();
    for (const row of menuRows) {
      const purposeName = purposeById.get(row.purpose_id) ?? "-";
      const byPurpose =
        grouped.get(row.detail_pengambilan_barang_id) ??
        new Map<string, { menu: string; jumlah: number }[]>();
      const list = byPurpose.get(purposeName) ?? [];
      list.push({ menu: row.menu, jumlah: row.jumlah });
      byPurpose.set(purposeName, list);
      grouped.set(row.detail_pengambilan_barang_id, byPurpose);
    }
    for (const [detailId, byPurpose] of grouped) {
      purposeMenusByDetail.set(
        detailId,
        [...byPurpose.entries()].map(([purpose, menus]) => ({
          purpose,
          menus,
        }))
      );
    }
  }

  return {
    header: {
      id: pengambilan.id,
      tanggal: pengambilan.tanggal,
      nama: detail?.nama ?? `User ${pengambilan.user_id}`,
      departemen: departemenNama,
      shift: pengambilan.shift,
      created_at: pengambilan.created_at,
    },
    items: rows.map((row) => ({
      nama_barang: row.nama_barang,
      satuan: satuanById.get(row.satuan_id) ?? "-",
      jumlah_diambil: row.jumlah_diambil,
      jumlah_terpakai: row.jumlah_terpakai,
      sisa: row.jumlah_diambil - row.jumlah_terpakai,
      purposeMenus: purposeMenusByDetail.get(row.id) ?? [],
      keterangan: row.keterangan,
    })),
  };
}
