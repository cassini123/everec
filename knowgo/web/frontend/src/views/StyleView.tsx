import { useEffect, useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  Film,
  ImageIcon,
  Layers,
  Loader2,
  Palette,
  RefreshCw,
  Sparkles,
  Type,
  Wand2,
} from "lucide-react";
import type { KnowgoProject } from "../types";
import { api, saveStyleGuide } from "../lib/api";

interface StyleViewProps {
  project: KnowgoProject;
  onUpdate: (p: KnowgoProject) => void;
}

interface StyleRecommendation {
  id: string;
  name: string;
  englishName: string;
  category: string;
  imageTitle: string;
  summary: string;
  keywords: string[];
  palette: string[];
}

const STYLE_RECOMMENDATIONS: StyleRecommendation[] = [
  {
    id: "neo-brutalism",
    name: "新粗野主义",
    englishName: "Neo-Brutalism",
    category: "数字界面 / 海报",
    imageTitle: "经典图像：高对比硬边网格海报",
    summary: "粗黑描边、强烈撞色、裸露阴影和故意保留的“未修饰”结构感。",
    keywords: ["硬边", "撞色", "粗描边"],
    palette: ["#ff4f00", "#ffe500", "#111111", "#f5f0e8"],
  },
  {
    id: "bauhaus",
    name: "包豪斯",
    englishName: "Bauhaus",
    category: "现代主义 / 平面",
    imageTitle: "经典图像：几何基础形态与原色构图",
    summary: "圆形、三角形、矩形和原色建立理性秩序，强调功能与形式统一。",
    keywords: ["几何", "原色", "理性"],
    palette: ["#e3342f", "#f2c94c", "#2f80ed", "#101010"],
  },
  {
    id: "rococo",
    name: "洛可可",
    englishName: "Rococo",
    category: "装饰艺术 / 室内",
    imageTitle: "经典图像：粉彩贝壳曲线与华丽室内",
    summary: "粉彩、贝壳纹、卷草和轻盈曲线，适合柔美、精致、梦幻的视觉叙事。",
    keywords: ["粉彩", "曲线", "繁饰"],
    palette: ["#f7c6d9", "#f8ead8", "#b5d8d6", "#d6b56d"],
  },
  {
    id: "baroque",
    name: "巴洛克",
    englishName: "Baroque",
    category: "戏剧视觉 / 影像",
    imageTitle: "经典图像：强明暗与戏剧性斜线构图",
    summary: "强烈明暗对比、金色装饰和动态斜线，制造宏大、戏剧化的情绪张力。",
    keywords: ["明暗法", "戏剧", "金色"],
    palette: ["#120b08", "#6b1f13", "#d6a441", "#f2eadf"],
  },
  {
    id: "mondrian",
    name: "蒙德里安 / 风格派",
    englishName: "De Stijl",
    category: "抽象艺术 / 网格",
    imageTitle: "经典图像：红黄蓝黑白格构图",
    summary: "黑色网格切分空间，以红黄蓝和留白形成高度秩序化的抽象平衡。",
    keywords: ["网格", "三原色", "抽象"],
    palette: ["#f4f1e8", "#d91e18", "#f7d51d", "#0f4c81"],
  },
  {
    id: "art-nouveau",
    name: "新艺术运动",
    englishName: "Art Nouveau",
    category: "海报 / 插画",
    imageTitle: "经典图像：穆夏式植物曲线海报",
    summary: "植物藤蔓、女性轮廓和流动线条，适合优雅、自然、手工感的画面。",
    keywords: ["植物", "流线", "海报"],
    palette: ["#5f7f5f", "#d9b88f", "#f3ead7", "#8f4f3f"],
  },
  {
    id: "art-deco",
    name: "装饰艺术",
    englishName: "Art Deco",
    category: "奢华 / 建筑",
    imageTitle: "经典图像：放射线与阶梯式金色装饰",
    summary: "对称、放射线、阶梯形和金属质感，传达都市、奢华、速度与现代感。",
    keywords: ["对称", "金属", "放射"],
    palette: ["#101820", "#d4af37", "#0f4c5c", "#f5f1e6"],
  },
  {
    id: "swiss",
    name: "瑞士国际主义",
    englishName: "Swiss Style",
    category: "信息设计 / 排版",
    imageTitle: "经典图像：网格海报与无衬线大标题",
    summary: "严格网格、非对称排版、无衬线字体和摄影裁切，强调信息清晰度。",
    keywords: ["网格", "无衬线", "留白"],
    palette: ["#f4f4f0", "#111111", "#e31b23", "#8f9aa3"],
  },
  {
    id: "constructivism",
    name: "构成主义",
    englishName: "Constructivism",
    category: "政治海报 / 动势",
    imageTitle: "经典图像：红黑斜切宣传海报",
    summary: "斜向构图、几何拼贴和红黑高反差，形成强烈动员感和机械力量。",
    keywords: ["斜线", "拼贴", "动员"],
    palette: ["#d71920", "#111111", "#f1e3c6", "#8c8c8c"],
  },
  {
    id: "memphis",
    name: "孟菲斯",
    englishName: "Memphis",
    category: "80s 图案 / 产品",
    imageTitle: "经典图像：彩色几何图案与不规则散点",
    summary: "明亮色块、随意图案、塑料感和反功能主义趣味，适合年轻活泼表达。",
    keywords: ["几何", "趣味", "80s"],
    palette: ["#00b8d9", "#ff2e88", "#ffd400", "#111111"],
  },
  {
    id: "minimalism",
    name: "极简主义",
    englishName: "Minimalism",
    category: "品牌 / 界面",
    imageTitle: "经典图像：大面积留白与单一焦点",
    summary: "减少装饰，依靠留白、精确比例和单一视觉焦点建立高级与安静感。",
    keywords: ["留白", "秩序", "克制"],
    palette: ["#f5f2eb", "#d8d2c4", "#222222", "#ffffff"],
  },
  {
    id: "pop-art",
    name: "波普艺术",
    englishName: "Pop Art",
    category: "商业图像 / 漫画",
    imageTitle: "经典图像：半色调漫画与高饱和色块",
    summary: "漫画网点、重复图像、广告语和高饱和色，带来大众文化和消费符号感。",
    keywords: ["半色调", "漫画", "高饱和"],
    palette: ["#ffdd00", "#ef3340", "#009fe3", "#111111"],
  },
  {
    id: "futurism",
    name: "未来主义",
    englishName: "Futurism",
    category: "速度 / 科技",
    imageTitle: "经典图像：速度线与机械动势",
    summary: "速度线、重复残影和金属角度，强调机械、运动、冲刺和未来想象。",
    keywords: ["速度", "机械", "残影"],
    palette: ["#1c1f26", "#c7cedb", "#ff3b30", "#f4a261"],
  },
  {
    id: "cyberpunk",
    name: "赛博朋克",
    englishName: "Cyberpunk",
    category: "科幻 / 夜景",
    imageTitle: "经典图像：霓虹城市与高科技低生活",
    summary: "霓虹紫蓝、雨夜反光、密集广告和赛博界面，适合未来都市叙事。",
    keywords: ["霓虹", "夜景", "界面"],
    palette: ["#07111f", "#00f5ff", "#ff2bd6", "#f8f32b"],
  },
  {
    id: "vaporwave",
    name: "蒸汽波",
    englishName: "Vaporwave",
    category: "复古数字 / 音乐",
    imageTitle: "经典图像：复古电脑、雕塑与粉紫渐变",
    summary: "90 年代电脑美学、网格地平线、古典雕塑和粉紫青渐变的怀旧幻觉。",
    keywords: ["复古", "渐变", "网格"],
    palette: ["#ff71ce", "#b967ff", "#01cdfe", "#f8f8f2"],
  },
];

