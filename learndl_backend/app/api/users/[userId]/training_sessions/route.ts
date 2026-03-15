import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";
import { handleCorsPreflight, withCors } from "@/lib/cors";

type RouteContext = {
    params: Promise<{
        userId: string;
    }>;
}; // Define the type for the route context to include the userId parameter

export function OPTIONS(req: NextRequest) {
    return handleCorsPreflight(req);
}

export async function GET(req: NextRequest, context: RouteContext) {
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

        const trainingSessions = await prisma.trainingSession.findMany({
            where: { userId },
            select: {
                sessionId: true,
                userId: true,
                datasetId: true,
                modelName: true,
                hyperParams: true,
                metrics: true,
                createdAt: true,
                dataset: {
                    select: {
                        csvName: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        return withCors(
            NextResponse.json({ trainingSessions }, { status: 200 }),
            req
        );
    } catch (error) {
        console.error("Error fetching training sessions:", error);
        return withCors(
            NextResponse.json({ error: "Internal Server Error" }, { status: 500 }),
            req
        );
    }       
}
// Get the details of a specific training session, including modelname, sesssionId, and craetedAt
