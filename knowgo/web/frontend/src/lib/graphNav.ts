const NAV_REF_KEY = "knowgo_nav_ref";
const NAV_WORKSPACE_KEY = "knowgo_nav_workspace";

export function setGraphNavigation(workspace: string, refId?: string) {
  try {
    sessionStorage.setItem(NAV_WORKSPACE_KEY, workspace);
    if (refId) sessionStorage.setItem(NAV_REF_KEY, refId);
    else sessionStorage.removeItem(NAV_REF_KEY);
  } catch {
    /* ignore */
  }
}

export function consumeGraphNavigation(): { workspace?: string; refId?: string } {
  try {
    const workspace = sessionStorage.getItem(NAV_WORKSPACE_KEY) ?? undefined;
    const refId = sessionStorage.getItem(NAV_REF_KEY) ?? undefined;
    sessionStorage.removeItem(NAV_WORKSPACE_KEY);
    sessionStorage.removeItem(NAV_REF_KEY);
    return { workspace, refId };
  } catch {
    return {};
  }
}

export function peekGraphNavRef(): string | undefined {
  try {
    return sessionStorage.getItem(NAV_REF_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}
