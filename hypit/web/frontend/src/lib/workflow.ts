import type { FormatKind, RankItem, Workflow } from "../types";

const KIND_SET = new Set<FormatKind>(["ranking", "podcast", "interview"]);

function asKind(value: string, fallback: FormatKind): FormatKind {
  return KIND_SET.has(value as FormatKind) ? (value as FormatKind) : fallback;
}

export function serializeWorkflow(wf: Workflow): string {
  const lines: string[] = [
    `id: ${wf.id}`,
    `kind: ${wf.kind}`,
    `title: ${wf.title}`,
    `format: ${wf.format}`,
    `duration: ${wf.duration}`,
    `hook: ${wf.hook}`,
    `host: ${wf.host}`,
  ];
  if (wf.hostB) lines.push(`host_b: ${wf.hostB}`);
  if (wf.product) lines.push(`product: ${wf.product}`);
  lines.push(`language: ${wf.language}`, `music: ${wf.music}`, "", "narration:");
  for (const line of wf.narration) lines.push(`- ${line}`);
  if (wf.ranks.length) {
    lines.push("", "ranks:");
    for (const rank of wf.ranks) lines.push(`- ${rank.tier} | ${rank.label}`);
  }
  if (wf.reveals.length) {
    lines.push("", "reveals:");
    for (const reveal of wf.reveals) lines.push(`- ${reveal}`);
  }
  if (wf.broll.length) {
    lines.push("", "broll:");
    for (const shot of wf.broll) lines.push(`- ${shot}`);
  }
  return lines.join("\n");
}

export function parseWorkflow(source: string, fallback?: Workflow): Workflow {
  const base: Workflow = fallback ?? {
    id: "draft",
    title: "Untitled",
    kind: "ranking",
    format: "9:16",
    duration: 20,
    hook: "",
    host: "host",
    language: "en",
    music: "bed",
    narration: [],
    ranks: [],
    reveals: [],
    broll: [],
  };

  const next: Workflow = {
    ...base,
    narration: [],
    ranks: [],
    reveals: [],
    broll: [],
  };

  let section: "none" | "narration" | "ranks" | "reveals" | "broll" = "none";

  for (const raw of source.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    if (line === "narration:") {
      section = "narration";
      continue;
    }
    if (line === "ranks:") {
      section = "ranks";
      continue;
    }
    if (line === "reveals:") {
      section = "reveals";
      continue;
    }
    if (line === "broll:") {
      section = "broll";
      continue;
    }

    if (line.startsWith("- ")) {
      const value = line.slice(2).trim();
      if (section === "narration") next.narration.push(value);
      else if (section === "ranks") next.ranks.push(parseRank(value));
      else if (section === "reveals") next.reveals.push(value);
      else if (section === "broll") next.broll.push(value);
      continue;
    }

    const colon = line.indexOf(":");
    if (colon <= 0) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    section = "none";

    switch (key) {
      case "id":
        next.id = value || next.id;
        break;
      case "kind":
        next.kind = asKind(value, next.kind);
        break;
      case "title":
        next.title = value || next.title;
        break;
      case "format":
        if (value === "9:16" || value === "16:9" || value === "1:1") next.format = value;
        break;
      case "duration": {
        const n = Number(value);
        if (Number.isFinite(n) && n > 0) next.duration = n;
        break;
      }
      case "hook":
        next.hook = value;
        break;
      case "host":
        next.host = value;
        break;
      case "host_b":
        next.hostB = value;
        break;
      case "product":
        next.product = value;
        break;
      case "language":
        next.language = value;
        break;
      case "music":
        next.music = value;
        break;
      default:
        break;
    }
  }

  if (!next.narration.length) next.narration = base.narration;
  if (!next.ranks.length) next.ranks = base.ranks;
  if (!next.reveals.length) next.reveals = base.reveals;
  if (!next.broll.length) next.broll = base.broll;

  return next;
}

function parseRank(value: string): RankItem {
  const [tier, ...rest] = value.split("|");
  return {
    tier: (tier ?? "C").trim() || "C",
    label: rest.join("|").trim() || value,
  };
}

export function applyPatch(
  wf: Workflow,
  patch: Partial<Workflow> & { ranks?: RankItem[] },
): Workflow {
  return {
    ...wf,
    ...patch,
    narration: patch.narration ?? wf.narration,
    ranks: patch.ranks ?? wf.ranks,
    reveals: patch.reveals ?? wf.reveals,
    broll: patch.broll ?? wf.broll,
  };
}

export function wordsFromNarration(lines: string[]): string[] {
  return lines
    .join(" ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}
