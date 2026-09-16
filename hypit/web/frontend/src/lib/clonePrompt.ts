import type { FormatKind, Workflow } from "../types";
import { serializeWorkflow } from "./workflow";
import { TEMPLATES } from "./templates";

const RANKING_HINT = /rank|tier|goat|s\s*tier|排行|梯队|对比|vs/i;
const PODCAST_HINT = /podcast|播客|对峙|roast|产品|creatine|retinol/i;
const INTERVIEW_HINT = /interview|街头|采访|rules?|百万|million|lambo/i;

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "clone"
  );
}

function pickKind(prompt: string): FormatKind {
  if (INTERVIEW_HINT.test(prompt) && !RANKING_HINT.test(prompt)) return "interview";
  if (PODCAST_HINT.test(prompt) && !RANKING_HINT.test(prompt)) return "podcast";
  if (RANKING_HINT.test(prompt)) return "ranking";
  if (INTERVIEW_HINT.test(prompt)) return "interview";
  if (PODCAST_HINT.test(prompt)) return "podcast";
  return "ranking";
}

function extractPairs(prompt: string): [string, string] {
  const vs = prompt.split(/\bvs\.?\b|对比|和|与/i).map((s) => s.trim());
  if (vs.length >= 2) {
    const a = lastWord(vs[0]!);
    const b = lastWord(vs[1]!.split(/[,，.。]/)[0] ?? vs[1]!);
    return [a || "Hypit", b || "CapCut"];
  }
  return ["Hypit", "CapCut"];
}

function lastWord(value: string): string {
  const cleaned = value
    .replace(/\b(clone|this|video|the|a|an|to|board|swap|ranking)\b/gi, " ")
    .replace(/[把这个视频]/g, " ")
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  return (parts[parts.length - 1] ?? cleaned).slice(0, 18);
}

export function cloneFromPrompt(prompt: string): { source: string; kind: FormatKind } {
  const kind = pickKind(prompt);
  const [left, right] = extractPairs(prompt);
  const title = `${left} vs ${right}`;

  let wf: Workflow;
  if (kind === "podcast") {
    wf = {
      id: slug(title),
      title: title.toUpperCase(),
      kind,
      format: "9:16",
      duration: 18,
      hook: `You skip ${left}?`,
      host: "host-a",
      hostB: "host-b",
      product: left,
      language: /[\u4e00-\u9fff]/.test(prompt) ? "zh" : "en",
      music: "podcast-bed",
      narration: [
        `You skip ${left}?`,
        `That's why ${right} still looks unfinished.`,
        `Ship the workflow. Now.`,
      ],
      ranks: [],
      reveals: ["handoff", "product hero"],
      broll: ["talking heads", "product insert", "cta sting"],
    };
  } else if (kind === "interview") {
    wf = {
      id: slug(title),
      title: title.toUpperCase(),
      kind,
      format: "9:16",
      duration: 26,
      hook: `Three rules for ${left}`,
      host: "street-host",
      product: right,
      language: /[\u4e00-\u9fff]/.test(prompt) ? "zh" : "en",
      music: "bass-drop",
      narration: [
        `Nice setup. How did ${left} win?`,
        "Rule one: clone the structure.",
        "Rule two: swap only the payload.",
        "Rule three: ship a hundred variants.",
      ],
      ranks: [],
      reveals: ["Clone the structure", "Swap the payload", "Ship 100 variants"],
      broll: ["street mic", "product flash", "crowd reaction"],
    };
  } else {
    wf = {
      id: slug(title),
      title: title.toUpperCase(),
      kind: "ranking",
      format: "9:16",
      duration: 20,
      hook: `${left} vs ${right}`,
      host: "street-host",
      language: /[\u4e00-\u9fff]/.test(prompt) ? "zh" : "en",
      music: "trap-hook",
      narration: [
        `Who belongs in S?`,
        `${left} belongs in S.`,
        `${right} belongs in D.`,
      ],
      ranks: [
        { tier: "S", label: left },
        { tier: "A", label: "Runway" },
        { tier: "B", label: "Pika" },
        { tier: "D", label: right },
      ],
      reveals: [],
      broll: ["hook sting", "board slam", "cta flash"],
    };
  }

  return { source: serializeWorkflow(wf), kind: wf.kind };
}

export function defaultSource(): string {
  return TEMPLATES[0]!.source;
}
