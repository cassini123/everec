import type { ProjectType, TaskDifficulty } from "@everec/shared";
import { SCOPE_LABELS } from "@everec/shared";
import type { ParsedTaskInput, TaskTemplate } from "./taskTemplates";

const EASY_KEYWORDS = /简单|基础|整理|归档|文档|常规|例行|copy|简单修改/i;
const HARD_KEYWORDS = /复杂|架构|集成|全栈|4k|多机位|重构|从零|核心|关键路径|高难度/i;
const MEDIUM_KEYWORDS = /设计|开发|剪辑|混音|调色|测试|评审|联调/i;

export function assessDifficulty(
  title: string,
  description: string,
  brief: string,
  projectType: Exclude<ProjectType, "auto">,
  scope: number,
  template?: TaskTemplate,
): TaskDifficulty {
  let score: number = template?.baseDifficulty ?? 3;
  const text = `${title} ${description} ${brief}`.toLowerCase();

  if (template?.keywords.some((k) => text.includes(k.toLowerCase()))) {
    score = Math.min(5, score + 1);
  }
  if (EASY_KEYWORDS.test(text)) score = Math.max(1, score - 1);
  if (HARD_KEYWORDS.test(text)) score = Math.min(5, score + 1);
  if (MEDIUM_KEYWORDS.test(text) && score < 3) score = 3;

  const scopeDefault = SCOPE_LABELS[projectType].default;
  if (scope > scopeDefault * 2) score = Math.min(5, score + 1);
  if (scope > scopeDefault * 4) score = Math.min(5, score + 1);

  if (projectType === "video" && /4k|raw|多机位/.test(text)) {
    score = Math.min(5, score + 1);
  }

  return Math.max(1, Math.min(5, score)) as TaskDifficulty;
}

export function assessHours(
  difficulty: TaskDifficulty,
  projectType: Exclude<ProjectType, "auto">,
  scope: number,
  template?: TaskTemplate,
): number {
  const base = template?.baseHours ?? 4 + difficulty;
  const scopeDefault = SCOPE_LABELS[projectType].default;
  const scopeFactor = 0.8 + scope / scopeDefault;
  const difficultyFactor = 0.65 + difficulty * 0.18;
  return Math.round(base * scopeFactor * difficultyFactor * 10) / 10;
}

export function assessCustomTask(
  task: ParsedTaskInput,
  brief: string,
  projectType: Exclude<ProjectType, "auto">,
  scope: number,
) {
  const difficulty = assessDifficulty(task.title, task.description, brief, projectType, scope);
  const estimatedHours = assessHours(difficulty, projectType, scope);
  return { difficulty, estimatedHours };
}

export function assessTemplateTask(
  template: TaskTemplate,
  brief: string,
  projectType: Exclude<ProjectType, "auto">,
  scope: number,
) {
  const difficulty = assessDifficulty(
    template.title,
    template.description,
    brief,
    projectType,
    scope,
    template,
  );
  const estimatedHours = assessHours(difficulty, projectType, scope, template);
  return { difficulty, estimatedHours };
}
