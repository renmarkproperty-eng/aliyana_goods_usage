import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { PicLoginForm } from "@/components/pic-login-form";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect(
      session.user.role === "admin" ? "/dashboard" : "/pengambilan-barang"
    );
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-stone-50 px-4 py-8 text-stone-950 sm:px-6 dark:bg-neutral-950 dark:text-stone-50">
      <div className="w-full">
        <PicLoginForm />
      </div>
    </main>
  );
}
