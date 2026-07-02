import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "pic" | "admin";
      departemenId: number | null;
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    role: "pic" | "admin";
    departemenId: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: "pic" | "admin";
    departemenId: number | null;
  }
}
