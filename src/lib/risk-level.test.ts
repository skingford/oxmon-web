import { describe, expect, it } from "vitest"

import {
  parseRiskScore,
  resolveRiskLevel,
  resolveRiskLevelByScore,
  riskBadgeClassNameByLevel,
  riskBadgeClassName,
  riskLevelLabelZh,
  riskLevelColorHex,
} from "./risk-level"

describe("risk-level", () => {
  it("解析风险分值时支持百分比与小数", () => {
    expect(parseRiskScore("85%")).toBe(85)
    expect(parseRiskScore("0.85")).toBe(85)
    expect(parseRiskScore("score: 72.5")).toBe(72.5)
    expect(parseRiskScore("N/A")).toBeNull()
  })

  it("按阈值映射风险等级", () => {
    expect(resolveRiskLevelByScore(59.99)).toBe("normal")
    expect(resolveRiskLevelByScore(60)).toBe("attention")
    expect(resolveRiskLevelByScore(80)).toBe("attention")
    expect(resolveRiskLevelByScore(80.01)).toBe("alert")
    expect(resolveRiskLevelByScore(85)).toBe("alert")
    expect(resolveRiskLevelByScore(85.01)).toBe("critical")
  })

  it("无数字时回退关键字识别", () => {
    expect(resolveRiskLevel("critical")).toBe("critical")
    expect(resolveRiskLevel("high risk")).toBe("critical")
    expect(resolveRiskLevel("warning")).toBe("alert")
    expect(resolveRiskLevel("watch")).toBe("attention")
    expect(resolveRiskLevel("low")).toBe("normal")
  })

  it("返回统一颜色", () => {
    expect(riskLevelColorHex("normal")).toBe("#22c55e")
    expect(riskLevelColorHex("attention")).toBe("#3b82f6")
    expect(riskLevelColorHex("alert")).toBe("#f59e0b")
    expect(riskLevelColorHex("critical")).toBe("#ef4444")
    expect(riskBadgeClassNameByLevel("critical")).toContain("text-red-600")
    expect(riskBadgeClassName("86%")).toContain("text-red-600")
  })

  it("返回中文风险等级文案", () => {
    expect(riskLevelLabelZh("normal")).toBe("正常")
    expect(riskLevelLabelZh("attention")).toBe("关注")
    expect(riskLevelLabelZh("alert")).toBe("告警")
    expect(riskLevelLabelZh("critical")).toBe("严重告警")
  })
})
