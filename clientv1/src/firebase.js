import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDEaytemNcDby98RFLQUJtQjB5MHavKRM8",
  authDomain: "astrovedham-66a0d.firebaseapp.com",
  projectId: "astrovedham-66a0d",
  storageBucket: "astrovedham-66a0d.firebasestorage.app",
  messagingSenderId: "902846948837",
  appId: "1:902846948837:web:fd4ba431df76ea99b0bb0c"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export async function getFcmToken() {
  try {
    if (typeof window === "undefined") return null;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;

    const messagingSupported = await isSupported().catch(() => false);
    if (!messagingSupported) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("VITE_FIREBASE_VAPID_KEY is missing. Skipping FCM token generation.");
      return null;
    }

    const registration = await navigator.serviceWorker.register("/portal/firebase-messaging-sw.js");
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    return token || null;
  } catch (error) {
    console.error("Unable to get FCM token:", error);
    return null;
  }
}

export { app };
