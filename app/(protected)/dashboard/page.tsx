import Link from "next/link";
import { connection } from "next/server";
import {
  Boxes,
  ClipboardList,
  Database,
  History,
  UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardStats } from "@/lib/pengambilan-barang";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  await connection();

  const dashboardStats = await getDashboardStats();
  const stats = [
    {
      label: "Barang Diambil",
      value: String(dashboardStats.totalBarangDiambil),
      icon: Boxes,
    },
    {
      label: "Riwayat Hari Ini",
      value: String(dashboardStats.riwayatHariIni),
      icon: History,
    },
    {
      label: "User Aktif",
      value: String(dashboardStats.userAktif),
      icon: UsersRound,
    },
  ];

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan pengambilan barang
          </p>
        </div>
        <Link
          href="/pengambilan-barang"
          className={cn(
            buttonVariants(),
            "w-full bg-primary text-primary-foreground sm:w-fit"
          )}
        >
          <ClipboardList data-icon="inline-start" />
          Input Pengambilan
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <Card
              key={item.label}
              className="rounded-lg border-stone-200 shadow-sm dark:border-neutral-800"
            >
              <CardHeader className="gap-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-sm text-muted-foreground">
                    {item.label}
                  </CardTitle>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{item.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg border-stone-200 shadow-sm dark:border-neutral-800">
          <CardHeader className="gap-2 border-b">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Menu Utama</CardTitle>
              <Badge variant="secondary">PIC</Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 pt-5 sm:grid-cols-2">
            <Link
              href="/master-data"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "justify-start"
              )}
            >
              <Database data-icon="inline-start" />
              Master Data
            </Link>
            <Link
              href="/riwayat-pengambilan"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "justify-start"
              )}
            >
              <History data-icon="inline-start" />
              Riwayat Pengambilan
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-stone-200 shadow-sm dark:border-neutral-800">
          <CardHeader className="gap-2 border-b">
            <CardTitle className="text-base">Status Sistem</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 pt-5">
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <span className="text-sm text-muted-foreground">Supabase</span>
              <Badge
                variant={
                  dashboardStats.supabaseConfigured ? "default" : "secondary"
                }
              >
                {dashboardStats.supabaseConfigured
                  ? "Terhubung"
                  : "Belum diset"}
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
              <span className="text-sm text-muted-foreground">Akses</span>
              <Badge variant="secondary">PIC</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
