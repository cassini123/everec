import { invoke as tauriInvoke, isTauri } from "@tauri-apps/api/core";

export function isTauriApp(): boolean {
  try {
    return isTauri();
  } catch {
    return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
  }
}

export async function invoke<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (!isTauriApp()) {
    throw new Error("TAURI_UNAVAILABLE");
  }
  return tauriInvoke<T>(cmd, args);
}
