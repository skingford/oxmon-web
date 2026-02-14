"use client"

import * as React from "react"
import CodeMirror from "@uiw/react-codemirror"
import { json } from "@codemirror/lang-json"
import { EditorView, placeholder as cmPlaceholder } from "@codemirror/view"
import JSON5 from "json5"
import { Check, Copy, WandSparkles } from "lucide-react"
import { toast } from "sonner"
import { useAppTranslations } from "@/hooks/use-app-translations"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type JsonTextareaProps = Omit<React.ComponentProps<"textarea">, "value" | "onChange"> & {
  value: string
  onChange: (value: string) => void
  autoFormat?: boolean
  showInvalidHint?: boolean
  enableRepair?: boolean
  repairOnBlur?: boolean
  maxHeightClassName?: string
}

function tryFormatJson(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  return JSON.stringify(JSON.parse(trimmed), null, 2)
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function safeParseLenient(value: string) {
  const strict = safeParseJson(value)

  if (strict !== null) {
    return strict
  }

  try {
    return JSON5.parse(value)
  } catch {
    return null
  }
}

const SENSITIVE_KEY_PATTERN =
  /(secret|token|password|passwd|api[_-]?key|access[_-]?key|private[_-]?key|sign|signature|credential)/i

function sanitizeSensitiveValues(input: unknown): unknown {
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeSensitiveValues(item))
  }

  if (!input || typeof input !== "object") {
    return input
  }

  const next: Record<string, unknown> = {}

  for (const [key, rawValue] of Object.entries(input as Record<string, unknown>)) {
    const value = sanitizeSensitiveValues(rawValue)

    if (typeof value === "string" && SENSITIVE_KEY_PATTERN.test(key)) {
      next[key] = value.replace(/[\r\n]+/g, "").trim()
      continue
    }

    next[key] = value
  }

  return next
}

function unwrapCodeFence(value: string) {
  const lines = value.trim().split("\n")

  if (lines.length >= 2 && lines[0].trim().startsWith("```") && lines[lines.length - 1].trim() === "```") {
    return lines.slice(1, -1).join("\n")
  }

  return value
}

function replaceSmartQuotes(value: string) {
  return value
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
}

function normalizeMismatchedStringQuotes(value: string) {
  return value
    .replace(/"([^"\n\\]*(?:\\.[^"\n\\]*)*)'(\s*[,}\]])/g, "\"$1\"$2")
    .replace(/'([^'\n\\]*(?:\\.[^'\n\\]*)*)"(\s*[,}\]])/g, "\"$1\"$2")
}

function normalizeRawLineBreaksInStrings(value: string) {
  let inString = false
  let escaped = false
  let result = ""

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]

    if (escaped) {
      result += char
      escaped = false
      continue
    }

    if (char === "\\") {
      result += char
      escaped = true
      continue
    }

    if (char === "\"") {
      result += char
      inString = !inString
      continue
    }

    if (inString && (char === "\n" || char === "\r")) {
      let cursor = index + 1

      while (cursor < value.length && (value[cursor] === "\n" || value[cursor] === "\r" || value[cursor] === " " || value[cursor] === "\t")) {
        cursor += 1
      }

      if (value[cursor] === "\"") {
        index = cursor - 1
        continue
      }

      result += "\\n"
      continue
    }

    result += char
  }

  return result
}

function normalizeFullwidthPunctuationOutsideStrings(value: string) {
  let inString = false
  let escaped = false
  let result = ""

  for (const char of value) {
    if (escaped) {
      result += char
      escaped = false
      continue
    }

    if (char === "\\") {
      result += char
      escaped = true
      continue
    }

    if (char === "\"") {
      result += char
      inString = !inString
      continue
    }

    if (!inString) {
      if (char === "，") {
        result += ","
        continue
      }

      if (char === "：") {
        result += ":"
        continue
      }

      if (char === "｛") {
        result += "{"
        continue
      }

      if (char === "｝") {
        result += "}"
        continue
      }

      if (char === "［") {
        result += "["
        continue
      }

      if (char === "］") {
        result += "]"
        continue
      }
    }

    result += char
  }

  return result
}

function stripBom(value: string) {
  return value.replace(/^\uFEFF/, "")
}

function stripPrefixToJsonStart(value: string) {
  const index = value.search(/[{[]/)

  if (index <= 0) {
    return value
  }

  return value.slice(index)
}

function truncateAfterTopLevelJson(value: string) {
  let inString = false
  let escaped = false
  const stack: string[] = []
  let started = false

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]

    if (escaped) {
      escaped = false
      continue
    }

    if (char === "\\") {
      escaped = true
      continue
    }

    if (char === "\"") {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (!started) {
      if (char === "{" || char === "[") {
        started = true
        stack.push(char)
      }
      continue
    }

    if (char === "{" || char === "[") {
      stack.push(char)
      continue
    }

    if (char === "}") {
      if (stack[stack.length - 1] === "{") {
        stack.pop()
        if (stack.length === 0) {
          return value.slice(0, index + 1)
        }
      }
      continue
    }

    if (char === "]") {
      if (stack[stack.length - 1] === "[") {
        stack.pop()
        if (stack.length === 0) {
          return value.slice(0, index + 1)
        }
      }
    }
  }

  return value
}

function stripJsonComments(value: string) {
  let inString = false
  let escaped = false
  let inLineComment = false
  let inBlockComment = false
  let result = ""

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]
    const next = value[index + 1]

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false
        result += char
      }
      continue
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false
        index += 1
      }
      continue
    }

    if (escaped) {
      result += char
      escaped = false
      continue
    }

    if (char === "\\") {
      result += char
      escaped = true
      continue
    }

    if (char === "\"") {
      result += char
      inString = !inString
      continue
    }

    if (!inString && char === "/" && next === "/") {
      inLineComment = true
      index += 1
      continue
    }

    if (!inString && char === "/" && next === "*") {
      inBlockComment = true
      index += 1
      continue
    }

    result += char
  }

  return result
}

