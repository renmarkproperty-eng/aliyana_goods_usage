import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";

import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "PIC",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "Username PIC",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Password",
        },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        const password = credentials?.password;

        console.log("[auth] 1. input username:", JSON.stringify(username));

        if (!username || !password) {
          console.log("[auth] gagal: username/password kosong");
          return null;
        }

        const supabase = createSupabaseAdminClient();
        const { data: user, error } = await supabase
          .from("users")
          .select("id,username,password,role")
          .eq("username", username)
          .maybeSingle();

        console.log(
          "[auth] 2. query -> user:",
          user ? { id: user.id, username: user.username } : null,
          "| error:",
          error?.message ?? null
        );

        if (error || !user) {
          console.log("[auth] gagal: user tidak ketemu / query error");
          return null;
        }

        console.log(
          "[auth] 3. hash di DB diawali:",
          String(user.password).slice(0, 7)
        );

        const passwordValid = await compare(password, user.password);

        console.log("[auth] 4. password match:", passwordValid);

        if (!passwordValid) {
          console.log("[auth] gagal: password tidak cocok");
          return null;
        }

        const { data: detail } = await supabase
          .from("users_detail")
          .select("nama,departemen_id")
          .eq("user_id", user.id)
          .maybeSingle();

        return {
          id: String(user.id),
          name: detail?.nama ?? user.username,
          username: user.username,
          role: user.role,
          departemenId: detail?.departemen_id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = String(user.id);
        token.username = user.username;
        token.role = user.role;
        token.departemenId = user.departemenId;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.departemenId = token.departemenId;
      }

      return session;
    },
  },
};
