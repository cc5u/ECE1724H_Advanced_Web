import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { handleCorsPreflight, withCors } from "@/lib/cors";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function PUT(req: NextRequest, context: RouteContext) {
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
    const { trainingSessionId, modelName, hyperParams, metrics } = body;

    if (!trainingSessionId || typeof trainingSessionId !== "string") {
      return withCors(
        NextResponse.json({ error: "trainingSessionId is required" }, { status: 400 }),
        req
      );
    }

    const existingSession = await prisma.trainingSession.findFirst({
      where: {
        sessionId: trainingSessionId,
        userId,
      },
    });

    if (!existingSession) {
      return withCors(
        NextResponse.json({ error: "Training session not found for this user" }, { status: 404 }),
        req
      );
    }

    const updatedSession = await prisma.trainingSession.update({
      where: { sessionId: trainingSessionId },
      data: {
        ...(typeof modelName === "string" && modelName.trim() !== "" ? { modelName } : {}),
        ...(hyperParams !== undefined ? { hyperParams } : {}),
        ...(metrics !== undefined ? { metrics } : {}),
      },
      select: {
        sessionId: true,
        userId: true,
        datasetId: true,
        modelName: true,
        hyperParams: true,
        metrics: true,
        createdAt: true,
      },
    });

    return withCors(
      NextResponse.json({ trainingSession: updatedSession }, { status: 200 }),
      req
    );
  } catch (error) {
    console.error("Error updating training session:", error);
    return withCors(
      NextResponse.json({ error: "Internal Server Error" }, { status: 500 }),
      req
    );
  }
}
