'use client'

import { useRouter } from 'next/navigation'
import Login from '@/components/Login'

export default function LoginPage() {
  const router = useRouter()

  const handleLogin = () => {
    router.push('/dashboard')
  }

  return <Login onLogin={handleLogin} />
}
