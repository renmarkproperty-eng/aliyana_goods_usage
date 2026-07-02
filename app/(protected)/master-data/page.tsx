import Link from "next/link";
import { Building2, ChevronRight, Ruler, Target } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const masterData = [
  {
    label: "Departemen",
    description: "Area pengambilan barang",
    icon: Building2,
    href: "/master-data/departemen",
  },
  {
    label: "Satuan",
    description: "Unit pemakaian barang",
    icon: Ruler,
    href: "/master-data/satuan",
  },
  {
    label: "Purpose",
    description: "Tujuan penggunaan barang",
    icon: Target,
    href: "/master-data/purpose",
  },
];

export default function MasterDataPage() {
  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Master Data</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Data referensi aplikasi
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {masterData.map((item) => {
          const Icon = item.icon;

          const card = (
            <Card
              className="h-full rounded-lg border-stone-200 shadow-sm transition-colors data-[link=true]:hover:border-primary/40 dark:border-neutral-800"
              data-link={item.href ? "true" : undefined}
            >
              <CardHeader className="gap-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  {item.href ? (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  ) : (
                    <Icon className="size-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );

          if (item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {card}
              </Link>
            );
          }

          return <div key={item.label}>{card}</div>;
        })}
      </div>
    </div>
  );
}
