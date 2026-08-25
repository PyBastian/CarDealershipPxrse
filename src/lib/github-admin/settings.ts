import { settingsSchema, type SettingsJson } from "@/lib/car-json";
import { getFile, updateFile } from "./client";

const settingsPath = "inventory/settings.json";

export async function getSettings(token: string) {
  const file = await getFile(settingsPath, token);
  return { sha: file.sha, data: settingsSchema.parse(JSON.parse(file.content)) };
}

export async function saveSettings(data: SettingsJson, sha: string, token: string) {
  await updateFile(settingsPath, `${JSON.stringify(data, null, 2)}\n`, sha, "admin: update dealership settings", token);
}
