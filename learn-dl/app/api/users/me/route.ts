import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { z } from "zod";

const updateUserSchema = z.object({
  email: z.email("Email is invalid"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
});

export async function PUT(req: NextRequest) {
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
    const user = await prisma.user.findFirst({
      where: { firebaseUid },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const body = await req.json();
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          error: "Invalid profile data",
          fieldErrors: {
            email: fieldErrors.email?.[0],
            name: fieldErrors.name?.[0],
          },
        },
        { status: 400 },
      );
    }

    const { name, email } = validation.data;
    const updatedUser = await prisma.user.update({
      where: { userId: user.userId },
      data: { name, email },
    });
    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// This route is for updating the currently authenticated user's information.
// It verifies the Firebase ID token sent in the Authorization header, checks if the user exists in the database,
// and updates the user's name and email if successful.
// If the token is missing or invalid, or if the user is not found, it returns appropriate error messages.
