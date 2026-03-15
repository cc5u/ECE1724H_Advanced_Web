import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { handleCorsPreflight, withCors } from "@/lib/cors";

export function OPTIONS(req: NextRequest) {
    return handleCorsPreflight(req);
}

export async function DELETE(req: NextRequest) {
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

    await prisma.user.delete({
      where: { userId: user.userId },
    });

    return withCors(
      NextResponse.json({ message: "User deleted successfully" }, { status: 200 }),
      req
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return withCors(
      NextResponse.json({ error: "Failed to delete user" }, { status: 500 }),
      req
    );
  }
}