function replaceSingleQuotedStrings(value: string) {
  return value.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, content: string) => {
    const escaped = content.replace(/"/g, "\\\"")
    return `"${escaped}"`
  })
}

function quoteUnquotedObjectKeys(value: string) {
  return value.replace(/([{,]\s*)([A-Za-z_$][A-Za-z0-9_$-]*)(\s*:)/g, "$1\"$2\"$3")
}

function replaceEqualsWithColon(value: string) {
  return value.replace(/([{,]\s*"[^"]+"\s*)=/g, "$1:")
}

function removeSemicolonsBeforeClosers(value: string) {
  return value
    .replace(/;\s*([}\]])/g, "$1")
    .replace(/;\s*(\r?\n)/g, "$1")
}

function insertMissingCommasBeforeNextKey(value: string) {
  return value.replace(
    /(\btrue\b|\bfalse\b|\bnull\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|"(?:[^"\\]|\\.)*"|\}|\])(\s*)("(?:(?:[^"\\]|\\.)+)"\s*:)/g,
    "$1,$2$3"
  )
}

function removeDuplicateCommas(value: string) {
  return value
    .replace(/,\s*,+/g, ",")
    .replace(/([{[])\s*,+/g, "$1")
}

function removeTrailingCommas(value: string) {
  return value.replace(/,\s*([}\]])/g, "$1")
}

function fillMissingValues(value: string) {
  return value.replace(/:\s*(?=[}\],])/g, ": null")
}

function convertPythonLikeLiterals(value: string) {
  return value
    .replace(/\bNone\b/g, "null")
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
}

function normalizeNonJsonSpecialNumbers(value: string) {
  return value
    .replace(/\bNaN\b/g, "null")
    .replace(/\b-?Infinity\b/g, "null")
    .replace(/:\s*\+(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, ": $1")
}

function quoteBarewordValues(value: string) {
  return value.replace(/(:\s*)([A-Za-z_][A-Za-z0-9_\-.]*)(\s*)(?=[,\]}])/g, (_, prefix: string, token: string, suffix: string) => {
    const normalized = token.toLowerCase()

    if (
      normalized === "true" ||
      normalized === "false" ||
      normalized === "null" ||
      /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(token)
    ) {
      return `${prefix}${token}${suffix}`
    }

    return `${prefix}"${token}"${suffix}`
  })
}

