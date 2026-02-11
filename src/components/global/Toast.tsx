'use client'

import React, { useEffect } from 'react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
    const timers = toasts.map((toast) =>
      setTimeout(() => onRemove(toast.id), 3000),
    )

    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [toasts, onRemove])

  const renderToastIcon = (type: ToastMessage['type']) => {
    if (type === 'success') {
      return <CheckCircle2 className="size-[18px]" />
    }

    if (type === 'error') {
      return <CircleAlert className="size-[18px]" />
    }

    return <Info className="size-[18px]" />
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <Alert
          key={toast.id}
          variant={toast.type === 'error' ? 'destructive' : 'default'}
          className="pointer-events-auto flex min-w-[300px] items-center gap-3 border border-border bg-white px-4 py-3 shadow-lg"
        >
          <div
            className={`rounded-full p-1 ${
              toast.type === 'success'
                ? 'bg-green-100 text-success'
                : toast.type === 'error'
                  ? 'bg-red-100 text-danger'
                  : 'bg-blue-100 text-primary'
            }`}
          >
            {renderToastIcon(toast.type)}
          </div>

          <AlertDescription className="flex-1 text-sm font-medium text-text-main">
            {toast.message}
          </AlertDescription>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onRemove(toast.id)}
            className="text-secondary transition-colors hover:text-text-main"
          >
            <X className="size-[18px]" />
          </Button>
        </Alert>
      ))}
    </div>
  )
}

export default Toast
