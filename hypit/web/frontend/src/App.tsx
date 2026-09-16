import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Clapperboard,
  Copy,
  Play,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";
import { PhonePreview } from "./components/PhonePreview";
import { SourceEditor } from "./components/SourceEditor";
import { cloneFromPrompt } from "./lib/clonePrompt";
import { loadProjects, saveProject, type StoredProject } from "./lib/projectStore";
import { TEMPLATES } from "./lib/templates";
import { applyPatch, parseWorkflow, serializeWorkflow } from "./lib/workflow";
import type { TemplatePack } from "./types";

type Screen = "home" | "studio";

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [prompt, setPrompt] = useState("");
  const [source, setSource] = useState(TEMPLATES[0]!.source);
  const [packId, setPackId] = useState(TEMPLATES[0]!.id);
  const [playing, setPlaying] = useState(true);
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  const pack = TEMPLATES.find((t) => t.id === packId) ?? TEMPLATES[0]!;
  const workflow = useMemo(() => parseWorkflow(source), [source]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(id);
  }, [toast]);

  const openPack = (next: TemplatePack) => {
    setPackId(next.id);
    setSource(next.source);
    setPlaying(true);
    setScreen("studio");
  };

  const runClone = () => {
    const text = prompt.trim();
    if (!text) return;
    const result = cloneFromPrompt(text);
    const matched =
      TEMPLATES.find((t) => t.kind === result.kind) ?? TEMPLATES[0]!;
    setPackId(matched.id);
    setSource(result.source);
    setPlaying(true);
    setScreen("studio");
    setToast("已从描述生成可复用工作流");
  };

  const persist = () => {
    const list = saveProject({
      id: workflow.id,
      name: workflow.title,
      source,
      updatedAt: new Date().toISOString(),
    });
    setProjects(list);
    setToast("已保存到本机项目");
  };

  const copySource = async () => {
    await navigator.clipboard.writeText(source);
    setToast("工作流源码已复制");
  };

  const shipSimcut = () => {
    localStorage.setItem(
      "everec-hypit-handoff",
      JSON.stringify({
        title: workflow.title,
        kind: workflow.kind,
        source,
        at: new Date().toISOString(),
      }),
    );
    setToast("已写入交接包，可在 Simcut 继续精剪");
  };

  return (
    <div className="flex h-full flex-col bg-hp-bg">
      {screen === "home" ? (
        <HomeView
          prompt={prompt}
          onPrompt={setPrompt}
          onClone={runClone}
          onOpen={openPack}
          projects={projects}
          onOpenProject={(p) => {
            setSource(p.source);
            setPackId(
              TEMPLATES.find((t) => p.source.includes(`kind: ${t.kind}`))?.id ??
                TEMPLATES[0]!.id,
            );
            setScreen("studio");
          }}
        />
      ) : (
        <StudioView
          pack={pack}
          source={source}
          onSource={setSource}
          playing={playing}
          onTogglePlay={() => setPlaying((v) => !v)}
          onBack={() => setScreen("home")}
          onSave={persist}
          onCopy={copySource}
          onShip={shipSimcut}
          onApplyVariant={(id) => {
            const variant = pack.variants.find((v) => v.id === id);
            if (!variant) return;
            const next = applyPatch(parseWorkflow(pack.source), variant.patch);
            setSource(serializeWorkflow(next));
            setPlaying(true);
            setToast(`已套用变体：${variant.name}`);
          }}
        />
      )}
      {toast && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-hp-elevated px-4 py-2 text-sm text-hp-text shadow-lg ring-1 ring-hp-border">
          {toast}
        </div>
      )}
    </div>
  );
}

