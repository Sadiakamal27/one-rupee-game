'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

type ToastVariant = 'default' | 'success' | 'error'

type ToastMessage = {
  id: number
  title: string
  description?: string
  variant: ToastVariant
}

type ToastContextValue = {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Date.now()
    setToasts((current) => [...current, { ...toast, id }])
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`w-full max-w-sm rounded-md border px-4 py-3 shadow-lg transition ${
                toast.variant === 'success'
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : toast.variant === 'error'
                  ? 'border-red-500 bg-red-50 text-red-800'
                  : 'border-gray-300 bg-white text-gray-800'
              }`}
            >
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && <p className="mt-1 text-xs text-inherit/80">{toast.description}</p>}
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context.showToast
}


