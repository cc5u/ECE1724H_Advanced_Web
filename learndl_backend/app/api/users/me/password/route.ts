import { NextRequest , NextResponse} from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { handleCorsPreflight, withCors } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

export function OPTIONS(req: NextRequest) {
    return handleCorsPreflight(req);
}

export async function PATCH(req: NextRequest) {
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

        const { newPassword } = await req.json();

        if (!newPassword || typeof newPassword !== "string") {
            return withCors(
                NextResponse.json({ error: "New password is required and must be a string" }, { status: 400 }),
                req
            );
        } else if (newPassword.length < 6) {
            return withCors(
                NextResponse.json({ error: "New password must be at least 6 characters long" }, { status: 400 }),
                req
            );
        }else if (newPassword.length > 128) {
            return withCors(
                NextResponse.json({ error: "New password must be less than 128 characters long" }, { status: 400 }),
                req
            );
        }

        const user = await prisma.user.findFirst({
            where: { firebaseUid },
        });

        if (!user) {
            return withCors(
                NextResponse.json({ error: "User not found" }, { status: 404 }),
                req
            );
        }

        await adminAuth.updateUser(decodedToken.uid, { password: newPassword }); // Update password in Firebase Authentication

        return withCors(
            NextResponse.json({ message: "Password updated successfully" }, { status: 200 }),
            req
        );
    } catch (error) {
        console.error("Error updating password:", error);
        return withCors(
            NextResponse.json({ error: "Failed to update password" }, { status: 500 }),
            req
        );
    }

}
