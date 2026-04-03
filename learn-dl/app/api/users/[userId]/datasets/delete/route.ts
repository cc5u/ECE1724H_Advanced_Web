import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { deleteUserSpaceObjectsByFragment } from "@/lib/spaces";

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
    const { datasetId } = body;

    if (!datasetId || typeof datasetId !== "string") {
      return NextResponse.json(
        { error: "datasetId is required" },
        { status: 400 },
      );
    }

    const dataset = await prisma.dataset.findFirst({
      where: {
        datasetId,
        userId,
      },
    });

    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    const deletedObjectCount = await deleteUserSpaceObjectsByFragment(
      userId,
      datasetId,
    );

    if (deletedObjectCount === 0) {
      console.log(`No cloud folder found for dataset ${datasetId}`);
    }

    await prisma.dataset.delete({
      where: {
        datasetId,
      },
    });

    return NextResponse.json({ success: true, datasetId }, { status: 200 });
  } catch (error) {
    console.error("Error deleting dataset:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
