"use client"

import { useEffect, useState } from "react"

const AUTO_CREATE_ADVANCED_STORAGE_KEY = "certificates:auto-create-advanced:v1"

type AutoCreateDraftStorage = {
  port?: unknown
  checkInterval?: unknown
  note?: unknown
}

export function useCertificateAutoCreateDraft() {
  const [port, setPort] = useState("")
  const [checkInterval, setCheckInterval] = useState("")
  const [note, setNote] = useState("")

  const advancedFilledCount = [port, checkInterval, note].reduce(
    (count, value) => (value.trim() ? count + 1 : count),
    0
  )
  const hasAdvancedDraft = advancedFilledCount > 0

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    try {
      const raw = window.sessionStorage.getItem(AUTO_CREATE_ADVANCED_STORAGE_KEY)

      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw) as AutoCreateDraftStorage

      if (typeof parsed.port === "string") {
        setPort(parsed.port)
      }

      if (typeof parsed.checkInterval === "string") {
        setCheckInterval(parsed.checkInterval)
      }

      if (typeof parsed.note === "string") {
        setNote(parsed.note)
      }
    } catch {
      window.sessionStorage.removeItem(AUTO_CREATE_ADVANCED_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (!hasAdvancedDraft) {
      window.sessionStorage.removeItem(AUTO_CREATE_ADVANCED_STORAGE_KEY)
      return
    }

    window.sessionStorage.setItem(
      AUTO_CREATE_ADVANCED_STORAGE_KEY,
      JSON.stringify({
        port,
        checkInterval,
        note,
      })
    )
  }, [checkInterval, hasAdvancedDraft, note, port])

  const resetAdvancedDraft = () => {
    setPort("")
    setCheckInterval("")
    setNote("")
  }

  return {
    port,
    setPort,
    checkInterval,
    setCheckInterval,
    note,
    setNote,
    advancedFilledCount,
    hasAdvancedDraft,
    resetAdvancedDraft,
  }
}
