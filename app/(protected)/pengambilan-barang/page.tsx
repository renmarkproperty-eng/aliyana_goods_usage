import { PengambilanBarangForm } from "@/components/pengambilan-barang-form";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default async function PengambilanBarangPage() {
  const supabase = createSupabaseAdminClient();
  const [satuanRes, purposeRes] = await Promise.all([
    supabase.from("master_satuan").select("id,nama").order("nama"),
    supabase.from("master_purpose").select("id,name").order("name"),
  ]);

  const satuanOptions = (satuanRes.data ?? []).map((item) => item.nama);
  const purposeOptions = purposeRes.data ?? [];

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">
          Input Pengambilan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Form pengambilan dan pemakaian barang
        </p>
      </div>

      <PengambilanBarangForm
        initialTanggal={getTodayDateValue()}
        satuanOptions={satuanOptions}
        purposeOptions={purposeOptions}
      />
    </div>
  );
}
