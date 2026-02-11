'use client'

import React, { useEffect } from 'react'

export interface ToastMessage {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ toasts, onRemove }) => {
  useEffect(() => {
    const timers = toasts.map(toast =>
      setTimeout(() => onRemove(toast.id), 3000)
    )
    return () => timers.forEach(timer => clearTimeout(timer))
  }, [toasts, onRemove])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-white border border-border rounded-xl shadow-lg animate-fade-in-up min-w-[300px]"
        >
          <div className={`p-1 rounded-full ${
            toast.type === 'success' ? 'bg-green-100 text-success' :
            toast.type === 'error' ? 'bg-red-100 text-danger' :
            'bg-blue-100 text-primary'
          }`}>
             <span className="material-symbols-outlined text-[18px] filled">
                {toast.type === 'success' ? 'check' : toast.type === 'error' ? 'error' : 'info'}
             </span>
          </div>
          <p className="text-sm font-medium text-text-main flex-1">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-secondary hover:text-text-main transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      ))}
    </div>
  )
}

export default Toast
