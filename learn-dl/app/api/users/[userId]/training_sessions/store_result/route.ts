import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

const TRAINING_JOB_STATUSES = [
  "queued",
  "running",
  "evaluating",
  "completed",
  "error",
  "cancelled",
] as const;

type TrainingJobStatus = (typeof TRAINING_JOB_STATUSES)[number];

const isTrainingJobStatus = (value: unknown): value is TrainingJobStatus =>
  typeof value === "string" &&
  TRAINING_JOB_STATUSES.includes(value as TrainingJobStatus);

export async function PUT(req: NextRequest, context: RouteContext) {
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
    const {
      trainingSessionId,
      modelName,
      hyperParams,
      metrics,
      status,
      progress,
      errorMessage,
      startedAt,
      completedAt,
    } = body;

    if (!trainingSessionId || typeof trainingSessionId !== "string") {
      return NextResponse.json(
        { error: "trainingSessionId is required" },
        { status: 400 },
      );
    }

    const existingSession = await prisma.trainingSession.findFirst({
      where: {
        sessionId: trainingSessionId,
        userId,
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        { error: "Training session not found for this user" },
        { status: 404 },
      );
    }

    const normalizedStatus = isTrainingJobStatus(status) ? status : null;
    const normalizedProgress =
      typeof progress === "number" && Number.isFinite(progress)
        ? Math.max(0, Math.min(100, progress))
        : null;
    const normalizedErrorMessage =
      errorMessage === null
        ? null
        : typeof errorMessage === "string" && errorMessage.trim() !== ""
          ? errorMessage.trim()
          : undefined;
    const normalizedStartedAt =
      typeof startedAt === "string" && !Number.isNaN(Date.parse(startedAt))
        ? new Date(startedAt)
        : startedAt === null
          ? null
          : undefined;
    const normalizedCompletedAt =
      typeof completedAt === "string" && !Number.isNaN(Date.parse(completedAt))
        ? new Date(completedAt)
        : completedAt === null
          ? null
          : undefined;

    const updatedSession = await prisma.trainingSession.update({
      where: { sessionId: trainingSessionId },
      data: {
        ...(typeof modelName === "string" && modelName.trim() !== ""
          ? { modelName }
          : {}),
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
        ...(normalizedProgress !== null
          ? { progress: normalizedProgress }
          : {}),
        ...(normalizedErrorMessage !== undefined
          ? { errorMessage: normalizedErrorMessage }
          : {}),
        ...(hyperParams !== undefined ? { hyperParams } : {}),
        ...(metrics !== undefined ? { metrics } : {}),
        ...(normalizedStartedAt !== undefined
          ? { startedAt: normalizedStartedAt }
          : {}),
        ...(normalizedCompletedAt !== undefined
          ? { completedAt: normalizedCompletedAt }
          : {}),
      },
      select: {
        sessionId: true,
        userId: true,
        datasetId: true,
        modelName: true,
        status: true,
        progress: true,
        errorMessage: true,
        hyperParams: true,
        metrics: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { trainingSession: updatedSession },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating training session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
