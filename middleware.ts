import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_ROUTES = [
  "/dashboard",
  "/master-data",
  "/manajemen-user",
  "/riwayat-pengambilan",
];

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    const isAdminRoute = ADMIN_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );
    if (role === "pic" && isAdminRoute) {
      return NextResponse.redirect(new URL("/pengambilan-barang", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: {
      signIn: "/",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/master-data/:path*",
    "/manajemen-user/:path*",
    "/riwayat-pengambilan/:path*",
    "/pengambilan-barang/:path*",
  ],
};
