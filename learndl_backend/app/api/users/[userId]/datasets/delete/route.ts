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
    const { datasetId } = body;

    if (!datasetId || typeof datasetId !== "string") {
      return withCors(
        NextResponse.json({ error: "datasetId is required" }, { status: 400 }),
        req
      );
    }

    const dataset = await prisma.dataset.findFirst({
      where: {
        datasetId,
        userId,
      },
    });

    if (!dataset) {
      return withCors(
        NextResponse.json({ error: "Dataset not found" }, { status: 404 }),
        req
      );
    }

    await prisma.dataset.delete({
      where: {
        datasetId,
      },
    });

    return withCors(
      NextResponse.json({ success: true, datasetId }, { status: 200 }),
      req
    );
  } catch (error) {
    console.error("Error deleting dataset:", error);
    return withCors(
      NextResponse.json({ error: "Internal Server Error" }, { status: 500 }),
      req
    );
  }
}
