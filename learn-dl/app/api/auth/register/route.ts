import { NextRequest, NextResponse } from "next/server";
import { handleCorsPreflight, withCors } from "@/lib/cors";
import { syncUserFromDecodedToken, verifyAuthRequest } from "@/lib/auth";

export function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function POST(req: NextRequest) {
  try {
    const verifiedRequest = await verifyAuthRequest(req);
    if (verifiedRequest.response) {
      return verifiedRequest.response;
    }

    try {
      const { user, created } = await syncUserFromDecodedToken(verifiedRequest.decodedToken);
      return withCors(
        NextResponse.json(
          {
            message: created ? "User registered successfully" : "User already exists",
            user,
          },
          { status: created ? 201 : 200 }
        ),
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
// and ensuring a corresponding application user exists in the database.

// frontend post request example:
// const response = await fetch("/api/auth/register", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${idToken}`, // Include the Firebase ID token in the Authorization header
//   },
// });
