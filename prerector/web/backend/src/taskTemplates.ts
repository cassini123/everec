import type { ProjectType } from "@everec/shared";
import type { TaskDifficulty } from "@everec/shared";

export interface TaskTemplate {
  title: string;
  phase: string;
  description: string;
  baseHours: number;
  baseDifficulty: TaskDifficulty;
  keywords: string[];
}

export const TEMPLATES_BY_TYPE: Record<Exclude<ProjectType, "auto">, TaskTemplate[]> = {
  video: [
    { title: "创意策划与 Brief", phase: "前期", description: "明确目标受众、风格参考与交付规格", baseHours: 4, baseDifficulty: 2, keywords: ["策划", "brief", "创意"] },
    { title: "脚本撰写", phase: "前期", description: "完成旁白/对白脚本与画面描述", baseHours: 6, baseDifficulty: 3, keywords: ["脚本", "文案", "旁白"] },
    { title: "分镜设计", phase: "前期", description: "镜头语言、转场与节奏规划", baseHours: 8, baseDifficulty: 3, keywords: ["分镜", "storyboard"] },
    { title: "素材拍摄/采集", phase: "制作", description: "按分镜完成拍摄或素材收集", baseHours: 16, baseDifficulty: 4, keywords: ["拍摄", "采集", "录制"] },
    { title: "素材整理与代理生成", phase: "制作", description: "分类并生成低码率代理文件", baseHours: 3, baseDifficulty: 2, keywords: ["整理", "代理", "proxy"] },
    { title: "粗剪", phase: "后期", description: "搭建时间轴结构，确定叙事节奏", baseHours: 8, baseDifficulty: 3, keywords: ["粗剪", "assembly"] },
    { title: "精剪", phase: "后期", description: "精细剪辑、转场与节奏微调", baseHours: 12, baseDifficulty: 4, keywords: ["精剪", "剪辑", "转场"] },
    { title: "调色", phase: "后期", description: "色彩校正与风格 LUT 应用", baseHours: 6, baseDifficulty: 4, keywords: ["调色", "color", "lut"] },
    { title: "字幕与包装", phase: "后期", description: "字幕、标题动画与品牌包装", baseHours: 5, baseDifficulty: 3, keywords: ["字幕", "包装"] },
    { title: "音效与混音", phase: "后期", description: "BGM、拟声与混音平衡", baseHours: 6, baseDifficulty: 3, keywords: ["音效", "混音", "bgm"] },
    { title: "审片与修改", phase: "交付", description: "内部审片、客户反馈与修改轮次", baseHours: 4, baseDifficulty: 2, keywords: ["审片", "反馈", "review"] },
    { title: "导出与交付", phase: "交付", description: "多规格导出、归档与备份", baseHours: 2, baseDifficulty: 1, keywords: ["导出", "交付"] },
  ],
  audio: [
    { title: "声音方向与参考", phase: "前期", description: "确定风格参考、情绪与交付格式", baseHours: 3, baseDifficulty: 2, keywords: ["参考", "风格", "mood"] },
    { title: "素材采集/录音", phase: "制作", description: "现场录音、拟声或素材库选型", baseHours: 8, baseDifficulty: 3, keywords: ["录音", "拟声", "foley"] },
    { title: "编曲/铺底", phase: "制作", description: "BGM 结构、和声与节奏框架", baseHours: 10, baseDifficulty: 4, keywords: ["编曲", "bgm", "compose"] },
    { title: "混音", phase: "后期", description: "轨道路由、EQ、压缩与空间", baseHours: 8, baseDifficulty: 4, keywords: ["混音", "mix", "eq"] },
    { title: "母带/导出", phase: "交付", description: "响度标准化、多格式导出", baseHours: 3, baseDifficulty: 2, keywords: ["母带", "master", "导出"] },
  ],
  design: [
    { title: "需求与调研", phase: "前期", description: "用户研究、竞品分析与设计目标", baseHours: 6, baseDifficulty: 2, keywords: ["调研", "用户", "research"] },
    { title: "信息架构", phase: "前期", description: "流程、导航与内容结构", baseHours: 5, baseDifficulty: 3, keywords: ["架构", "流程", "wireflow"] },
    { title: "线框/原型", phase: "设计", description: "低保真线框与交互原型", baseHours: 8, baseDifficulty: 3, keywords: ["线框", "原型", "wireframe"] },
    { title: "视觉设计", phase: "设计", description: "视觉规范、组件与关键页面", baseHours: 12, baseDifficulty: 4, keywords: ["视觉", "ui", "界面"] },
    { title: "设计走查与交付", phase: "交付", description: "标注、切图与设计系统文档", baseHours: 4, baseDifficulty: 2, keywords: ["交付", "标注", "handoff"] },
  ],
  software: [
    { title: "需求分析", phase: "前期", description: "功能清单、优先级与验收标准", baseHours: 6, baseDifficulty: 3, keywords: ["需求", "prd", "功能"] },
    { title: "技术方案", phase: "前期", description: "架构设计、技术选型与接口定义", baseHours: 8, baseDifficulty: 4, keywords: ["架构", "api", "技术"] },
    { title: "开发实现", phase: "开发", description: "核心功能编码与单元测试", baseHours: 24, baseDifficulty: 4, keywords: ["开发", "编码", "implement"] },
    { title: "联调与测试", phase: "测试", description: "集成测试、Bug 修复与性能优化", baseHours: 10, baseDifficulty: 3, keywords: ["测试", "联调", "qa"] },
    { title: "部署与文档", phase: "交付", description: "上线部署、运维文档与交接", baseHours: 4, baseDifficulty: 2, keywords: ["部署", "上线", "文档"] },
  ],
  campaign: [
    { title: "策略与目标", phase: "策划", description: "KPI、受众画像与渠道策略", baseHours: 5, baseDifficulty: 2, keywords: ["策略", "kpi", "目标"] },
    { title: "内容规划", phase: "策划", description: "内容日历、素材清单与分工", baseHours: 6, baseDifficulty: 3, keywords: ["内容", "日历", "规划"] },
    { title: "素材制作", phase: "执行", description: "图文/视频/落地页等素材产出", baseHours: 16, baseDifficulty: 4, keywords: ["素材", "制作", "创意"] },
    { title: "渠道投放", phase: "执行", description: "平台配置、投放与 A/B 测试", baseHours: 8, baseDifficulty: 3, keywords: ["投放", "广告", "渠道"] },
    { title: "数据复盘", phase: "复盘", description: "效果分析、报告与优化建议", baseHours: 4, baseDifficulty: 2, keywords: ["复盘", "数据", "报告"] },
  ],
  general: [
    { title: "项目启动", phase: "启动", description: "目标对齐、范围确认与里程碑", baseHours: 3, baseDifficulty: 1, keywords: ["启动", "kickoff"] },
    { title: "方案规划", phase: "规划", description: "任务分解、资源与风险识别", baseHours: 5, baseDifficulty: 2, keywords: ["规划", "方案", "计划"] },
    { title: "执行推进", phase: "执行", description: "核心交付物制作与协作", baseHours: 16, baseDifficulty: 3, keywords: ["执行", "推进", "制作"] },
    { title: "评审修改", phase: "评审", description: "内部评审、反馈收集与迭代", baseHours: 4, baseDifficulty: 2, keywords: ["评审", "反馈", "修改"] },
    { title: "验收交付", phase: "交付", description: "最终验收、归档与总结", baseHours: 2, baseDifficulty: 1, keywords: ["验收", "交付", "总结"] },
  ],
};

