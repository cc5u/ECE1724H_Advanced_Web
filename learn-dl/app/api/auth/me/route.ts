import { NextResponse, NextRequest } from "next/server";
import { handleCorsPreflight, withCors } from "@/lib/cors";
import { syncUserFromDecodedToken, verifyAuthRequest } from "@/lib/auth";

export function OPTIONS(req: NextRequest) {
    return handleCorsPreflight(req);
} // Handle CORS preflight requests

export async function GET(req: NextRequest) {
    try {
        const verifiedRequest = await verifyAuthRequest(req);
        if (verifiedRequest.response) {
            return verifiedRequest.response;
        }

        try {
            const { user } = await syncUserFromDecodedToken(verifiedRequest.decodedToken);
            return withCors(
                NextResponse.json({ user }, { status: 200 }),
                req
            );
        } catch (error) {
            if (error instanceof Error && error.message.includes("missing an email address")) {
                return withCors(
                    NextResponse.json({ error: error.message }, { status: 400 }),
                    req
                );
            }

            return withCors(
                NextResponse.json({ error: "Failed to sync authenticated user" }, { status: 500 }),
                req
            );
        }
    } catch (error) {
        console.error("Error fetching user:", error);
        return withCors(
            NextResponse.json({ error: "Internal server error" }, { status: 500 }),
            req
        );

    }
}

// This route is for fetching the currently authenticated user's information.
// It verifies the Firebase ID token sent in the Authorization header and
// ensures the corresponding application user exists in the database.
