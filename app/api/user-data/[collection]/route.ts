import {
  getAuthenticatedUserId,
  getUserCollection,
  isAllowedCollection,
  validateDocumentData,
} from "@/lib/user-data-api"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ collection: string }> }

async function getCollectionName(context: RouteContext) {
  const { collection } = await context.params
  return isAllowedCollection(collection) ? collection : null
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  return !origin || origin === new URL(request.url).origin
}

export async function GET(request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return Response.json({ error: "Silakan login kembali." }, { status: 401 })

  const collectionName = await getCollectionName(context)
  if (!collectionName) return Response.json({ error: "Data tidak ditemukan." }, { status: 404 })

  try {
    const snapshot = await getUserCollection(userId, collectionName).get()
    const items = snapshot.docs.map((document) => ({ id: document.id, ...document.data() }))
    return Response.json(items, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Failed to load user collection from Firestore.", error)
    return Response.json({ error: "Data belum bisa dimuat. Silakan coba lagi nanti." }, { status: 503 })
  }
}

export async function POST(request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return Response.json({ error: "Silakan login kembali." }, { status: 401 })
  if (!isSameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 })

  const collectionName = await getCollectionName(context)
  if (!collectionName) return Response.json({ error: "Data tidak ditemukan." }, { status: 404 })

  try {
    const body: unknown = await request.json()
    const data =
      typeof body === "object" && body !== null && !Array.isArray(body)
        ? { ...body, __collection: collectionName }
        : body
    if (!validateDocumentData(data)) {
      return Response.json({ error: "Data yang dikirim tidak valid." }, { status: 400 })
    }

    const document = await getUserCollection(userId, collectionName).add(data)
    return Response.json({ id: document.id }, { status: 201, headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Failed to save user document to Firestore.", error)
    return Response.json({ error: "Data gagal disimpan. Silakan coba lagi nanti." }, { status: 503 })
  }
}