const TYPE_KEYWORDS: Record<Exclude<ProjectType, "auto">, RegExp[]> = {
  video: [/视频|剪辑|拍摄|分镜|调色|字幕|宣传片|mv|footage|4k|成片/i],
  audio: [/音频|声音|混音|编曲|bgm|拟声|foley|录音|母带|podcast/i],
  design: [/设计|ui|ux|界面|视觉|原型|线框|figma|品牌/i],
  software: [/开发|软件|api|后端|前端|系统|app|代码|功能模块/i],
  campaign: [/营销|活动|投放|推广|campaign|广告|社媒|品牌传播/i],
  general: [],
};

export function detectProjectType(brief: string, hint?: ProjectType): Exclude<ProjectType, "auto"> {
  if (hint && hint !== "auto") return hint;

  const scores: Record<Exclude<ProjectType, "auto">, number> = {
    video: 0,
    audio: 0,
    design: 0,
    software: 0,
    campaign: 0,
    general: 0,
  };

  for (const [type, patterns] of Object.entries(TYPE_KEYWORDS) as [Exclude<ProjectType, "auto">, RegExp[]][]) {
    for (const re of patterns) {
      if (re.test(brief)) scores[type] += 2;
    }
  }

  const best = (Object.entries(scores) as [Exclude<ProjectType, "auto">, number][])
    .sort((a, b) => b[1] - a[1])[0];

  return best[1] > 0 ? best[0] : "general";
}

export interface ParsedTaskInput {
  title: string;
  description: string;
  phase: string;
}

/** Parse custom task lines: `- task`, `1. task`, `task | desc` */
export function parseTaskInput(input: string): ParsedTaskInput[] {
  const lines = input
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const cleaned = line.replace(/^[-*•]\s*/, "").replace(/^\d+[.)]\s*/, "");
    const [title, ...descParts] = cleaned.split("|").map((s) => s.trim());
    const description = descParts.join(" | ") || "自定义任务";
    const phase = inferPhase(title, description);
    return { title: title || "未命名任务", description, phase };
  });
}

function inferPhase(title: string, description: string): string {
  const text = `${title} ${description}`;
  if (/启动|kickoff|brief|策划|需求|调研|前期/.test(text)) return "前期";
  if (/设计|原型|线框|视觉|ui/.test(text)) return "设计";
  if (/开发|编码|实现|制作|拍摄|录音/.test(text)) return "制作";
  if (/测试|联调|qa|审片|评审/.test(text)) return "评审";
  if (/部署|交付|导出|上线|验收|复盘/.test(text)) return "交付";
  return "执行";
}
