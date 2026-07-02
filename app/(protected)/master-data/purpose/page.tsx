import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { PurposeManager, type Purpose } from "@/components/purpose-manager";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PurposePage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("master_purpose")
    .select("id,name")
    .order("name", { ascending: true });

  const purpose: Purpose[] = data ?? [];

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
          <h1 className="text-2xl font-semibold tracking-normal">Purpose</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola tujuan penggunaan barang
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Gagal memuat data purpose: {error.message}
        </div>
      ) : (
        <PurposeManager purpose={purpose} />
      )}
    </div>
  );
}
