import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routes } from "@/lib/site";

const LEGACY_PROFILE_SETTINGS = /^\/profilesettings(\/|$)/i;

export function middleware(request: NextRequest) {
  if (LEGACY_PROFILE_SETTINGS.test(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = routes.profileSettings;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
