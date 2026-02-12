import { NextResponse, type NextRequest } from "next/server"

const localePattern = /^\/(zh|en)(\/.*|$)/

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const matched = pathname.match(localePattern)

  if (!matched) {
    return NextResponse.next()
  }

  const rewrittenPathname = matched[2] || "/"
  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = rewrittenPathname === "" ? "/" : rewrittenPathname

  return NextResponse.rewrite(rewriteUrl)
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
}
