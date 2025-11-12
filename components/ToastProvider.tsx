"use client"

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type Toast = {
  id: string
  title?: string
  description?: string
  variant?: 'success' | 'error' | 'info'
}

type ToastContextValue = {
  toast: (t: Omit<Toast, 'id'>) => string
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9)
    const next: Toast = { id, ...t }
    setToasts((s) => [...s, next])
    // auto-dismiss
    setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== id))
    }, 4000)
    return id
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* toast container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`max-w-sm w-full px-4 py-2 rounded shadow-lg border ${
              t.variant === 'success'
                ? 'bg-green-50 border-green-200 text-green-900'
                : t.variant === 'error'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-white border-gray-200 text-gray-900'
            }`}
          >
            <div className="font-semibold text-sm">{t.title}</div>
            {t.description && <div className="text-xs mt-1">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return (opts: Omit<Toast, 'id'>) => ctx.toast(opts)
}

export default ToastProvider
