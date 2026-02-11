'use client'

import { useParams, useRouter } from 'next/navigation'
import Login from '@/components/pages/Login'
import { buildLocalePath, type Locale } from '@/lib/locale'

export default function LoginPage() {
  const router = useRouter()
  const params = useParams<{ locale: Locale }>()
  const locale = params?.locale ?? 'en'

  const handleLogin = () => {
    router.push(buildLocalePath(locale, '/dashboard'))
  }

  return <Login onLogin={handleLogin} />
}