function wrapLooseObject(value: string) {
  const trimmed = value.trim()

  if (!trimmed || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return value
  }

  if (trimmed.includes(":")) {
    return `{${trimmed}}`
  }

  return value
}

function appendMissingClosers(value: string) {
  let inString = false
  let escaped = false
  let curlyBalance = 0
  let squareBalance = 0

  for (const char of value) {
    if (escaped) {
      escaped = false
      continue
    }

    if (char === "\\") {
      escaped = true
      continue
    }

    if (char === "\"") {
      inString = !inString
      continue
    }

    if (inString) {
      continue
    }

    if (char === "{") {
      curlyBalance += 1
    } else if (char === "}") {
      if (curlyBalance === 0) {
        return null
      }
      curlyBalance -= 1
    } else if (char === "[") {
      squareBalance += 1
    } else if (char === "]") {
      if (squareBalance === 0) {
        return null
      }
      squareBalance -= 1
    }
  }

  if (inString) {
    value += "\""
  }

  if (squareBalance > 0) {
    value += "]".repeat(squareBalance)
  }

  if (curlyBalance > 0) {
    value += "}".repeat(curlyBalance)
  }

  return value
}

function tryRepairAndFormatJson(value: string) {
  const raw = value.trim()

  if (!raw) {
    return null
  }

  const initialParsed = safeParseLenient(raw)
  if (initialParsed !== null) {
    return JSON.stringify(sanitizeSensitiveValues(initialParsed), null, 2)
  }

  const candidates = [
    raw,
    unwrapCodeFence(raw),
    truncateAfterTopLevelJson(stripPrefixToJsonStart(unwrapCodeFence(raw))),
  ]

  for (const base of candidates) {
    let candidate = base
    candidate = stripBom(candidate)
    candidate = replaceSmartQuotes(candidate)
    candidate = normalizeMismatchedStringQuotes(candidate)
    candidate = normalizeRawLineBreaksInStrings(candidate)
    candidate = normalizeFullwidthPunctuationOutsideStrings(candidate)
    candidate = stripJsonComments(candidate)
    candidate = convertPythonLikeLiterals(candidate)
    candidate = normalizeNonJsonSpecialNumbers(candidate)
    candidate = replaceSingleQuotedStrings(candidate)
    candidate = wrapLooseObject(candidate)
    candidate = quoteUnquotedObjectKeys(candidate)
    candidate = replaceEqualsWithColon(candidate)
    candidate = insertMissingCommasBeforeNextKey(candidate)
    candidate = quoteBarewordValues(candidate)
    candidate = fillMissingValues(candidate)
    candidate = removeSemicolonsBeforeClosers(candidate)
    candidate = removeDuplicateCommas(candidate)
    candidate = removeTrailingCommas(candidate)

    const withClosers = appendMissingClosers(candidate)
    if (!withClosers) {
      continue
    }

    const repairedParsed = safeParseLenient(withClosers)
    if (repairedParsed !== null) {
      return JSON.stringify(sanitizeSensitiveValues(repairedParsed), null, 2)
    }
  }

  return null
}

