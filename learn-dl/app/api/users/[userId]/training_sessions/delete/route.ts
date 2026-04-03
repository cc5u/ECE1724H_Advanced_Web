import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
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

export async function DELETE(req: NextRequest, context: RouteContext) {
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
    const { userId } = await context.params;

    const currentUser = await prisma.user.findFirst({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Authenticated user not found" },
        { status: 404 },
      );
    }

    if (currentUser.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 },
      );
    }

    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        sessionId,
        userId,
      },
    });

    if (!trainingSession) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 },
      );
    }

    await prisma.trainingSession.delete({
      where: {
        sessionId,
      },
    });

    const sessionSpacePrefix = `users/${userId}/sessions/${sessionId}/${trainingSession.modelName}`;
    const deletedObjectCount =
      await deleteSpaceObjectsByPrefix(sessionSpacePrefix);

    if (deletedObjectCount === 0) {
      console.log(
        `No cloud folder found for session ${sessionId} at ${sessionSpacePrefix}`,
      );
    }

    return NextResponse.json({ success: true, sessionId }, { status: 200 });
  } catch (error) {
    console.error("Error deleting training session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
