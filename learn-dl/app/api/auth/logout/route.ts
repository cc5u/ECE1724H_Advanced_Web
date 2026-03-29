import { NextResponse, NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { handleCorsPreflight, withCors } from "@/lib/cors";

export function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
} // Handle CORS preflight requests

export async function POST(req: NextRequest) {
  try {
    // Since we're using stateless authentication with Firebase ID tokens, 
    // logging out is handled on the client side by simply deleting the token.
    // However, we can still verify the token to ensure it's valid before confirming logout.
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return withCors(
            NextResponse.json({ error: "Missing or invalid token" }, { status: 401 }),
            req
        );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const adminAuth = getAdminAuth();
    await adminAuth.verifyIdToken(idToken); // Verify the token to ensure it's valid
    
    return withCors(
        NextResponse.json({ message: "User logged out successfully" }, { status: 200 }),
        req
    );
  } catch (error) {
    console.error("Logout error:", error);
    return withCors(
        NextResponse.json({ error: "Internal server error" }, { status: 500 }),
        req
    );
}
}

// This route is for logging out users. Since we're using stateless authentication with Firebase ID tokens, logging out is handled on the client side by simply deleting the token. 
// However, this route still verifies the token to ensure it's valid before confirming logout. If the token is missing or invalid, it returns an appropriate error message.
