"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@clerk/nextjs"

export type UserDocument = {
  id: string
  [key: string]: unknown
}

type CollectionState<T> = {
  userId: string | null
  items: T[]
  loading: boolean
  error: string | null
}

async function readResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Sesi login berakhir. Silakan masuk kembali."
        : "Data belum bisa dimuat. Silakan coba lagi nanti.",
    )
  }
  return response.json() as Promise<T>
}

export function useUserCollection<T extends UserDocument>(collectionName: string) {
  const { isLoaded, isSignedIn, userId: clerkUserId } = useAuth()
  const userId = clerkUserId ?? null
  const [state, setState] = useState<CollectionState<T>>({
    userId: null,
    items: [],
    loading: true,
    error: null,
  })

  const reload = useCallback(async () => {
    if (!userId || !isSignedIn) throw new Error("Sesi login berakhir. Silakan masuk kembali.")
    const response = await fetch(`/api/user-data/${encodeURIComponent(collectionName)}`, {
      cache: "no-store",
    })
    return readResponse<T[]>(response)
  }, [collectionName, isSignedIn, userId])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn || !userId) {
      setState({ userId: null, items: [], loading: false, error: null })
      return
    }

    let active = true
    setState({ userId, items: [], loading: true, error: null })

    void reload()
      .then((items) => {
        if (active) setState({ userId, items, loading: false, error: null })
      })
      .catch(() => {
        if (active) {
          setState({
            userId,
            items: [],
            loading: false,
            error: "Data belum bisa dimuat. Silakan coba lagi nanti.",
          })
        }
      })

    return () => {
      active = false
    }
  }, [isLoaded, isSignedIn, reload, userId])

  const ensureSession = useCallback(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      throw new Error("Sesi login berakhir. Silakan masuk kembali.")
    }
  }, [isLoaded, isSignedIn, userId])

  const mutate = useCallback(
    async (url: string, method: "POST" | "PATCH" | "PUT" | "DELETE", data?: unknown) => {
      ensureSession()
      const response = await fetch(url, {
        method,
        cache: "no-store",
        headers: data === undefined ? undefined : { "Content-Type": "application/json" },
        body: data === undefined ? undefined : JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Sesi login berakhir. Silakan masuk kembali."
            : "Data gagal disimpan. Silakan coba lagi nanti.",
        )
      }

      const items = await reload()
      setState({ userId, items, loading: false, error: null })
      return response.status === 204 ? undefined : response.json()
    },
    [ensureSession, reload, userId],
  )

  async function addItem(data: Omit<T, "id">) {
    return mutate(`/api/user-data/${encodeURIComponent(collectionName)}`, "POST", data)
  }

  async function updateItem(id: string, data: Partial<Omit<T, "id">>) {
    await mutate(
      `/api/user-data/${encodeURIComponent(collectionName)}/${encodeURIComponent(id)}`,
      "PATCH",
      data,
    )
  }

  async function setItem(id: string, data: Omit<T, "id">) {
    await mutate(
      `/api/user-data/${encodeURIComponent(collectionName)}/${encodeURIComponent(id)}`,
      "PUT",
      data,
    )
  }

  async function deleteItem(id: string) {
    await mutate(
      `/api/user-data/${encodeURIComponent(collectionName)}/${encodeURIComponent(id)}`,
      "DELETE",
    )
  }

  const isCurrentUser = state.userId === userId

  return {
    items: isCurrentUser ? state.items : [],
    loading: !isLoaded || (!isCurrentUser && Boolean(userId)) || (isCurrentUser && state.loading),
    error: isCurrentUser ? state.error : null,
    ready: isLoaded && Boolean(isSignedIn && userId),
    addItem,
    updateItem,
    setItem,
    deleteItem,
  }
}
