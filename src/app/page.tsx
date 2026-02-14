import { redirect } from "next/navigation"

function resolveDefaultLocale() {
  const locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE?.toLowerCase()
  return locale === "en" ? "en" : "zh"
}

export default function RootPage() {
  redirect(`/${resolveDefaultLocale()}/dashboard`)
}
