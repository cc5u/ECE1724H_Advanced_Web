import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";

type RouteContext = {
  params: Promise<{
    userId: string;
  }>;
}; // Define the type for the route context to include the userId parameter

export async function GET(req: NextRequest, context: RouteContext) {
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

    const datasets = await prisma.dataset.findMany({
      where: {
        OR: [{ userId }, { userId: null, isDefault: true }],
      },
      select: {
        datasetId: true,
        csvName: true,
        preview: true,
        isDefault: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ datasets }, { status: 200 });
  } catch (error) {
    console.error("Error fetching datasets:", error);
    return NextResponse.json(
      { error: "Failed to fetch datasets" },
      { status: 500 },
    );
  }
}
// Get datasets for a user, ensuring the user is authenticated and authorized to access their datasets
