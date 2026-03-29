import { NextRequest, NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { withCors } from "@/lib/cors";

type VerifiedAuthRequest =
  | {
      decodedToken: DecodedIdToken;
      response: null;
    }
  | {
      decodedToken: null;
      response: NextResponse;
    };

const normalizeEmail = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim().toLowerCase();
  return trimmedValue === "" ? null : trimmedValue;
};

const normalizeDisplayName = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue === "" ? null : trimmedValue.slice(0, 100);
};

export async function verifyAuthRequest(req: NextRequest): Promise<VerifiedAuthRequest> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return {
      decodedToken: null,
      response: withCors(
        NextResponse.json({ error: "Missing or invalid token" }, { status: 401 }),
        req,
      ),
    };
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    return {
      decodedToken,
      response: null,
    };
  } catch {
    return {
      decodedToken: null,
      response: withCors(
        NextResponse.json({ error: "Invalid or expired token" }, { status: 401 }),
        req,
      ),
    };
  }
}

export async function syncUserFromDecodedToken(decodedToken: DecodedIdToken) {
  const firebaseUid = decodedToken.uid;
  const email = normalizeEmail(decodedToken.email);
  const name = normalizeDisplayName(decodedToken.name);

  if (!email) {
    throw new Error("Authenticated Firebase user is missing an email address.");
  }

  const existingFirebaseUser = await prisma.user.findFirst({
    where: { firebaseUid },
  });

  if (existingFirebaseUser) {
    const nextUserData: {
      email?: string;
      name?: string | null;
    } = {};

    if (existingFirebaseUser.email !== email) {
      nextUserData.email = email;
    }

    if (name !== null && existingFirebaseUser.name !== name) {
      nextUserData.name = name;
    }

    if (Object.keys(nextUserData).length === 0) {
      return {
        user: existingFirebaseUser,
        created: false,
      };
    }

    const updatedUser = await prisma.user.update({
      where: { userId: existingFirebaseUser.userId },
      data: nextUserData,
    });

    return {
      user: updatedUser,
      created: false,
    };
  }

  const existingEmailUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmailUser) {
    const updatedUser = await prisma.user.update({
      where: { userId: existingEmailUser.userId },
      data: {
        firebaseUid,
        ...(name !== null ? { name } : {}),
      },
    });

    return {
      user: updatedUser,
      created: false,
    };
  }

  const createdUser = await prisma.user.create({
    data: {
      firebaseUid,
      email,
      ...(name !== null ? { name } : {}),
    },
  });

  return {
    user: createdUser,
    created: true,
  };
}
