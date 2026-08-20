import { NextResponse } from "next/server";
import { getFirebaseAdmin, verifyFirebaseRequest } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const caller = await verifyFirebaseRequest(request);
    if (!caller) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { to, title, body, tag } = await request.json();
    if (typeof to !== "string" || typeof title !== "string" || !to.trim() || !title.trim()) {
      return NextResponse.json({ error: "Missing 'to' or 'title'" }, { status: 400 });
    }

    const adm = await getFirebaseAdmin();
    if (!adm) return NextResponse.json({ error: "Firebase Admin not configured" }, { status: 503 });

    const db = adm.firestore();
    const callerProfile = await db.collection("users").doc(caller.uid).get();
    const houseId = callerProfile.data()?.houseId;
    if (!callerProfile.exists || typeof houseId !== "string") {
      return NextResponse.json({ error: "House membership required" }, { status: 403 });
    }

    const houseDoc = await db.collection("houses").doc(houseId).get();
    const members: Array<{ uid?: string; name?: string }> = houseDoc.data()?.members || [];
    if (!members.some((member) => member.uid === caller.uid)) {
      return NextResponse.json({ error: "House membership required" }, { status: 403 });
    }

    const normalizedTarget = to.trim().toLowerCase();
    const target = members.find((member) => member.name?.trim().toLowerCase() === normalizedTarget);
    if (!target?.uid) return NextResponse.json({ error: "Target is not in your house" }, { status: 403 });

    let tokenDoc = await db.collection("fcm_tokens").doc(target.uid).get();
    if (!tokenDoc.exists) tokenDoc = await db.collection("fcm_tokens").doc(normalizedTarget).get();
    if (!tokenDoc.exists) return NextResponse.json({ error: "No push token for this household member" }, { status: 404 });

    const token = tokenDoc.data()?.token;
    if (typeof token !== "string" || !token) {
      return NextResponse.json({ error: "No push token for this household member" }, { status: 404 });
    }

    await adm.messaging().send({
      token,
      data: {
        title: title.trim().slice(0, 100),
        body: typeof body === "string" ? body.slice(0, 500) : "",
        tag: typeof tag === "string" ? tag.slice(0, 100) : "general",
      },
      android: { priority: "high" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
