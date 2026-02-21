import type { SystemConfigResponse } from "@/types/api"

export function getInitialSystemConfigForm() {
  return {
    configKey: "",
    configType: "email",
    displayName: "",
    description: "",
    configJson: "{}",
    enabled: true,
  }
}

export function getSystemConfigFormFromItem(item: SystemConfigResponse) {
  return {
    configKey: item.config_key,
    configType: item.config_type,
    displayName: item.display_name,
    description: item.description || "",
    configJson:
      typeof item.config_json === "string"
        ? item.config_json
        : JSON.stringify(item.config_json ?? {}, null, 2),
    enabled: item.enabled,
  }
}