export function JsonTextarea({
  value,
  onChange,
  autoFormat = true,
  showInvalidHint = true,
  enableRepair = true,
  repairOnBlur = false,
  maxHeightClassName = "max-h-[40vh]",
  className,
  disabled,
  onBlur,
  onFocus,
  id,
  placeholder,
  "aria-invalid": ariaInvalid,
}: JsonTextareaProps) {
  const { t } = useAppTranslations("common")
  const [focused, setFocused] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const copiedTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const isInvalid = React.useMemo(() => {
    if (!value.trim()) {
      return false
    }

    try {
      JSON.parse(value)
      return false
    } catch {
      return true
    }
  }, [value])

  const setCopiedState = React.useCallback(() => {
    setCopied(true)

    if (copiedTimerRef.current) {
      clearTimeout(copiedTimerRef.current)
    }

    copiedTimerRef.current = setTimeout(() => {
      setCopied(false)
    }, 1200)
  }, [])

  const normalizeValue = React.useCallback(
    (showToast: boolean, allowRepair: boolean) => {
      if (!value.trim()) {
        return true
      }

      try {
        const normalized = tryFormatJson(value)

        if (normalized !== null && normalized !== value) {
          onChange(normalized)
        }

        if (showToast) {
          toast.success(t("jsonEditor.toastFormatted"))
        }

        return true
      } catch {
        if (!allowRepair) {
          if (showToast) {
            toast.error(t("jsonEditor.toastInvalid"))
          }

          return false
        }

        const repaired = tryRepairAndFormatJson(value)

        if (repaired !== null) {
          onChange(repaired)

          if (showToast) {
            toast.success(t("jsonEditor.toastRepaired"))
          }

          return true
        }

        if (showToast) {
          toast.error(t("jsonEditor.toastInvalid"))
        }

        return false
      }
    },
    [onChange, t, value]
  )

  const handleCopy = React.useCallback(async () => {
    const copyValue = (() => {
      try {
        return tryFormatJson(value) ?? value
      } catch {
        return value
      }
    })()

    try {
      await navigator.clipboard.writeText(copyValue)
      setCopiedState()
      toast.success(t("jsonEditor.toastCopied"))
    } catch {
      toast.error(t("jsonEditor.toastCopyFailed"))
    }
  }, [setCopiedState, t, value])

  React.useEffect(() => {
    if (!autoFormat || focused || !value.trim()) {
      return
    }

    try {
      const normalized = tryFormatJson(value)
      if (normalized !== null && normalized !== value) {
        onChange(normalized)
      }
    } catch {
      // keep raw input for invalid json
    }
  }, [autoFormat, focused, onChange, value])

  React.useEffect(() => {
    return () => {
      if (copiedTimerRef.current) {
        clearTimeout(copiedTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => normalizeValue(true, enableRepair)}
          disabled={disabled}
        >
          <WandSparkles className="mr-1 h-3.5 w-3.5" />
          {t("jsonEditor.format")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleCopy} disabled={disabled}>
          {copied ? <Check className="mr-1 h-3.5 w-3.5" /> : <Copy className="mr-1 h-3.5 w-3.5" />}
          {t("jsonEditor.copy")}
        </Button>
      </div>
      <div
        aria-invalid={ariaInvalid}
        className={cn(
          "rounded-md border border-input bg-transparent text-xs shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          "overflow-hidden",
          "[&_.cm-editor]:border-0 [&_.cm-editor]:bg-transparent [&_.cm-editor]:outline-none",
          "[&_.cm-focused]:outline-none",
          "[&_.cm-content]:py-2 [&_.cm-content]:font-mono [&_.cm-content]:text-xs",
          "[&_.cm-lineNumbers]:text-muted-foreground",
          "[&_.cm-gutters]:border-r [&_.cm-gutters]:border-border [&_.cm-gutters]:bg-muted/30",
          "[&_.cm-scroller]:overflow-auto",
          "[&_.cm-scroller]:max-h-[40vh]",
          "[&_.cm-scroller]:min-h-[10rem]",
          maxHeightClassName,
          disabled ? "opacity-50" : null,
          className
        )}
      >
        <CodeMirror
          id={id}
          value={value}
          onChange={(nextValue) => onChange(nextValue)}
          editable={!disabled}
          basicSetup={{
            highlightActiveLine: false,
            highlightActiveLineGutter: false,
            foldGutter: true,
          }}
          extensions={[
            json(),
            EditorView.lineWrapping,
            ...(placeholder ? [cmPlaceholder(placeholder)] : []),
          ]}
          onFocus={() => {
            setFocused(true)
            onFocus?.({} as React.FocusEvent<HTMLTextAreaElement>)
          }}
          onBlur={() => {
            setFocused(false)
            normalizeValue(false, enableRepair && repairOnBlur)
            onBlur?.({} as React.FocusEvent<HTMLTextAreaElement>)
          }}
        />
      </div>
      {showInvalidHint && isInvalid ? (
        <p className="text-xs text-destructive">{t("jsonEditor.invalidHint")}</p>
      ) : null}
    </div>
  )
}
