import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "cmms_session";
const PUBLIC_PATHS = ["/login"];

// Verificación liviana (solo si la cookie existe) para preservar el destino original
// cuando alguien sin sesión escanea el QR de un equipo o abre un link directo.
// La verificación real del token sigue ocurriendo en el servidor (ver src/lib/auth.ts).
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico";

  if (isPublic) return NextResponse.next();

  const hasSession = request.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
