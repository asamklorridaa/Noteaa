import "server-only"
import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

function getFirebaseAdminApp() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin belum dikonfigurasi. Isi FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, dan FIREBASE_ADMIN_PRIVATE_KEY.",
    )
  }

  const defaultApp = getApps().find((app) => app.name === "[DEFAULT]")
  return (
    defaultApp ??
    initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      })
  )
}

export function getAdminFirestore() {
  return getFirestore(getFirebaseAdminApp())
}
