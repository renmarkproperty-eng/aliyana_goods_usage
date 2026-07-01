import { Boxes, Building2, Ruler } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const masterData = [
  {
    label: "Barang",
    description: "Daftar item operasional",
    icon: Boxes,
  },
  {
    label: "Satuan",
    description: "Unit pemakaian barang",
    icon: Ruler,
  },
  {
    label: "Departemen",
    description: "Area pengambilan barang",
    icon: Building2,
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

          return (
            <Card
              key={item.label}
              className="rounded-lg border-stone-200 shadow-sm dark:border-neutral-800"
            >
              <CardHeader className="gap-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
