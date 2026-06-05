import { v4 as uuid } from "uuid";
import type {
  DecomposeRequest,
  DecomposeResult,
  PrerectorProject,
  PrerectorTask,
  TaskDifficulty,
  Team,
} from "@everec/shared";

interface TaskTemplate {
  title: string;
  phase: string;
  description: string;
  baseHours: number;
  baseDifficulty: TaskDifficulty;
  keywords: string[];
}

const VIDEO_TEMPLATES: TaskTemplate[] = [
  {
    title: "创意策划与 Brief",
    phase: "前期",
    description: "明确目标受众、风格参考与交付规格",
    baseHours: 4,
    baseDifficulty: 2,
    keywords: ["策划", "brief", "创意", "概念"],
  },
  {
    title: "脚本撰写",
    phase: "前期",
    description: "完成旁白/对白脚本与画面描述",
    baseHours: 6,
    baseDifficulty: 3,
    keywords: ["脚本", "文案", "旁白", "对白"],
  },
  {
    title: "分镜设计",
    phase: "前期",
    description: "镜头语言、转场与节奏规划",
    baseHours: 8,
    baseDifficulty: 3,
    keywords: ["分镜", "storyboard", "镜头"],
  },
  {
    title: "素材拍摄/采集",
    phase: "制作",
    description: "按分镜完成拍摄或素材收集",
    baseHours: 16,
    baseDifficulty: 4,
    keywords: ["拍摄", "采集", "录制", "footage"],
  },
  {
    title: "素材整理与代理生成",
    phase: "制作",
    description: "重命名、分类并生成低码率代理文件",
    baseHours: 3,
    baseDifficulty: 2,
    keywords: ["整理", "代理", "proxy", "素材"],
  },
  {
    title: "粗剪",
    phase: "后期",
    description: "搭建时间轴结构，确定叙事节奏",
    baseHours: 8,
    baseDifficulty: 3,
    keywords: ["粗剪", "assembly", "结构"],
  },
  {
    title: "精剪",
    phase: "后期",
    description: "精细剪辑、转场与节奏微调",
    baseHours: 12,
    baseDifficulty: 4,
    keywords: ["精剪", "剪辑", "转场", "节奏"],
  },
  {
    title: "调色",
    phase: "后期",
    description: "色彩校正与风格 LUT 应用",
    baseHours: 6,
    baseDifficulty: 4,
    keywords: ["调色", "color", "lut", "色彩"],
  },
  {
    title: "字幕与包装",
    phase: "后期",
    description: "字幕、标题动画与品牌包装",
    baseHours: 5,
    baseDifficulty: 3,
    keywords: ["字幕", "包装", "title", "motion"],
  },
  {
    title: "音效与混音",
    phase: "后期",
    description: "BGM、拟声与混音平衡（可对接 desound）",
    baseHours: 6,
    baseDifficulty: 3,
    keywords: ["音效", "混音", "bgm", "声音"],
  },
  {
    title: "审片与修改",
    phase: "交付",
    description: "内部审片、客户反馈与修改轮次",
    baseHours: 4,
    baseDifficulty: 2,
    keywords: ["审片", "反馈", "修改", "review"],
  },
  {
    title: "导出与交付",
    phase: "交付",
    description: "多规格导出、归档与 Graph 备份",
    baseHours: 2,
    baseDifficulty: 1,
    keywords: ["导出", "交付", "export", "交付物"],
  },
];

const ROLE_PHASE_MAP: Record<string, string[]> = {
  director: ["前期", "制作"],
  producer: ["前期", "交付"],
  editor: ["后期"],
  colorist: ["后期"],
  sound: ["后期"],
  other: ["前期", "制作", "后期", "交付"],
};

function estimateDifficulty(
  template: TaskTemplate,
  brief: string,
  durationMin: number,
): TaskDifficulty {
  let score = template.baseDifficulty;
  const lower = brief.toLowerCase();

  if (template.keywords.some((k) => lower.includes(k.toLowerCase()))) {
    score = Math.min(5, score + 1) as TaskDifficulty;
  }
  if (durationMin > 10) score = Math.min(5, score + 1) as TaskDifficulty;
  if (durationMin > 30) score = Math.min(5, score + 1) as TaskDifficulty;
  if (/4k|raw|多机位|复杂/.test(lower)) {
    score = Math.min(5, score + 1) as TaskDifficulty;
  }

  return score as TaskDifficulty;
}

function estimateHours(
  template: TaskTemplate,
  difficulty: TaskDifficulty,
  durationMin: number,
): number {
  const durationFactor = 1 + durationMin / 30;
  const difficultyFactor = 0.7 + difficulty * 0.15;
  return Math.round(template.baseHours * durationFactor * difficultyFactor * 10) / 10;
}

function pickAssignee(
  team: Team | undefined,
  phase: string,
  index: number,
): string | undefined {
  if (!team || team.members.length === 0) return undefined;

  const eligible = team.members.filter((m) =>
    (ROLE_PHASE_MAP[m.role] ?? ROLE_PHASE_MAP.other).includes(phase),
  );
  const pool = eligible.length > 0 ? eligible : team.members;
  return pool[index % pool.length].id;
}

function extractProjectName(brief: string): string {
  const firstLine = brief.split("\n")[0]?.trim() ?? "";
  if (firstLine.length > 0 && firstLine.length <= 60) return firstLine;
  return `视频项目 ${new Date().toLocaleDateString("zh-CN")}`;
}

export function decomposeProject(req: DecomposeRequest, team?: Team): DecomposeResult {
  const now = new Date().toISOString();
  const durationMin = req.videoDurationMin ?? 5;

  const project: PrerectorProject = {
    id: uuid(),
    name: extractProjectName(req.brief),
    brief: req.brief,
    videoDurationMin: durationMin,
    teamId: req.teamId,
    createdAt: now,
  };

  const tasks: PrerectorTask[] = VIDEO_TEMPLATES.map((tpl, i) => {
    const difficulty = estimateDifficulty(tpl, req.brief, durationMin);
    const estimatedHours = estimateHours(tpl, difficulty, durationMin);
    const dueOffsetDays = Math.ceil((i + 1) * (estimatedHours / 8));

    return {
      id: uuid(),
      projectId: project.id,
      title: tpl.title,
      description: tpl.description,
      phase: tpl.phase,
      status: i === 0 ? "in_progress" : "todo",
      difficulty,
      estimatedHours,
      assigneeId: pickAssignee(team, tpl.phase, i),
      dueAt: new Date(Date.now() + dueOffsetDays * 86400000).toISOString(),
      createdAt: now,
    };
  });

  return { project, tasks };
}

export function rebalanceAssignments(tasks: PrerectorTask[], team: Team): PrerectorTask[] {
  const load = new Map<string, number>();

  return tasks.map((task, i) => ({
    ...task,
    assigneeId: pickAssignee(team, task.phase, i),
  })).map((task) => {
    if (!task.assigneeId) return task;
    const current = load.get(task.assigneeId) ?? 0;
    load.set(task.assigneeId, current + task.estimatedHours);
    return task;
  });
}
