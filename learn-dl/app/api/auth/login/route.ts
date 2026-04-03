import { NextResponse, NextRequest } from "next/server";
import { syncUserFromDecodedToken, verifyAuthRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const verifiedRequest = await verifyAuthRequest(req);
    if (verifiedRequest.response) {
      return verifiedRequest.response;
    }

    try {
      const { user } = await syncUserFromDecodedToken(
        verifiedRequest.decodedToken,
      );
      return NextResponse.json(
        { message: "User logged in successfully", user },
        { status: 200 },
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("missing an email address")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(
        { error: "Failed to sync authenticated user" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// This route is for logging in users.
// It verifies the Firebase ID token sent in the Authorization header and
// ensures the corresponding application user exists in the database.

// frontend post request example:
// const response = await fetch('/api/auth/login', {
//     method: 'POST',
//     headers: {
//         'Authorization': `Bearer ${idToken}`,
//     },
// });
