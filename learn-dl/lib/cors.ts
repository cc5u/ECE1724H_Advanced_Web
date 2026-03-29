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

function getAllowedOrigin(origin: string | null) {
  if (!origin) {
    return null;
  }

  return getAllowedOrigins().includes(origin) ? origin : null;
}

function buildCorsHeaders(origin: string, requestedHeaders: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": requestedHeaders,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = getAllowedOrigin(request.headers.get("origin"));
  const requestedHeaders =
    request.headers.get("access-control-request-headers") ??
    "Content-Type, Authorization";

  if (!origin) {
    return {};
  }

  return buildCorsHeaders(origin, requestedHeaders);
}

export function withCors(response: NextResponse, request: NextRequest) {
  Object.entries(getCorsHeaders(request)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export function handleCorsPreflight(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
