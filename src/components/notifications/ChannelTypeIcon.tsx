"use client"

import { Bell, Mail, Share2, Smartphone, Webhook } from "lucide-react"

type ChannelTypeIconProps = {
  channelType: string
  className?: string
}

export function ChannelTypeIcon({ channelType, className = "h-4 w-4" }: ChannelTypeIconProps) {
  const normalized = channelType.toLowerCase()

  if (normalized === "email") {
    return <Mail className={className} />
  }

  if (normalized === "webhook") {
    return <Webhook className={className} />
  }

  if (normalized === "slack") {
    return <Share2 className={className} />
  }

  if (normalized === "sms") {
    return <Smartphone className={className} />
  }

  return <Bell className={className} />
}
