import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware to detect mvp.hearaway.app hostname and redirect to /moved page
 * This handles the migration from mvp.hearaway.app → hearaway.app
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";

  // If request is from mvp subdomain and not already on /moved page
  if (hostname.includes("mvp.hearaway.app") && !request.nextUrl.pathname.startsWith("/moved")) {
    // Redirect to the moved page
    return NextResponse.rewrite(new URL("/moved", request.url));
  }

  // For all other requests, continue normally
  return NextResponse.next();
}

/**
 * Configure which routes this middleware applies to
 * Run on all routes except static files and API routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
