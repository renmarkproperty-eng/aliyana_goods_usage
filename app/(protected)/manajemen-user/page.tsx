import { ShieldCheck, UserRoundCog } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ManajemenUserPage() {
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

      <Card className="rounded-lg border-stone-200 shadow-sm dark:border-neutral-800">
        <CardHeader className="gap-2 border-b">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRoundCog className="size-4" />
            User
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                <ShieldCheck className="size-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">PIC</p>
                <p className="text-xs text-muted-foreground">
                  User default aplikasi
                </p>
              </div>
            </div>
            <Badge>Aktif</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
