"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LockKeyhole, LogIn, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PicLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await signIn("credentials", {
        username: String(formData.get("username") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (response?.ok && !response.error) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setError("Username atau password salah.");
    } catch {
      setError("Login gagal. Coba lagi sebentar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md rounded-lg border-stone-200 shadow-sm dark:border-neutral-800">
      <CardHeader className="gap-2 border-b">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <LockKeyhole className="size-4" />
          </div>
          <div>
            <CardTitle className="text-lg">Login PIC</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Aplikasi pengambilan barang
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                className="pl-8"
                aria-invalid={error ? true : undefined}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="pl-8"
                aria-invalid={error ? true : undefined}
                required
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="h-9 w-full bg-primary text-white hover:bg-emerald-700"
            disabled={pending}
          >
            <LogIn data-icon="inline-start" />
            {pending ? "Memproses..." : "Masuk"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
