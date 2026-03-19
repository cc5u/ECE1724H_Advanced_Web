import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { handleCorsPreflight, withCors } from "@/lib/cors";
import { deleteSpaceObjectsByPrefix } from "@/lib/spaces";


// This API is for deleting a training session by sessionId for a specific user

// Request body: { sessionId: string }

// Response: { success: boolean, sessionId: string } on success
//           { error: string } on failure

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function DELETE(req: NextRequest, context: RouteContext) {
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
    const { userId } = await context.params;

    const currentUser = await prisma.user.findFirst({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!currentUser) {
      return withCors(
        NextResponse.json({ error: "Authenticated user not found" }, { status: 404 }),
        req
      );
    }

    if (currentUser.userId !== userId) {
      return withCors(
        NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        req
      );
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return withCors(
        NextResponse.json({ error: "sessionId is required" }, { status: 400 }),
        req
      );
    }

    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        sessionId,
        userId,
      },
    });

    if (!trainingSession) {
      return withCors(
        NextResponse.json({ error: "Training session not found" }, { status: 404 }),
        req
      );
    }

    await prisma.trainingSession.delete({
      where: {
        sessionId,
      },
    });

    const sessionSpacePrefix = `users/${userId}/sessions/${sessionId}/${trainingSession.modelName}`;
    const deletedObjectCount = await deleteSpaceObjectsByPrefix(sessionSpacePrefix);

    if (deletedObjectCount === 0) {
      console.log(`No cloud folder found for session ${sessionId} at ${sessionSpacePrefix}`);
    }

    return withCors(
      NextResponse.json({ success: true, sessionId }, { status: 200 }),
      req
    );
  } catch (error) {
    console.error("Error deleting training session:", error);
    return withCors(
      NextResponse.json({ error: "Internal Server Error" }, { status: 500 }),
      req
    );
  }
}
