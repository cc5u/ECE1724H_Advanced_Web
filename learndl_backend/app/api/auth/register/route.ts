import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { handleCorsPreflight, withCors } from "@/lib/cors";
import { z } from "zod";

const registerClaimsSchema = z.object({
  email: z.email("Email is invalid"),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer"),
});

export function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

function isUniqueConstraintError(error: unknown): error is { code: string; meta?: { target?: unknown } } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return withCors(
        NextResponse.json(
          { error: "Missing or invalid token" },
          { status: 401 }
        ),
        req
      );
    }

    const idToken = authHeader.split("Bearer ")[1]; // Extract the token from the header
    const adminAuth = getAdminAuth();
    let decodedToken;

    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return withCors(
        NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        ),
        req
      );
    }

    const firebaseUid = decodedToken.uid;
    const validation = registerClaimsSchema.safeParse({
      email: decodedToken.email,
      name: decodedToken.name,
    });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      return withCors(
        NextResponse.json(
          {
            error: "Invalid user profile",
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

    const { email, name } = validation.data;

    const existingUser = await prisma.user.findFirst({
      where: { firebaseUid },
    });

    if (existingUser) {
      return withCors(
        NextResponse.json(
          { message: "User already exists", user: existingUser },
          { status: 200 }
        ),
        req
      );
    }

    const existingEmailUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmailUser) {
      return withCors(
        NextResponse.json(
          {
            error: "Email is already registered",
            user: existingEmailUser,
          },
          { status: 409 }
        ),
        req
      );
    }

    const user = await prisma.user.create({
      data: {
        firebaseUid,
        email,
        name,
      },
    });

    return withCors(
      NextResponse.json(
        { message: "User registered successfully", user },
        { status: 201 }
      ),
      req
    );
  } catch (error) {
    console.error("Register error:", error);

    if (isUniqueConstraintError(error) && error.code === "P2002") {
      return withCors(
        NextResponse.json(
          { error: "Email is already registered" },
          { status: 409 }
        ),
        req
      );
    }

    return withCors(
      NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ),
      req
    );
  }
}

// This route handles user registration by verifying the Firebase ID token
// Checking if the user already exists in the database, and creating a new user record if necessary.
// It returns appropriate responses based on the outcome of each step.

// frontend post request example:
// const response = await fetch("/api/auth/register", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${idToken}`, // Include the Firebase ID token in the Authorization header
//   },
// });
