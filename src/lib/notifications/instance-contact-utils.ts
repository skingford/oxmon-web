import type { InstanceContactItem } from "@/types/api"

type InstanceContactLike = Pick<
  InstanceContactItem,
  "agent_patterns" | "contact_email" | "contact_phone" | "contact_dingtalk" | "contact_webhook"
>

export type InstanceContactChannel = {
  type: "email" | "phone" | "dingtalk" | "webhook"
  value: string
}

export function normalizeInstanceContactPatternsInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  )
}

export function buildInstanceContactPatternsText(patterns: string[] | null | undefined) {
  return (patterns || []).join("\n")
}

export function getInstanceContactChannels(contact: InstanceContactLike): InstanceContactChannel[] {
  const channels: InstanceContactChannel[] = []

  if (contact.contact_email?.trim()) {
    channels.push({
      type: "email",
      value: contact.contact_email.trim(),
    })
  }

  if (contact.contact_phone?.trim()) {
    channels.push({
      type: "phone",
      value: contact.contact_phone.trim(),
    })
  }

  if (contact.contact_dingtalk?.trim()) {
    channels.push({
      type: "dingtalk",
      value: contact.contact_dingtalk.trim(),
    })
  }

  if (contact.contact_webhook?.trim()) {
    channels.push({
      type: "webhook",
      value: contact.contact_webhook.trim(),
    })
  }

  return channels
}

export function getInstanceContactPatternCount(contacts: InstanceContactLike[]) {
  return contacts.reduce((sum, contact) => sum + (contact.agent_patterns?.length || 0), 0)
}