export function StyleView({ project, onUpdate }: StyleViewProps) {
  const style = project.styleGuide;
  const [loading, setLoading] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [previewShort, setPreviewShort] = useState<string | null>(null);
  const [projects, setProjects] = useState<KnowgoProject[]>([project]);
  const [selectedProjectId, setSelectedProjectId] = useState(project.id);

  useEffect(() => {
    setSelectedProjectId(project.id);
  }, [project.id]);

  useEffect(() => {
    let ignored = false;

    api
      .listProjects()
      .then((items) => {
        if (!ignored) setProjects(items.length > 0 ? items : [project]);
      })
      .catch(() => {
        if (!ignored) setProjects([project]);
      });

    return () => {
      ignored = true;
    };
  }, [project]);

  const refreshStyle = async () => {
    setLoading(true);
    try {
      const hint = `${project.brief.tone} ${project.brief.references} ${project.captures.map((c) => c.title).join(" ")}`;
      const keywords = project.captures.flatMap((c) => [c.title, c.platform ?? ""]).filter(Boolean);
      const guide = await api.analyzeStyle(project.id, hint, keywords);
      const updated = await saveStyleGuide(project.id, guide);
      onUpdate(updated);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSelect = async (projectId: string) => {
    setSelectedProjectId(projectId);
    if (projectId === project.id) return;

    setProjectLoading(true);
    try {
      const nextProject = await api.getProject(projectId);
      onUpdate(nextProject);
    } catch (err) {
      console.error(err);
      setSelectedProjectId(project.id);
    } finally {
      setProjectLoading(false);
    }
  };

  const activeShort = style.similarShorts.find((s) => s.id === previewShort);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto">
      <div className="flex items-center justify-between border-b border-kg-border bg-kg-panel px-6 py-3">
        <div>
          <h2 className="text-lg font-semibold">风格体系</h2>
          <p className="text-xs text-kg-muted">
            整体风格关键词 · 字体预览 · 海报风格 · 特效参考 · 相似短片
          </p>
        </div>
        <button
          type="button"
          onClick={refreshStyle}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-kg-border px-4 py-2 text-xs hover:bg-kg-elevated disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          重新生成
        </button>
      </div>

      <div className="mx-auto w-full max-w-5xl space-y-8 p-6">
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="rounded-xl border border-kg-border bg-kg-panel p-5 lg:col-span-2">
            <SectionTitle icon={Layers} title="项目风格体系" />
            <label className="mt-4 block text-xs text-kg-muted" htmlFor="style-project">
              项目归属
            </label>
            <div className="relative mt-2">
              <select
                id="style-project"
                value={selectedProjectId}
                disabled={projectLoading}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full appearance-none rounded-lg border border-kg-border bg-kg-bg px-3 py-2.5 pr-9 text-sm outline-none transition focus:border-kg-accent disabled:opacity-60"
              >
                {projects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title || item.brief.title || "未命名项目"}
                  </option>
                ))}
              </select>
              {projectLoading ? (
                <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-kg-muted" />
              ) : (
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kg-muted" />
              )}
            </div>
            <div className="mt-4 rounded-lg border border-kg-border bg-kg-bg/60 p-4">
              <div className="text-xs text-kg-muted">当前风格体系</div>
              <div className="mt-1 text-base font-semibold">
                {project.title || project.brief.title || "未命名项目"}
              </div>
              <div className="mt-2 text-xs text-kg-muted">
                更新于 {new Date(project.updatedAt).toLocaleString("zh-CN")}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <StyleMetric label="关键词" value={style.keywords.length + style.moodTags.length} />
              <StyleMetric label="灵感素材" value={project.captures.length} />
              <StyleMetric label="字体方案" value={style.fonts.length} />
              <StyleMetric label="特效参考" value={style.vfxRecommendations.length} />
            </div>
          </div>

          <div className="rounded-xl border border-kg-border bg-kg-panel p-5 lg:col-span-3">
            <SectionTitle icon={ImageIcon} title="风格体系推荐" />
            <p className="mt-3 text-sm leading-6 text-kg-muted">
              15 个可作为项目视觉母题的经典风格参考，适合在生成海报、字体、动效和分镜时作为方向提示。
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {STYLE_RECOMMENDATIONS.slice(0, 4).map((item) => (
                <CompactStyleReference key={item.id} recommendation={item} />
              ))}
            </div>
          </div>
        </section>

        <section>
          <SectionTitle icon={ImageIcon} title="15 个经典风格参考" />
          <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {STYLE_RECOMMENDATIONS.map((item) => (
              <StyleRecommendationCard key={item.id} recommendation={item} />
            ))}
          </div>
        </section>

        <section>
          <SectionTitle icon={Sparkles} title="整体风格关键词" />
          <div className="mt-3 flex flex-wrap gap-2">
            {style.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-kg-accent/15 px-3 py-1.5 text-sm text-kg-accent"
              >
                {kw}
              </span>
            ))}
            {style.moodTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-kg-purple/15 px-3 py-1.5 text-sm text-kg-purple"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle icon={Type} title="推荐字体（预览）" />
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {style.fonts.map((font) => (
              <div
                key={font.name}
                className="font-preview-card rounded-xl border border-kg-border p-5"
              >
                <div className="text-xs text-kg-muted">{font.category}</div>
                <div
                  className="mt-3 text-2xl font-semibold leading-tight"
                  style={{ fontFamily: font.cssFamily }}
                >
                  {font.previewText}
                </div>
                <div className="mt-2 text-sm font-medium">{font.name}</div>
                <p className="mt-1 text-xs text-kg-muted">{font.usage}</p>
                {font.googleFontUrl && (
                  <a
                    href={font.googleFontUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[11px] text-kg-blue hover:underline"
                  >
                    Google Fonts <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle icon={Palette} title="海报风格" />
          <div className="mt-3 rounded-xl border border-kg-border bg-kg-panel p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs text-kg-muted">布局</div>
                <div className="mt-1 text-sm">{style.posterStyle.layout}</div>
                <div className="mt-4 text-xs text-kg-muted">构图</div>
                <div className="mt-1 text-sm">{style.posterStyle.composition}</div>
                <div className="mt-4 text-xs text-kg-muted">字体组合</div>
                <div className="mt-1 text-sm">{style.posterStyle.typography}</div>
              </div>
              <div>
                <div className="text-xs text-kg-muted">色板</div>
                <div className="mt-2 flex gap-2">
                  {style.posterStyle.colorScheme.map((c) => (
                    <div key={c} className="flex flex-col items-center gap-1">
                      <div
                        className="h-12 w-12 rounded-lg border border-kg-border"
                        style={{ background: c }}
                      />
                      <span className="font-mono text-[10px]">{c}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs text-kg-muted">
                  {style.posterStyle.referenceDescription}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle icon={Wand2} title="特效实现（参考）" />
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            {style.vfxRecommendations.map((vfx) => (
              <div
                key={vfx.name}
                className="overflow-hidden rounded-xl border border-kg-border bg-kg-panel"
              >
                <img
                  src={vfx.referenceImageUrl}
                  alt={vfx.name}
                  className="h-36 w-full object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{vfx.name}</div>
                    <span className="rounded bg-kg-elevated px-2 py-0.5 text-[10px] uppercase text-kg-muted">
                      {vfx.difficulty}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-kg-muted">{vfx.description}</p>
                  <div className="mt-2 text-[11px] text-kg-text">
                    {vfx.tools.join(" · ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle icon={Film} title="相似短片推荐" />
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              {style.similarShorts.map((short) => (
                <button
                  key={short.id}
                  type="button"
                  onClick={() => setPreviewShort(short.id)}
                  className={`flex w-full gap-3 rounded-lg border p-3 text-left transition ${
                    previewShort === short.id
                      ? "border-kg-accent bg-kg-accent/10"
                      : "border-kg-border bg-kg-panel hover:border-kg-accent/40"
                  }`}
                >
                  <img
                    src={short.previewUrl}
                    alt=""
                    className="h-14 w-24 shrink-0 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{short.title}</span>
                      <span className="shrink-0 text-xs text-kg-accent">
                        {Math.round(short.similarity * 100)}%
                      </span>
                    </div>
                    <div className="text-xs text-kg-muted">
                      {short.director} · {short.year}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {short.styleTags.map((t) => (
                        <span key={t} className="text-[10px] text-kg-muted">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-kg-border bg-kg-panel p-4">
              {activeShort ? (
                <>
                  <div className="aspect-video overflow-hidden rounded-lg bg-kg-bg">
                    <img
                      src={activeShort.previewUrl}
                      alt={activeShort.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold">{activeShort.title}</h3>
                    <p className="text-sm text-kg-muted">
                      {activeShort.director} · {activeShort.year}
                    </p>
                    <a
                      href={activeShort.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-kg-accent px-4 py-2 text-sm font-medium text-kg-bg hover:bg-kg-accent-dim"
                    >
                      观看 / 搜索
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </>
              ) : (
                <div className="flex h-full min-h-48 items-center justify-center text-sm text-kg-muted">
                  点击左侧短片查看预览
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function StyleMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-kg-border bg-kg-elevated/60 px-3 py-2">
      <div className="text-lg font-semibold text-kg-text">{value}</div>
      <div className="text-kg-muted">{label}</div>
    </div>
  );
}

function CompactStyleReference({
  recommendation,
}: {
  recommendation: StyleRecommendation;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-kg-border bg-kg-bg/60 p-2">
      <img
        src={svgToDataUri(buildStyleReferenceSvg(recommendation))}
        alt={recommendation.imageTitle}
        className="h-16 w-20 shrink-0 rounded object-cover"
      />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{recommendation.name}</div>
        <div className="text-[11px] text-kg-muted">{recommendation.englishName}</div>
        <div className="mt-1 flex gap-1">
          {recommendation.palette.slice(0, 4).map((color) => (
            <span
              key={color}
              className="h-2.5 w-2.5 rounded-full border border-white/15"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StyleRecommendationCard({
  recommendation,
}: {
  recommendation: StyleRecommendation;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-kg-border bg-kg-panel">
      <img
        src={svgToDataUri(buildStyleReferenceSvg(recommendation))}
        alt={recommendation.imageTitle}
        className="h-36 w-full object-cover"
      />
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{recommendation.name}</h3>
            <p className="text-xs text-kg-muted">{recommendation.englishName}</p>
          </div>
          <span className="shrink-0 rounded-full bg-kg-elevated px-2 py-0.5 text-[10px] text-kg-muted">
            {recommendation.category}
          </span>
        </div>
        <p className="mt-3 text-xs leading-5 text-kg-muted">{recommendation.imageTitle}</p>
        <p className="mt-2 text-sm leading-6">{recommendation.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {recommendation.keywords.map((keyword) => (
            <span
              key={keyword}
              className="rounded-full bg-kg-accent/10 px-2 py-0.5 text-[11px] text-kg-accent"
            >
              {keyword}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: typeof Sparkles;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-kg-muted">
      <Icon className="h-4 w-4 text-kg-accent" />
      {title}
    </div>
  );
}

function svgToDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildStyleReferenceSvg(recommendation: StyleRecommendation) {
  const [a, b, c, d] = recommendation.palette;

  switch (recommendation.id) {
    case "neo-brutalism":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${d}"/><rect x="52" y="48" width="280" height="184" fill="${a}" stroke="${c}" stroke-width="12"/><rect x="280" y="116" width="230" height="154" fill="${b}" stroke="${c}" stroke-width="12"/><circle cx="494" cy="82" r="46" fill="${c}"/><text x="72" y="300" font-family="Arial Black,Arial" font-size="54" fill="${c}">BOLD</text><path d="M78 82h190M78 120h132M78 158h170" stroke="${c}" stroke-width="10"/></svg>`;
    case "bauhaus":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="#f5f0e6"/><circle cx="170" cy="145" r="88" fill="${a}"/><rect x="292" y="62" width="154" height="154" fill="${b}"/><path d="M468 258 560 98 626 258Z" fill="${c}"/><path d="M92 274h360" stroke="${d}" stroke-width="18"/><text x="90" y="322" font-family="Arial Black,Arial" font-size="38" fill="${d}">BAUHAUS</text></svg>`;
    case "rococo":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><radialGradient id="r" cx="50%" cy="42%" r="65%"><stop stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient></defs><rect width="640" height="360" fill="url(#r)"/><path d="M94 260c44-124 128-184 230-148 86 30 118-18 166-76 24 86-16 164-96 188-94 30-146 10-210 78" fill="none" stroke="${d}" stroke-width="10"/><path d="M174 96c42 14 64 42 58 72-8 40-58 42-78 12-24-34 10-76 62-66" fill="none" stroke="${c}" stroke-width="8"/><circle cx="468" cy="196" r="56" fill="${b}" opacity=".55" stroke="${d}" stroke-width="8"/></svg>`;
    case "baroque":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><radialGradient id="bq" cx="36%" cy="35%" r="66%"><stop stop-color="${d}"/><stop offset=".42" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient></defs><rect width="640" height="360" fill="url(#bq)"/><path d="M68 302C210 84 382 44 572 78" stroke="${c}" stroke-width="18" fill="none"/><path d="M132 74c78 20 134 78 164 176" stroke="${d}" stroke-width="8" fill="none" opacity=".7"/><circle cx="388" cy="164" r="76" fill="${c}" opacity=".28"/><rect x="470" y="132" width="78" height="154" fill="${c}" opacity=".65"/></svg>`;
    case "mondrian":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${a}"/><path d="M170 0v360M430 0v360M0 132h640M0 260h640M520 132v228M170 72h260" stroke="#111" stroke-width="14"/><rect x="0" y="0" width="170" height="132" fill="${b}"/><rect x="430" y="0" width="210" height="132" fill="${d}"/><rect x="170" y="260" width="260" height="100" fill="${c}"/><rect x="520" y="132" width="120" height="128" fill="${b}"/></svg>`;
    case "art-nouveau":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${c}"/><path d="M106 316c84-172 176-250 276-234 84 14 132 78 144 178" fill="none" stroke="${a}" stroke-width="12"/><path d="M170 282c6-112 54-178 142-196 72-14 130 22 154 94" fill="none" stroke="${d}" stroke-width="6"/><circle cx="332" cy="160" r="54" fill="${b}" stroke="${d}" stroke-width="8"/><path d="M248 238c46-34 86-34 130 0M214 110c-40 10-70 38-90 82M500 104c46 28 70 68 72 120" stroke="${a}" stroke-width="7" fill="none"/></svg>`;
    case "art-deco":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${a}"/><path d="M320 328V42M176 328 320 42 464 328M78 328 320 42 562 328" stroke="${b}" stroke-width="8" fill="none"/><path d="M238 328V194h164v134M274 194v-72h92v72" fill="${c}" stroke="${b}" stroke-width="8"/><path d="M128 310h384M160 272h320M200 234h240" stroke="${b}" stroke-width="6"/></svg>`;
    case "swiss":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${a}"/><path d="M90 0v360M230 0v360M370 0v360M510 0v360M0 80h640M0 180h640M0 280h640" stroke="${d}" stroke-width="2"/><rect x="90" y="80" width="280" height="100" fill="${b}"/><rect x="90" y="280" width="140" height="18" fill="${c}"/><text x="88" y="244" font-family="Helvetica,Arial" font-size="58" font-weight="700" fill="${b}">grid</text><text x="374" y="130" font-family="Helvetica,Arial" font-size="30" fill="${b}">1959</text></svg>`;
    case "constructivism":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${c}"/><path d="M0 360 640 0v122L164 360Z" fill="${a}"/><path d="M0 0h248L0 210Z" fill="${b}"/><circle cx="438" cy="122" r="72" fill="none" stroke="${b}" stroke-width="16"/><text x="82" y="292" font-family="Arial Black,Arial" font-size="44" fill="${b}" transform="rotate(-26 82 292)">ACTION</text></svg>`;
    case "memphis":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="#f7f0df"/><circle cx="112" cy="94" r="48" fill="${a}"/><rect x="430" y="64" width="100" height="100" fill="${b}" transform="rotate(12 480 114)"/><path d="M260 248 342 118 424 248Z" fill="${c}" stroke="${d}" stroke-width="8"/><path d="M80 250h120M80 282h120M506 238c42 0 42 54 0 54s-42-54 0-54Z" stroke="${d}" stroke-width="8" fill="none"/><path d="M278 70v42M302 70v42M326 70v42" stroke="${b}" stroke-width="8"/></svg>`;
    case "minimalism":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${a}"/><rect x="116" y="76" width="408" height="208" rx="2" fill="${d}" stroke="${b}" stroke-width="1"/><circle cx="320" cy="180" r="46" fill="${c}"/><path d="M232 302h176" stroke="${b}" stroke-width="6"/><path d="M270 322h100" stroke="${b}" stroke-width="2"/></svg>`;
    case "pop-art":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="6" cy="6" r="5" fill="${c}"/></pattern></defs><rect width="640" height="360" fill="${a}"/><rect x="0" y="0" width="320" height="360" fill="url(#dots)"/><path d="M256 92h246c44 0 80 34 80 76s-36 76-80 76H374l-70 58 18-58h-66c-44 0-80-34-80-76s36-76 80-76Z" fill="#fff" stroke="${d}" stroke-width="10"/><text x="244" y="186" font-family="Arial Black,Arial" font-size="54" fill="${b}">WOW!</text></svg>`;
    case "futurism":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${a}"/><path d="M74 288 318 76 566 288Z" fill="${b}" opacity=".28"/><path d="M110 288 354 76M170 288 390 92M230 288 426 112M290 288 464 136" stroke="${c}" stroke-width="8"/><path d="M82 120h184M54 168h252M118 216h190" stroke="${d}" stroke-width="10"/><circle cx="470" cy="168" r="44" fill="${c}"/></svg>`;
    case "cyberpunk":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="cy" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="#1a0033"/></linearGradient></defs><rect width="640" height="360" fill="url(#cy)"/><path d="M0 288h640M70 210h58v78H70zM172 150h78v138h-78zM300 96h90v192h-90zM448 180h72v108h-72z" fill="#0d1b2a" stroke="${b}" stroke-width="4"/><path d="M40 320h560M112 288l-52 72M220 288l-18 72M320 288v72M420 288l22 72M528 288l64 72" stroke="${c}" stroke-width="3"/><text x="96" y="80" font-family="Arial Black,Arial" font-size="48" fill="${c}">NEON</text><path d="M96 92h208" stroke="${b}" stroke-width="6"/></svg>`;
    case "vaporwave":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><defs><linearGradient id="vw" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="640" height="360" fill="url(#vw)"/><path d="M0 262h640M64 262 0 360M160 262 118 360M256 262 238 360M384 262 404 360M480 262 522 360M576 262 640 360M0 310h640M0 338h640" stroke="#fff" stroke-width="2" opacity=".78"/><circle cx="320" cy="128" r="58" fill="${d}" opacity=".86"/><rect x="252" y="178" width="136" height="84" fill="#f8f8f2" opacity=".9"/><text x="238" y="86" font-family="Georgia,serif" font-size="36" fill="#fff">VHS</text></svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${a}"/><circle cx="320" cy="180" r="96" fill="${b}"/><rect x="230" y="90" width="180" height="180" fill="${c}" opacity=".72"/></svg>`;
  }
}
