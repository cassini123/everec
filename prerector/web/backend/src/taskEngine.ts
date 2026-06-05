import { v4 as uuid } from "uuid";
import type {
  DecomposeRequest,
  DecomposeResult,
  PrerectorProject,
  PrerectorTask,
  ProjectType,
  Team,
} from "@everec/shared";
import { SCOPE_LABELS } from "@everec/shared";
import { assessCustomTask, assessTemplateTask } from "./taskAssessment";
import { detectProjectType, parseTaskInput, TEMPLATES_BY_TYPE } from "./taskTemplates";

const ROLE_PHASE_MAP: Record<string, string[]> = {
  director: ["前期", "策划", "启动", "规划", "制作", "执行"],
  producer: ["前期", "策划", "启动", "交付", "复盘", "评审"],
  editor: ["后期", "制作", "执行", "开发", "设计"],
  colorist: ["后期", "设计"],
  sound: ["后期", "制作"],
  other: ["前期", "策划", "启动", "规划", "制作", "执行", "后期", "设计", "开发", "测试", "评审", "交付", "复盘"],
};

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
  return `项目 ${new Date().toLocaleDateString("zh-CN")}`;
}

function resolveScope(req: DecomposeRequest, projectType: Exclude<ProjectType, "auto">): number {
  return req.scope ?? req.videoDurationMin ?? SCOPE_LABELS[projectType].default;
}

export function decomposeProject(req: DecomposeRequest, team?: Team): DecomposeResult {
  const now = new Date().toISOString();
  const projectType = detectProjectType(req.brief, req.projectType);
  const scope = resolveScope(req, projectType);
  const scopeMeta = SCOPE_LABELS[projectType];
  const customTasks = req.taskInput?.trim() ? parseTaskInput(req.taskInput) : [];

  const project: PrerectorProject = {
    id: uuid(),
    name: extractProjectName(req.brief),
    brief: req.brief,
    projectType,
    scope,
    scopeUnit: scopeMeta.unit,
    teamId: req.teamId,
    createdAt: now,
  };

  const taskSpecs =
    customTasks.length > 0
      ? customTasks.map((t) => {
          const { difficulty, estimatedHours } = assessCustomTask(t, req.brief, projectType, scope);
          return {
            title: t.title,
            description: t.description,
            phase: t.phase,
            difficulty,
            estimatedHours,
          };
        })
      : TEMPLATES_BY_TYPE[projectType].map((tpl) => {
          const { difficulty, estimatedHours } = assessTemplateTask(tpl, req.brief, projectType, scope);
          return {
            title: tpl.title,
            description: tpl.description,
            phase: tpl.phase,
            difficulty,
            estimatedHours,
          };
        });

  const tasks: PrerectorTask[] = taskSpecs.map((spec, i) => {
    const dueOffsetDays = Math.max(1, Math.ceil((i + 1) * (spec.estimatedHours / 8)));
    return {
      id: uuid(),
      projectId: project.id,
      title: spec.title,
      description: spec.description,
      phase: spec.phase,
      status: i === 0 ? "in_progress" : "todo",
      difficulty: spec.difficulty,
      estimatedHours: spec.estimatedHours,
      assigneeId: pickAssignee(team, spec.phase, i),
      dueAt: new Date(Date.now() + dueOffsetDays * 86400000).toISOString(),
      createdAt: now,
    };
  });

  return { project, tasks };
}

export function rebalanceAssignments(tasks: PrerectorTask[], team: Team): PrerectorTask[] {
  const load = new Map<string, number>();

  return tasks
    .map((task, i) => ({
      ...task,
      assigneeId: pickAssignee(team, task.phase, i),
    }))
    .map((task) => {
      if (!task.assigneeId) return task;
      const current = load.get(task.assigneeId) ?? 0;
      load.set(task.assigneeId, current + task.estimatedHours);
      return task;
    });
}

export { assessCustomTask } from "./taskAssessment";
export { detectProjectType, parseTaskInput } from "./taskTemplates";
