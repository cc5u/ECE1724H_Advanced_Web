import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { handleCorsPreflight, withCors } from "@/lib/cors";

export function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function POST(req: NextRequest) {
  try {
    console.log(req.body);
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
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;
    const name = decodedToken.name || null;

    if (!email) {
      return withCors(
        NextResponse.json(
          { error: "Email is required" },
          { status: 400 }
        ),
        req
      );
    }

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
