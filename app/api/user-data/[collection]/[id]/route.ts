import {
  getAuthenticatedUserId,
  getUserCollection,
  isAllowedCollection,
  validateDocumentData,
} from "@/lib/user-data-api"

export const runtime = "nodejs"

type RouteContext = { params: Promise<{ collection: string; id: string }> }

async function getRouteParams(context: RouteContext) {
  const { collection, id } = await context.params
  if (!isAllowedCollection(collection) || !id || id.length > 1500 || id.includes("/")) return null
  return { collection, id }
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin")
  return !origin || origin === new URL(request.url).origin
}

export async function PATCH(request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return Response.json({ error: "Silakan login kembali." }, { status: 401 })
  if (!isSameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 })

  const params = await getRouteParams(context)
  if (!params) return Response.json({ error: "Data tidak ditemukan." }, { status: 404 })

  try {
    const body: unknown = await request.json()
    const data =
      typeof body === "object" && body !== null && !Array.isArray(body)
        ? { ...body, __collection: params.collection }
        : body
    if (!validateDocumentData(data)) {
      return Response.json({ error: "Data yang dikirim tidak valid." }, { status: 400 })
    }

    const reference = getUserCollection(userId, params.collection).doc(params.id)
    const existing = await reference.get()
    if (!existing.exists) return Response.json({ error: "Data tidak ditemukan." }, { status: 404 })
    await reference.update(data)
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error("Failed to update user document in Firestore.", error)
    return Response.json({ error: "Perubahan gagal disimpan. Silakan coba lagi nanti." }, { status: 503 })
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return Response.json({ error: "Silakan login kembali." }, { status: 401 })
  if (!isSameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 })

  const params = await getRouteParams(context)
  if (!params) return Response.json({ error: "Data tidak ditemukan." }, { status: 404 })

  try {
    const body: unknown = await request.json()
    const data =
      typeof body === "object" && body !== null && !Array.isArray(body)
        ? { ...body, __collection: params.collection }
        : body
    if (!validateDocumentData(data)) {
      return Response.json({ error: "Data yang dikirim tidak valid." }, { status: 400 })
    }

    await getUserCollection(userId, params.collection).doc(params.id).set(data)
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error("Failed to save user document in Firestore.", error)
    return Response.json({ error: "Data gagal disimpan. Silakan coba lagi nanti." }, { status: 503 })
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return Response.json({ error: "Silakan login kembali." }, { status: 401 })
  if (!isSameOrigin(request)) return Response.json({ error: "Permintaan tidak valid." }, { status: 403 })

  const params = await getRouteParams(context)
  if (!params) return Response.json({ error: "Data tidak ditemukan." }, { status: 404 })

  try {
    const reference = getUserCollection(userId, params.collection).doc(params.id)
    const existing = await reference.get()
    if (!existing.exists) return Response.json({ error: "Data tidak ditemukan." }, { status: 404 })
    await reference.delete()
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete user document from Firestore.", error)
    return Response.json({ error: "Data gagal dihapus. Silakan coba lagi nanti." }, { status: 503 })
  }
}
