import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { createSpacesClient, getSpacesBucket } from "@/lib/spaces";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

async function buildDownloadResponse(
  req: NextRequest,
  context: RouteContext,
  trainingSessionId: string | undefined,
) {
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

    if (!trainingSessionId || typeof trainingSessionId !== "string") {
      return NextResponse.json(
        { error: "trainingSessionId is required" },
        { status: 400 },
      );
    }

    const trainingSession = await prisma.trainingSession.findFirst({
      where: {
        sessionId: trainingSessionId,
        userId,
      },
      select: {
        sessionId: true,
        modelName: true,
      },
    });

    if (!trainingSession) {
      return NextResponse.json(
        { error: "Training session not found" },
        { status: 404 },
      );
    }

    const bucket = getSpacesBucket();
    const s3Client = createSpacesClient();
    const key = `users/${userId}/sessions/${trainingSession.sessionId}/${trainingSession.modelName}.pth`;

    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${trainingSession.modelName}"`,
    });

    const downloadUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 3600,
    });

    return NextResponse.json(
      {
        sessionId: trainingSession.sessionId,
        modelName: trainingSession.modelName,
        key,
        downloadUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error creating training session download URL:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest, context: RouteContext) {
  const trainingSessionId =
    req.nextUrl.searchParams.get("trainingSessionId") ?? undefined;
  return buildDownloadResponse(req, context, trainingSessionId);
}
