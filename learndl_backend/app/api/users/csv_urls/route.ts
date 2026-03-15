import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 });
  }

  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    return NextResponse.json({ error: "Invalid userId parameter" }, { status: 400 });
  }

  try {
    const csvUrls = await prisma.dataset.findMany({
      where: { userId: normalizedUserId },
      select: {
        datasetId: true,
        csvName: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ csvUrls });
  } catch (error) {
    console.error("Error fetching CSV URLs:", error);
    return NextResponse.json({ error: "Failed to fetch CSV URLs" }, { status: 500 });
  }
}

// This route is for fetching the list of CSV URLs associated with a specific user.
// It expects a userId query parameter, validates it, and then queries the database for datasets belonging to that user.
// The response includes the dataset ID, CSV name, and creation date, ordered by creation date in descending order.
// If the userId parameter is missing or invalid, or if there's an error fetching the data, it returns appropriate error messages.
