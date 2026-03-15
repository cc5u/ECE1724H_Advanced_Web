import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { handleCorsPreflight, withCors } from "@/lib/cors";
import { z } from "zod";

const updateUserSchema = z.object({
  email: z.email("Email is invalid"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
});

export function OPTIONS(req: NextRequest) {
    return handleCorsPreflight(req);
} // Handle CORS preflight requests

export async function PUT(req: NextRequest) {
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
        const decodedToken = await adminAuth.verifyIdToken(idToken);
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
        const body = await req.json();
        const validation = updateUserSchema.safeParse(body);
        if (!validation.success) {
            const fieldErrors = validation.error.flatten().fieldErrors;
            return withCors(
                NextResponse.json(
                    {
                        error: "Invalid profile data",
                        fieldErrors: {
                            email: fieldErrors.email?.[0],
                            name: fieldErrors.name?.[0],
                        },
                    },
                    { status: 400 }
                ),
                req
            );
        }

        const { name, email } = validation.data;
        const updatedUser = await prisma.user.update({
            where: { userId: user.userId },
            data: { name, email },
        });
        return withCors(
            NextResponse.json({ user: updatedUser }, { status: 200 }),
            req
        );
    } catch (error) {
        console.error("Error updating user:", error);
        return withCors(
            NextResponse.json({ error: "Internal server error" }, { status: 500 }),
            req
        );
    }
}

// This route is for updating the currently authenticated user's information.
// It verifies the Firebase ID token sent in the Authorization header, checks if the user exists in the database, 
// and updates the user's name and email if successful. 
// If the token is missing or invalid, or if the user is not found, it returns appropriate error messages.
