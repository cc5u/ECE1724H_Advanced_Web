import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { handleCorsPreflight, withCors } from "@/lib/cors";

export function OPTIONS(req: NextRequest) {
    return handleCorsPreflight(req);
} // Handle CORS preflight requests

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return withCors(
                NextResponse.json({ error: "Missing or invalid token" }, { status: 401 }),
                req
            );
        }
        const idToken = authHeader.split("Bearer ")[1];
        const adminAuth = getAdminAuth();
        let decodedToken;

        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } catch {
            return withCors(
                NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }),
                req
            );
        }

        const firebaseUid = decodedToken.uid;
        const user = await prisma.user.findFirst({
            where: { firebaseUid },
        });

        if (!user) {
            return withCors(
                NextResponse.json({ error: "User not found" }, { status: 404 }),
                req
            );
        }
        return withCors(
            NextResponse.json({ user }, { status: 200 }),
            req
        );
    } catch (error) {
        console.error("Error fetching user:", error);
        return withCors(
            NextResponse.json({ error: "Internal server error" }, { status: 500 }),
            req
        );

    }
}

// This route is for fetching the currently authenticated user's information.
// It verifies the Firebase ID token sent in the Authorization header, checks if the user exists in the database, 
// and returns the user information if successful. 
// If the token is missing or invalid, or if the user is not found, it returns appropriate error messages.
