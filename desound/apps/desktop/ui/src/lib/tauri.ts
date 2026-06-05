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

export const DESKTOP_APP_HINT =
  "请先克隆项目并启动客户端：git clone https://github.com/cassini123/everec.git && cd everec/desound/apps/desktop && npm install && npm install --prefix ui && npm run dev";
