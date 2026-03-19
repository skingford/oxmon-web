import { describe, expect, it } from "vitest"

import {
  buildInstanceContactPatternsText,
  getInstanceContactChannels,
  getInstanceContactPatternCount,
  normalizeInstanceContactPatternsInput,
} from "./instance-contact-utils"

describe("instance-contact-utils", () => {
  it("去重并清理联系人匹配规则输入", () => {
    expect(
      normalizeInstanceContactPatternsInput(" agent-a \nagent-b,agent-a,, \n agent-c ")
    ).toEqual(["agent-a", "agent-b", "agent-c"])
  })

  it("将匹配规则数组转换为多行文本", () => {
    expect(buildInstanceContactPatternsText(["agent-a", "agent-b"])).toBe("agent-a\nagent-b")
    expect(buildInstanceContactPatternsText([])).toBe("")
    expect(buildInstanceContactPatternsText(null)).toBe("")
  })

  it("按固定顺序提取有效通知渠道", () => {
    expect(
      getInstanceContactChannels({
        agent_patterns: ["agent-*"],
        contact_email: " ops@example.com ",
        contact_phone: " 13800000000 ",
        contact_dingtalk: " dingtalk://robot ",
        contact_webhook: " https://example.com/hook ",
      })
    ).toEqual([
      { type: "email", value: "ops@example.com" },
      { type: "phone", value: "13800000000" },
      { type: "dingtalk", value: "dingtalk://robot" },
      { type: "webhook", value: "https://example.com/hook" },
    ])
  })

  it("忽略空白通知渠道并统计匹配规则数量", () => {
    expect(
      getInstanceContactChannels({
        agent_patterns: ["agent-a"],
        contact_email: "   ",
        contact_phone: undefined,
        contact_dingtalk: null,
        contact_webhook: "",
      })
    ).toEqual([])

    expect(
      getInstanceContactPatternCount([
        {
          agent_patterns: ["agent-a", "agent-b"],
          contact_email: "ops@example.com",
          contact_phone: null,
          contact_dingtalk: null,
          contact_webhook: null,
        },
        {
          agent_patterns: ["agent-c"],
          contact_email: null,
          contact_phone: "13800000000",
          contact_dingtalk: null,
          contact_webhook: null,
        },
      ])
    ).toBe(3)
  })
})
