import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth-token")?.value

  // Public routes that don't require authentication
  const isPublicRoute = request.nextUrl.pathname === "/login"

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (token && isPublicRoute) {
    try {
      await jwtVerify(token, JWT_SECRET)
      return NextResponse.redirect(new URL("/", request.url))
    } catch {
      // Invalid token, allow access to login
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
