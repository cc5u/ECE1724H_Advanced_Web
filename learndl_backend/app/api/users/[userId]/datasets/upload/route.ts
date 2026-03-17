import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { handleCorsPreflight, withCors } from "@/lib/cors";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
//import 'dotenv/config'; -> emm ask Hans

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

    //frontend -> give { 1.filename 2. modelname }
    const body = await req.json();
    const { fileName, modelName, previewData } = body;

    if (!fileName || typeof fileName !== "string") {
      return withCors(
        NextResponse.json({ error: "fileName is required" }, { status: 400 }),
        req
      );
    }

    if (!modelName || typeof modelName !== "string") {
      return withCors(
        NextResponse.json({ error: "modelName is required" }, { status: 400 }),
        req
      );
    }

    if (!previewData) {
        return withCors(
          NextResponse.json({ error: "previewData is required" }, { status: 400 }),
          req
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
          modelName,
        },
      });

      return { newDataset: dataset, newSession: session };
    });

    // 2. generate presigned url
    const s3Client = new S3Client({
      endpoint: "https://tor1.digitaloceanspaces.com",
      region: "tor1",
      credentials: {
        accessKeyId: process.env.SPACES_KEY || "",
        secretAccessKey: process.env.SPACES_SECRET || "",
      },
    });

    const spacePath = `users/${userId}/dataset/${newDataset.datasetId}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.SPACES_BUCKET || "",
      Key: spacePath,
      ContentType: "text/csv",
    });

    const getCommand = new GetObjectCommand({
      Bucket: process.env.SPACES_BUCKET || "",
      Key: spacePath,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const getUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    
    return withCors(
      NextResponse.json({ url: uploadUrl, getUrl: getUrl, datasetId: newDataset.datasetId , sessionId: newSession.sessionId}, { status: 201 }),
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