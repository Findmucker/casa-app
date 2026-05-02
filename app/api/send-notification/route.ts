import { NextResponse } from "next/server";

async function getAdmin() {
  const admin = (await import("firebase-admin")).default;
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      return null;
    }

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  return admin;
}

export async function POST(request: Request) {
  try {
    const { to, title, body, tag } = await request.json();

    if (!to || !title) {
      return NextResponse.json({ error: "Missing 'to' or 'title'" }, { status: 400 });
    }

    const adm = await getAdmin();
    if (!adm) {
      return NextResponse.json({ error: "Firebase Admin not configured" }, { status: 503 });
    }

    const db = adm.firestore();
    const tokenDoc = await db.collection("fcm_tokens").doc(to).get();

    if (!tokenDoc.exists) {
      return NextResponse.json({ error: `No FCM token for '${to}'` }, { status: 404 });
    }

    const { token } = tokenDoc.data()!;

    await adm.messaging().send({
      token,
      notification: { title, body: body || "" },
      data: { tag: tag || "general" },
      webpush: {
        headers: { Urgency: "high" },
        notification: {
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          vibrate: [200, 100, 200] as unknown as number[],
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Send notification error:", e);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
