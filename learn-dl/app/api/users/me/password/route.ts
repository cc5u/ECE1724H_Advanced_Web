import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid token" },
        { status: 401 },
      );
    }

    const idToken = authHeader.split("Bearer ")[1];
    const adminAuth = getAdminAuth();
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    const { newPassword } = await req.json();

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "New password is required and must be a string" },
        { status: 400 },
      );
    } else if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 },
      );
    } else if (newPassword.length > 128) {
      return NextResponse.json(
        { error: "New password must be less than 128 characters long" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findFirst({
      where: { firebaseUid },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await adminAuth.updateUser(decodedToken.uid, { password: newPassword }); // Update password in Firebase Authentication

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 },
    );
  }
}
