import { PengambilanBarangForm } from "@/components/pengambilan-barang-form";

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function PengambilanBarangPage() {
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

      <PengambilanBarangForm initialTanggal={getTodayDateValue()} />
    </div>
  );
}
