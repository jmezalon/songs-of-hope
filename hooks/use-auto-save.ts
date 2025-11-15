"use client"

import { useEffect, useRef } from "react"

interface UseAutoSaveOptions<T> {
  data: T
  key: string
  delay?: number
  enabled?: boolean
}

export function useAutoSave<T>({
  data,
  key,
  delay = 1000,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip first render to avoid overwriting loaded data
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (!enabled) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(data))
        console.log(`Auto-saved to ${key}`)
      } catch (error) {
        console.error('Failed to auto-save:', error)
      }
    }, delay)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, key, delay, enabled])
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Failed to load from localStorage:', error)
    return defaultValue
  }
}

export function clearLocalStorage(key: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(key)
    console.log(`Cleared ${key} from localStorage`)
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}
