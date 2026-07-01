"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Database,
  History,
  LayoutDashboard,
  LogOut,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Master Data",
    href: "/master-data",
    icon: Database,
  },
  {
    label: "Riwayat Pengambilan",
    href: "/riwayat-pengambilan",
    icon: History,
  },
  {
    label: "Manajemen User",
    href: "/manajemen-user",
    icon: UsersRound,
  },
];

export function DashboardShell({
  children,
  userName,
}: {
  children: ReactNode;
  userName: string;
}) {
  const pathname = usePathname();
  const [clientPathname, setClientPathname] = useState("");

  useEffect(() => {
    setClientPathname(pathname);
  }, [pathname]);

  async function handleLogout() {
    await signOut({
      callbackUrl: "/",
    });
  }

  return (
    <div className="min-h-svh bg-stone-50 text-stone-950 dark:bg-neutral-950 dark:text-stone-50">
      <div className="flex min-h-svh w-full flex-col lg:flex-row">
        <aside className="hidden w-72 shrink-0 border-r bg-white px-4 py-5 dark:border-neutral-800 dark:bg-neutral-950 lg:flex lg:flex-col">
          <div className="flex items-center gap-3 px-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LayoutDashboard className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">
                Item Usage
              </p>
              <p className="text-xs text-muted-foreground">PIC: {userName}</p>
            </div>
          </div>

          <Separator className="my-5" />

          <nav className="grid gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = clientPathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto pt-5">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut data-icon="inline-start" />
              Logout
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b bg-white/95 px-4 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Item Usage</p>
                <p className="text-xs text-muted-foreground">PIC: {userName}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut data-icon="inline-start" />
                Logout
              </Button>
            </div>

            <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = clientPathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      active &&
                        "border-primary bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    )}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
