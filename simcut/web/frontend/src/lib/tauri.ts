/** Web 端桩：无 Tauri 桌面环境 */
export function isTauriApp(): boolean {
  return false;
}

export async function invoke<T>(
  _cmd: string,
  _args?: Record<string, unknown>,
): Promise<T> {
  throw new Error("NOT_IN_DESKTOP_APP");
}

export const DESKTOP_APP_HINT =
  "完整渲染请使用 Simcut 桌面客户端；网页版支持剪辑、色彩、静帧与本地项目存储。";