function HomeView({
  prompt,
  onPrompt,
  onClone,
  onOpen,
  projects,
  onOpenProject,
}: {
  prompt: string;
  onPrompt: (v: string) => void;
  onClone: () => void;
  onOpen: (pack: TemplatePack) => void;
  projects: StoredProject[];
  onOpenProject: (p: StoredProject) => void;
}) {
  return (
    <div className="flex-1 overflow-auto">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-hp-accent/15 text-hp-accent">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide">Hypit</div>
            <div className="text-xs text-hp-muted">Everec · 爆款克隆工作流</div>
          </div>
        </div>
        <a
          href="https://github.com/hypit-ai/hypit"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-hp-muted hover:text-hp-text"
        >
          灵感来自 hypit-ai/hypit
        </a>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-10">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight">
          克隆整条爆款工作流，而不是只拆脚本
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-hp-muted">
          锚点在词上，不在秒上。换主持、换产品、换语言，结构留下。一条工作流可以长出一百个变体，再交到 Simcut 精剪。
        </p>

        <form
          className="mt-8 flex flex-col gap-3 rounded-2xl border border-hp-border bg-hp-surface p-3 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            onClone();
          }}
        >
          <Wand2 className="ml-2 hidden shrink-0 text-hp-accent sm:block" size={18} />
          <input
            value={prompt}
            onChange={(e) => onPrompt(e.target.value)}
            placeholder="Clone this ranking video, swap the board to Hypit vs CapCut"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-hp-muted"
          />
          <button
            type="submit"
            className="rounded-xl bg-hp-accent px-4 py-2 text-sm font-medium text-white"
          >
            生成工作流
          </button>
        </form>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {TEMPLATES.map((pack) => (
            <button
              key={pack.id}
              type="button"
              onClick={() => onOpen(pack)}
              className="rounded-2xl border border-hp-border bg-hp-surface p-5 text-left transition hover:border-hp-accent/40 hover:bg-hp-panel"
            >
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-hp-muted">
                <span>{pack.tag}</span>
                <span>{pack.cost}</span>
              </div>
              <div className="mt-3 text-lg font-semibold">{pack.name}</div>
              <p className="mt-2 text-sm leading-relaxed text-hp-muted">{pack.description}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-hp-accent">
                <Play size={14} />
                打开源码 + 预览
              </div>
            </button>
          ))}
        </div>

        {projects.length > 0 && (
          <div className="mt-10">
            <h2 className="text-sm font-medium text-hp-muted">最近保存</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpenProject(p)}
                  className="rounded-full border border-hp-border bg-hp-panel px-3 py-1.5 text-xs hover:border-hp-accent/50"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function StudioView({
  pack,
  source,
  onSource,
  playing,
  onTogglePlay,
  onBack,
  onSave,
  onCopy,
  onShip,
  onApplyVariant,
}: {
  pack: TemplatePack;
  source: string;
  onSource: (v: string) => void;
  playing: boolean;
  onTogglePlay: () => void;
  onBack: () => void;
  onSave: () => void;
  onCopy: () => void;
  onShip: () => void;
  onApplyVariant: (id: string) => void;
}) {
  const workflow = useMemo(() => parseWorkflow(source), [source]);
  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col border-b border-hp-border lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-2 border-b border-hp-border px-3 py-2.5">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg p-2 text-hp-muted hover:bg-hp-panel hover:text-hp-text"
            aria-label="返回"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{workflow.title}</div>
            <div className="truncate text-[11px] text-hp-muted">
              {workflow.kind} · {workflow.duration}s · 词锚点工作流
            </div>
          </div>
          <button
            type="button"
            onClick={onCopy}
            className="rounded-lg p-2 text-hp-muted hover:bg-hp-panel hover:text-hp-text"
            title="复制源码"
          >
            <Copy size={15} />
          </button>
          <button
            type="button"
            onClick={onSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-hp-panel px-3 py-1.5 text-xs hover:bg-hp-elevated"
          >
            <Save size={13} />
            保存
          </button>
          <button
            type="button"
            onClick={onShip}
            className="inline-flex items-center gap-1.5 rounded-lg bg-hp-accent px-3 py-1.5 text-xs font-medium text-white"
          >
            <Clapperboard size={13} />
            交到 Simcut
          </button>
        </div>
        <div className="min-h-0 flex-1 p-3">
          <SourceEditor value={source} onChange={onSource} />
        </div>
        <div className="border-t border-hp-border px-3 py-3">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-hp-muted">
            同一结构，三个变体
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {pack.variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => onApplyVariant(variant.id)}
                className="rounded-xl border border-hp-border bg-hp-surface p-3 text-left hover:border-hp-accent/40"
              >
                <div className="text-sm font-medium">{variant.name}</div>
                <div className="mt-1 text-xs text-hp-muted">{variant.blurb}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="h-[420px] shrink-0 bg-black/40 lg:h-auto lg:w-[min(42%,420px)]">
        <PhonePreview
          key={`${workflow.id}-${workflow.host}-${workflow.hook}`}
          workflow={workflow}
          playing={playing}
          onTogglePlay={onTogglePlay}
        />
      </div>
    </div>
  );
}
