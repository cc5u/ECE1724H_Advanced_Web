import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function getAllowedOrigins() {
  const configuredOrigins = process.env.CORS_ALLOWED_ORIGINS
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins?.length
    ? configuredOrigins
    : DEFAULT_ALLOWED_ORIGINS;
}

function buildCorsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowedOrigins = getAllowedOrigins();
  const isAllowedOrigin = origin ? allowedOrigins.includes(origin) : false;

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: isAllowedOrigin && origin ? buildCorsHeaders(origin) : undefined,
    });
  }

  const response = NextResponse.next();

  if (isAllowedOrigin && origin) {
    Object.entries(buildCorsHeaders(origin)).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
