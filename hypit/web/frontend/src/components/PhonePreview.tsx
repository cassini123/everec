import { useEffect, useMemo, useState } from "react";
import type { RankItem, Workflow } from "../types";
import { wordsFromNarration } from "../lib/workflow";

interface Props {
  workflow: Workflow;
  playing: boolean;
  onTogglePlay: () => void;
}

const TIER_COLOR: Record<string, string> = {
  S: "#c8f542",
  A: "#22d3ee",
  B: "#fbbf24",
  C: "#fb923c",
  D: "#ff4d8d",
};

function hostEmoji(name: string): string {
  const key = name.toLowerCase();
  if (key.includes("banana")) return "🍌";
  if (key.includes("cat")) return "🐱";
  if (key.includes("pepe")) return "🐸";
  if (key.includes("doge")) return "🐶";
  if (key.includes("wojak")) return "😔";
  if (key.includes("chad")) return "🗿";
  if (key.includes("barbie") || key.includes("pretty")) return "💅";
  if (key.includes("kid") || key.includes("phd")) return "🤓";
  if (key.includes("jock") || key.includes("muscle")) return "💪";
  if (key.includes("mob") || key.includes("wife")) return "🖤";
  if (key.includes("ada")) return "🏎️";
  if (key.includes("leon")) return "🎤";
  if (key.includes("tech")) return "💻";
  return "🎬";
}

export function PhonePreview({ workflow, playing, onTogglePlay }: Props) {
  const [t, setT] = useState(0);
  const words = useMemo(() => wordsFromNarration(workflow.narration), [workflow.narration]);
  const duration = Math.max(workflow.duration, 8);

  useEffect(() => {
    setT(0);
  }, [workflow.id, workflow.title, workflow.host, workflow.hook]);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setT((prev) => {
        const next = prev + dt;
        return next >= duration ? 0 : next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);

  const progress = t / duration;
  const wordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));
  const rankIndex = Math.min(
    workflow.ranks.length - 1,
    Math.floor(progress * workflow.ranks.length),
  );
  const revealIndex = Math.min(
    workflow.reveals.length - 1,
    Math.floor(progress * Math.max(workflow.reveals.length, 1)),
  );

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4 py-5">
      <div className="phone-glow relative aspect-[9/16] h-full max-h-[min(720px,calc(100%-4.5rem))] overflow-hidden rounded-[2rem] border border-white/10 bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,77,141,0.22),transparent_42%),radial-gradient(circle_at_80%_90%,rgba(34,211,238,0.16),transparent_40%)]" />
        <div className="relative flex h-full flex-col p-4">
          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-white/55">
            <span>{workflow.kind}</span>
            <span>{workflow.format}</span>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-xl">
              {hostEmoji(workflow.host)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{workflow.host}</div>
              <div className="truncate text-[11px] text-white/55">
                {workflow.music} · {workflow.language}
              </div>
            </div>
          </div>

          <div className="mb-4 rounded-2xl bg-white/8 px-3 py-2 text-center text-lg font-bold leading-tight">
            {workflow.hook || workflow.title}
          </div>

          <div className="min-h-0 flex-1">
            {workflow.kind === "ranking" && (
              <RankingBoard ranks={workflow.ranks} active={rankIndex} />
            )}
            {workflow.kind === "podcast" && (
              <PodcastSplit
                hostA={workflow.host}
                hostB={workflow.hostB ?? "guest"}
                product={workflow.product ?? "product"}
                progress={progress}
              />
            )}
            {workflow.kind === "interview" && (
              <RevealBoard
                reveals={workflow.reveals}
                active={revealIndex}
                product={workflow.product}
              />
            )}
          </div>

          <div className="mt-3 min-h-[3.2rem]">
            <Karaoke words={words} active={Math.max(0, wordIndex)} />
          </div>
        </div>
      </div>

      <div className="flex w-full max-w-[280px] items-center gap-3">
        <button
          type="button"
          onClick={onTogglePlay}
          className="rounded-full bg-hp-accent px-4 py-1.5 text-xs font-semibold text-white"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-hp-lime"
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
        <span className="w-10 text-right font-mono text-[11px] text-hp-muted">
          {t.toFixed(1)}s
        </span>
      </div>
    </div>
  );
}

function RankingBoard({ ranks, active }: { ranks: RankItem[]; active: number }) {
  return (
    <div className="flex h-full flex-col gap-2">
      {ranks.map((rank, i) => {
        const color = TIER_COLOR[rank.tier] ?? "#fff";
        const on = i <= active;
        return (
          <div
            key={`${rank.tier}-${rank.label}`}
            className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 ${
              i === active ? "tier-flash" : ""
            }`}
            style={{
              borderColor: on ? color : "rgba(255,255,255,0.08)",
              background: on ? `${color}22` : "rgba(255,255,255,0.04)",
              opacity: on ? 1 : 0.35,
            }}
          >
            <span className="w-8 text-lg font-black" style={{ color }}>
              {rank.tier}
            </span>
            <span className="text-sm font-semibold">{rank.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function PodcastSplit({
  hostA,
  hostB,
  product,
  progress,
}: {
  hostA: string;
  hostB: string;
  product: string;
  progress: number;
}) {
  const leftTalk = progress % 0.5 < 0.28;
  return (
    <div className="flex h-full flex-col gap-2">
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
        <TalkCard name={hostA} emoji={hostEmoji(hostA)} active={leftTalk} accent="#ff4d8d" />
        <TalkCard name={hostB} emoji={hostEmoji(hostB)} active={!leftTalk} accent="#22d3ee" />
      </div>
      <div className="rounded-2xl border border-hp-lime/40 bg-hp-lime/15 px-3 py-2 text-center text-sm font-semibold text-hp-lime">
        {progress > 0.62 ? `${product} handoff` : product}
      </div>
    </div>
  );
}

function TalkCard({
  name,
  emoji,
  active,
  accent,
}: {
  name: string;
  emoji: string;
  active: boolean;
  accent: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border bg-white/5"
      style={{
        borderColor: active ? accent : "rgba(255,255,255,0.08)",
        boxShadow: active ? `0 0 24px ${accent}55` : "none",
      }}
    >
      <div className="text-4xl">{emoji}</div>
      <div className="mt-2 px-2 text-center text-[11px] font-medium">{name}</div>
    </div>
  );
}

function RevealBoard({
  reveals,
  active,
  product,
}: {
  reveals: string[];
  active: number;
  product?: string;
}) {
  return (
    <div className="flex h-full flex-col gap-2">
      {product && (
        <div className="rounded-2xl bg-white/10 px-3 py-2 text-center text-xs uppercase tracking-widest text-hp-gold">
          {product}
        </div>
      )}
      {reveals.map((item, i) => {
        const on = i <= active;
        return (
          <div
            key={item}
            className="rounded-2xl border px-3 py-3 text-sm font-semibold"
            style={{
              borderColor: on ? "#c8f542" : "rgba(255,255,255,0.08)",
              background: on ? "rgba(200,245,66,0.14)" : "rgba(255,255,255,0.04)",
              opacity: on ? 1 : 0.4,
            }}
          >
            {on ? item : "██ ████"}
          </div>
        );
      })}
    </div>
  );
}

function Karaoke({ words, active }: { words: string[]; active: number }) {
  if (!words.length) return null;
  return (
    <p className="caption-pop text-center text-sm font-semibold leading-relaxed">
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="mx-0.5 inline-block"
          style={{ color: i === active ? "#c8f542" : i < active ? "#fff" : "rgba(255,255,255,0.35)" }}
        >
          {word}
        </span>
      ))}
    </p>
  );
}
