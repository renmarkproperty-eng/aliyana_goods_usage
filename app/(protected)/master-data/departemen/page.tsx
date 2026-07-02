import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import {
  DepartemenManager,
  type Departemen,
} from "@/components/departemen-manager";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DepartemenPage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("master_departemen")
    .select("id,nama,created_at")
    .order("nama", { ascending: true });

  const departemen: Departemen[] = data ?? [];

  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <Link
          href="/master-data"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" />
          Master Data
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Departemen
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola area pengambilan barang
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Gagal memuat data departemen: {error.message}
        </div>
      ) : (
        <DepartemenManager departemen={departemen} />
      )}
    </div>
  );
}
