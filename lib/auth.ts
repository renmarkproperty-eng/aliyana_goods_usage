import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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
        const validUsername = process.env.PIC_USERNAME ?? "pic";
        const validPassword = process.env.PIC_PASSWORD ?? "pic123";

        if (username === validUsername && password === validPassword) {
          return {
            id: "pic",
            name: "PIC",
          };
        }

        return null;
      },
    }),
  ],
};
