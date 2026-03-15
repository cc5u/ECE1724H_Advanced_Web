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

export async function POST(req: NextRequest, context: RouteContext) {
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
    const { datasetId, modelName, hyperParams, metrics } = body;

    if (!datasetId || typeof datasetId !== "string") {
      return withCors(
        NextResponse.json({ error: "datasetId is required" }, { status: 400 }),
        req
      );
    }

    if (!modelName || typeof modelName !== "string") {
      return withCors(
        NextResponse.json({ error: "modelName is required" }, { status: 400 }),
        req
      );
    }

    const dataset = await prisma.dataset.findFirst({
      where: {
        datasetId,
        userId,
      },
    }); // Ensure the dataset belongs to the user

    if (!dataset) {
      return withCors(
        NextResponse.json({ error: "Dataset not found for this user" }, { status: 404 }),
        req
      );
    }

    const newSession = await prisma.trainingSession.create({
      data: {
        userId,
        datasetId,
        modelName,
        hyperParams,
        metrics,
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
      NextResponse.json({ trainingSession: newSession }, { status: 201 }),
      req
    );
  } catch (error) {
    console.error("Error starting training session:", error);
    return withCors(
      NextResponse.json({ error: "Internal Server Error" }, { status: 500 }),
      req
    );
  }
}
// Post route to start a new training session for a user based on a dataset and model parameters

