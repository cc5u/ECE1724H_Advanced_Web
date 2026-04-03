import { NextResponse, NextRequest } from "next/server";
import { syncUserFromDecodedToken, verifyAuthRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const verifiedRequest = await verifyAuthRequest(req);
    if (verifiedRequest.response) {
      return verifiedRequest.response;
    }

    try {
      const { user } = await syncUserFromDecodedToken(
        verifiedRequest.decodedToken,
      );
      return NextResponse.json({ user }, { status: 200 });
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
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// This route is for fetching the currently authenticated user's information.
// It verifies the Firebase ID token sent in the Authorization header and
// ensures the corresponding application user exists in the database.
