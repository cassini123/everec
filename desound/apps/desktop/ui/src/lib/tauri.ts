import { invoke as tauriInvoke, isTauri } from "@tauri-apps/api/core";

export function isTauriApp(): boolean {
  if (typeof window === "undefined") return false;
  if ("__TAURI_INTERNALS__" in window) return true;
  try {
    return isTauri();
  } catch {
    return false;
  }
}

export async function invoke<T>(
  cmd: string,
  args?: Record<string, unknown>,
): Promise<T> {
  if (!isTauriApp()) {
    throw new Error("NOT_IN_DESKTOP_APP");
  }
  return tauriInvoke<T>(cmd, args);
}

export const DESKTOP_APP_HINT = "请在 desound 客户端中使用此功能（在 apps/desktop 目录运行 npm run dev 启动）";
