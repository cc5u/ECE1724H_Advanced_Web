import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createSpacesClient, getSpacesBucket } from "@/lib/spaces";

//This is the api for upload new csv

//request body : fileName, modelName, previewData

//return : url, getUrl, datasetId, sessionId

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
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

    //frontend -> give { 1.filename 2. modelname }
    const body = await req.json();
    const { fileName, modelName, previewData } = body;

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json(
        { error: "fileName is required" },
        { status: 400 },
      );
    }

    if (!modelName || typeof modelName !== "string") {
      return NextResponse.json(
        { error: "modelName is required" },
        { status: 400 },
      );
    }

    if (!previewData) {
      return NextResponse.json(
        { error: "previewData is required" },
        { status: 400 },
      );
    }

    // 1. write in tables 1. Dataset 2. TrainingSession
    const { newDataset, newSession } = await prisma.$transaction(async (tx) => {
      const dataset = await tx.dataset.create({
        data: { userId, csvName: fileName, preview: previewData },
      });

      const session = await tx.trainingSession.create({
        data: {
          userId,
          datasetId: dataset.datasetId,
          modelName: modelName,
          status: "queued",
          progress: 0,
        },
      });

      return { newDataset: dataset, newSession: session };
    });

    // 2. generate presigned url
    const s3Client = createSpacesClient();
    const bucket = getSpacesBucket();

    const spacePath = `users/${userId}/dataset/${newDataset.datasetId}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: spacePath,
      ContentType: "text/csv",
    });

    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: spacePath,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    const getUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 3600,
    });

    return NextResponse.json(
      {
        url: uploadUrl,
        getUrl: getUrl,
        datasetId: newDataset.datasetId,
        sessionId: newSession.sessionId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error starting training session:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
