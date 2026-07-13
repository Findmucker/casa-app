import type { DecodedIdToken } from "firebase-admin/auth";

export async function getFirebaseAdmin() {
  const admin = (await import("firebase-admin")).default;

  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) return null;

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }

  return admin;
}

export async function verifyFirebaseRequest(request: Request): Promise<DecodedIdToken | null> {
  const header = request.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const admin = await getFirebaseAdmin();
  if (!admin) return null;

  try {
    return await admin.auth().verifyIdToken(match[1]);
  } catch {
    return null;
  }
}
