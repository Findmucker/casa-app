import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ─── FCM Messaging ───────────────────────────────────────────
let messagingInstance: Messaging | null = null;

export async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (messagingInstance) return messagingInstance;
  const supported = await isSupported();
  if (!supported) return null;
  messagingInstance = getMessaging(app);
  return messagingInstance;
}

export async function getFCMToken(): Promise<string | null> {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return null;
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
    });
    return token;
  } catch (e) {
    console.error("FCM token error:", e);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: unknown) => void) {
  getMessagingInstance().then((messaging) => {
    if (messaging) onMessage(messaging, callback);
  });
}
