import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME } from "./lib/constants";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/";

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (!isAuthPage && !token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/home", "/match/:path*"],
};
