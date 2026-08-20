import type { Firestore } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirebaseAdmin, verifyFirebaseRequest } from "@/lib/firebase-admin";

const MAX_TITLE_LENGTH = 100;
const MAX_BODY_LENGTH = 500;
const MAX_TAG_LENGTH = 100;

type NotificationRequest = {
  to?: unknown;
  title?: unknown;
  body?: unknown;
  tag?: unknown;
};

type HouseMember = {
  uid?: string;
  name?: string;
};

export async function POST(request: Request) {
  try {
    const caller = await verifyFirebaseRequest(request);
    if (!caller) return errorResponse("Unauthorized", 401);

    const payload = (await request.json()) as NotificationRequest;
    const targetName = requiredString(payload.to);
    const title = requiredString(payload.title);
    if (!targetName || !title) return errorResponse("Missing 'to' or 'title'", 400);

    const admin = await getFirebaseAdmin();
    if (!admin) return errorResponse("Firebase Admin not configured", 503);

    const db = admin.firestore();
    const callerProfile = await db.collection("users").doc(caller.uid).get();
    const houseId = callerProfile.data()?.houseId;
    if (!callerProfile.exists || typeof houseId !== "string") {
      return errorResponse("House membership required", 403);
    }

    const house = await db.collection("houses").doc(houseId).get();
    const members = parseMembers(house.data()?.members);
    if (!members.some((member) => member.uid === caller.uid)) {
      return errorResponse("House membership required", 403);
    }

    const normalizedTarget = targetName.toLowerCase();
    const target = members.find(
      (member) => member.name?.trim().toLowerCase() === normalizedTarget,
    );
    if (!target?.uid) return errorResponse("Target is not in your house", 403);

    const token = await findPushToken(db, target.uid, normalizedTarget);
    if (!token) return errorResponse("No push token for this household member", 404);

    await admin.messaging().send({
      token,
      data: {
        title: title.slice(0, MAX_TITLE_LENGTH),
        body: optionalString(payload.body).slice(0, MAX_BODY_LENGTH),
        tag: optionalString(payload.tag, "general").slice(0, MAX_TAG_LENGTH),
      },
      android: { priority: "high" },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return errorResponse("Failed to send", 500);
  }
}

function requiredString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function optionalString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() : fallback;
}

function parseMembers(value: unknown): HouseMember[] {
  if (!Array.isArray(value)) return [];
  return value.filter((member): member is HouseMember => {
    return typeof member === "object" && member !== null;
  });
}

async function findPushToken(
  db: Firestore,
  uid: string,
  legacyName: string,
): Promise<string | null> {
  let tokenDocument = await db.collection("fcm_tokens").doc(uid).get();
  if (!tokenDocument.exists) {
    tokenDocument = await db.collection("fcm_tokens").doc(legacyName).get();
  }

  const token = tokenDocument.data()?.token;
  return typeof token === "string" && token.trim() ? token : null;
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
