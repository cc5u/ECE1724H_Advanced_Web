import {NextResponse ,NextRequest} from 'next/server';
import { prisma } from '@/lib/prisma';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Missing or invalid token' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const firebaseUid = decodedToken.uid;
        const user = await prisma.user.findFirst({
            where: { firebaseUid },
        });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json({ message: 'User logged in successfully', user }, { status: 200 });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// This route is for logging in users.
// It verifies the Firebase ID token sent in the Authorization header, checks if the user exists in the database, and returns the user information if successful. 
// If the token is missing or invalid, or if the user is not found, it returns appropriate error messages.

// frontend post request example:
// const response = await fetch('/api/auth/login', {
//     method: 'POST',
//     headers: {
//         'Authorization': `Bearer ${idToken}`,
//     },
// });
