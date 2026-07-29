import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Settings, Send, Bot, User, Loader2 } from "lucide-react";

// ── 项目知识库 ──────────────────────────────────────────────────────────────

const PROJECT_CONTEXT = `你是 Everec 每刻 Creative OS 项目的 AI 助手。以下是项目的完整信息，请基于这些信息回答用户的问题。

## 项目概述

Everec 是一个创作者认知增强系统（Creative OS），采用 monorepo 架构，包含多个子产品：

| 子产品 | 路径 | 说明 |
|--------|------|------|
| **Portal** | portal/ | 统一 Web 门户，iframe 嵌入各子产品 |
| **Simcut** | simcut/ | 轻量视频剪辑（Web + 桌面 Tauri） |
| **Desound** | desound/ | 音频/音效创作（Web + 桌面 Tauri） |
| **Knowgo** | knowgo/ | 视觉灵感认知 + Project Graph |
| **Prerector** | prerector/ | 协作制片（任务/好友/群聊） |
| **Shared** | shared/ | 共享类型与工具库 |
| **API** | api/ | 统一 API 层（Vercel Serverless） |

## 技术栈

- 前端框架: React 19 + TypeScript + Vite 6
- 样式: Tailwind CSS v4
- 图标: Lucide React
- 包管理: pnpm workspaces
- 部署: Vercel（统一部署）
- 桌面端: Tauri (Rust) — Simcut、Desound
- 构建工具: esbuild（API 构建）

## 目录结构

- portal/ — 统一门户 (Vite dev port 1410)
  - src/App.tsx — 主页面，含导航与各产品入口
  - src/main.tsx — React 入口
  - src/index.css — 全局样式（暗色主题，CSS 变量定义颜色系统）
  - vite.config.ts — Vite 配置，含各子产品代理
- simcut/ — 轻量视频剪辑
  - web/frontend/ — Simcut Web 前端 (port 1421)
    - src/App.tsx — 主应用
    - src/lib/ — 工具库（波形、时间线、色彩分析、效果预设等）
    - src/components/ — 组件（效果预览、静态图片预览等）
  - apps/ — Tauri 桌面端
  - crates/ — Rust crates
- desound/ — 音频/音效创作
  - web/frontend/ — Desound Web 前端 (port 1420)
    - src/App.tsx — 主应用
    - src/lib/ — 工具库（foley、音效预设、Web Audio 引擎、音乐获取等）
    - src/components/ — 组件（时间线、作曲、乐器选择、钢琴卷帘等）
  - web/backend/ — Desound 后端
  - desktop/ — Tauri 桌面端
- knowgo/ — 视觉灵感认知
  - web/frontend/ — Knowgo 前端 (port 1422)
    - src/App.tsx — 主应用
    - src/views/ — 视图（Capture、Document、Brief、Style、Analyze、Graph）
    - src/lib/ — 工具库（图导航、API）
  - web/backend/ — Knowgo 后端
  - api/ — Knowgo Vercel API
- prerector/ — 协作制片
  - web/frontend/ — Prerector 前端 (port 1423)
    - src/App.tsx — 主应用
    - src/views/ — 视图（Dashboard、Tasks、Teams、Friends、Chat、Reminders、Sync）
  - web/backend/ — Prerector 后端
  - api/ — Prerector Vercel API
- shared/ — 共享库 (@everec/shared)
  - src/types.ts — 共享类型
  - src/constants.ts — 共享常量
  - src/library/ — 搜索、解析、音效搜索等工具
  - src/knowgo/ — Knowgo 相关类型和工具（图、样式数据集等）
  - src/prerector/ — Prerector 相关类型和常量
  - src/media/ — 媒体类型和提取工具
  - src/instruments/ — Web 乐器
- api/ — 统一 API (Vercel Serverless)
  - index.js — 主 API 入口
  - scripts/ — 构建脚本
- scripts/ — 项目级构建脚本
- vercel.json — Vercel 部署配置（路由重写规则）

## 关键入口

- 门户入口: portal/src/main.tsx → portal/src/App.tsx
- Vite 配置: portal/vite.config.ts（含各子产品代理配置）
- Vercel 配置: vercel.json（路由重写规则）
- 共享库: shared/src/index.ts

## 运行命令

- pnpm install — 安装依赖
- pnpm dev:portal — 门户 http://localhost:1410
- pnpm dev:simcut — Simcut :1421
- pnpm dev:web — Desound :1420
- pnpm dev:knowgo — Knowgo :1422
- pnpm dev:prerector — Prerector :1423

## 各产品功能详情

### Simcut（视频剪辑）
- 时间线编辑、波形匹配、帧捕获
- 色彩分析、宽高比处理
- 效果预设、文字设计
- 媒体存储、项目存储
- 支持 Tauri 桌面端

### Desound（音频创作）
- Web Audio 引擎
- Foley 音效、音效预设
- 作曲功能（乐器选择、钢琴卷帘、时间线）
- 音乐获取、项目存储
- 声音设计工具
- 支持 Tauri 桌面端

### Knowgo（视觉灵感）
- Project Graph（项目图谱）
- 图像采集与分析
- 风格数据集
- 文档生成
- Brief（简报）视图
- 图导航与同步

### Prerector（协作制片）
- 任务管理
- 团队协作
- 好友系统
- 群聊功能
- 提醒与同步
- Dashboard 仪表盘

## 共享库模块

- types — 全局共享类型定义
- constants — 全局常量
- library/search — 搜索功能
- library/resolve — 资源解析
- library/parseTitle — 标题解析
- library/sfxSearch — 音效搜索
- instruments/webInstruments — Web 乐器
- media/types — 媒体类型
- media/extract — 媒体提取
- knowgo/types — Knowgo 类型
- knowgo/urlParse — URL 解析
- knowgo/analyzeLocal — 本地分析
- knowgo/graph — 图谱操作
- knowgo/graphSync — 图谱同步
- knowgo/styleDataset — 样式数据集
- knowgo/datasetSync — 数据集同步
- knowgo/documentFromGraph — 从图谱生成文档
- prerector/types — Prerector 类型
- prerector/constants — Prerector 常量

## 部署架构

- 统一部署通过 Vercel，根目录为仓库根
- 路由规则：/apps/simcut/*, /apps/desound/*, /apps/knowgo/*, /apps/prerector/*
- API 路由：/api/* → 统一 API, /api/knowgo/* → Knowgo API, /api/prerector/* → Prerector API
- 桌面端通过 Tauri 独立构建

## 注意事项

- 门户 dev 模式下 iframe 需各产品 dev 服务同时运行
- 工作区依赖使用 workspace:* 协议引用内部包
- 桌面端 (Tauri) 需要 Rust 环境
- 门户代理配置在 portal/vite.config.ts
- Vercel rewrites 在 vercel.json`;

// ── 类型定义 ──────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

type PanelView = "chat" | "settings";

// ── 组件 ──────────────────────────────────────────────────────────────────

export default function AIWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<PanelView>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("deepseek_api_key") || "");
  const [tempApiKey, setTempApiKey] = useState(() => localStorage.getItem("deepseek_api_key") || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 打开面板时聚焦输入框
  useEffect(() => {
    if (isOpen && view === "chat") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, view]);

  // 保存 API Key
  const saveApiKey = useCallback(() => {
    localStorage.setItem("deepseek_api_key", tempApiKey);
    setApiKey(tempApiKey);
    setView("chat");
  }, [tempApiKey]);

  // 发送消息
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    if (!apiKey) {
      setView("settings");
      return;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const allMessages = [
        { role: "system" as const, content: PROJECT_CONTEXT },
        ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: userMessage.content },
      ];

      const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: allMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API 错误 (${response.status}): ${errText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("无法读取响应流");

      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              accumulated += delta;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessage.id ? { ...m, content: accumulated } : m,
                ),
              );
            }
          } catch {
            // 跳过解析失败的行
          }
        }
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "请求失败";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: `⚠️ ${errMsg}\n\n请检查 API Key 是否正确，或稍后重试。` }
            : m,
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, apiKey, messages]);

  // 回车发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 清空对话
  const clearChat = () => {
    setMessages([]);
  };

  return (
    <>
      {/* 悬浮按钮 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ev-accent text-white shadow-lg shadow-ev-accent/30 transition-all hover:scale-110 hover:shadow-xl hover:shadow-ev-accent/40 active:scale-95"
          title="AI 助手"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* 面板 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[420px] flex-col overflow-hidden rounded-2xl border border-ev-border bg-ev-surface shadow-2xl shadow-black/50">
          {/* 头部 */}
          <div className="flex items-center justify-between border-b border-ev-border bg-ev-panel px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-ev-accent" />
              <span className="text-sm font-medium">Everec AI 助手</span>
            </div>
            <div className="flex items-center gap-1">
              {view === "chat" && (
                <button
                  onClick={clearChat}
                  className="rounded-lg px-2 py-1 text-xs text-ev-muted transition hover:bg-ev-elevated hover:text-ev-text"
                  title="清空对话"
                >
                  清空
                </button>
              )}
              <button
                onClick={() => setView(view === "settings" ? "chat" : "settings")}
                className={`rounded-lg p-1.5 transition ${
                  view === "settings"
                    ? "bg-ev-accent/15 text-ev-accent"
                    : "text-ev-muted hover:bg-ev-elevated hover:text-ev-text"
                }`}
                title="设置"
              >
                <Settings className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-ev-muted transition hover:bg-ev-elevated hover:text-ev-text"
                title="关闭"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 内容区 */}
          {view === "settings" ? (
            <SettingsPanel
              apiKey={tempApiKey}
              onApiKeyChange={setTempApiKey}
              onSave={saveApiKey}
            />
          ) : (
            <ChatPanel
              messages={messages}
              input={input}
              isLoading={isLoading}
              onInputChange={setInput}
              onSend={sendMessage}
              onKeyDown={handleKeyDown}
              messagesEndRef={messagesEndRef}
              inputRef={inputRef}
              hasApiKey={!!apiKey}
              onOpenSettings={() => setView("settings")}
            />
          )}
        </div>
      )}
    </>
  );
}

// ── 设置面板 ──────────────────────────────────────────────────────────────

function SettingsPanel({
  apiKey,
  onApiKeyChange,
  onSave,
}: {
  apiKey: string;
  onApiKeyChange: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-5 overflow-auto p-5">
      <div>
        <h3 className="text-sm font-medium text-ev-text">API 配置</h3>
        <p className="mt-1 text-xs text-ev-muted">
          配置 DeepSeek API Key 以启用 AI 对话功能。Key 仅存储在本地浏览器中。
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-ev-muted">DeepSeek API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          placeholder="sk-..."
          className="w-full rounded-lg border border-ev-border bg-ev-bg px-3 py-2.5 text-sm text-ev-text placeholder:text-ev-muted/50 focus:border-ev-accent focus:outline-none focus:ring-1 focus:ring-ev-accent/30"
        />
        <p className="text-[11px] text-ev-muted">
          从{" "}
          <a
            href="https://platform.deepseek.com/api_keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ev-accent hover:underline"
          >
            platform.deepseek.com
          </a>{" "}
          获取 API Key
        </p>
      </div>

      <button
        onClick={onSave}
        disabled={!apiKey.trim()}
        className="mt-auto rounded-lg bg-ev-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ev-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
      >
        保存配置
      </button>
    </div>
  );
}

// ── 聊天面板 ──────────────────────────────────────────────────────────────

function ChatPanel({
  messages,
  input,
  isLoading,
  onInputChange,
  onSend,
  onKeyDown,
  messagesEndRef,
  inputRef,
  hasApiKey,
  onOpenSettings,
}: {
  messages: Message[];
  input: string;
  isLoading: boolean;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ev-accent/10">
              <Bot className="h-6 w-6 text-ev-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-ev-text">Everec AI 助手</p>
              <p className="mt-1 text-xs text-ev-muted">
                基于项目全部代码和文档，回答关于 Everec 的任何问题
              </p>
            </div>
            {!hasApiKey && (
              <button
                onClick={onOpenSettings}
                className="mt-2 rounded-lg bg-ev-accent/10 px-3 py-1.5 text-xs font-medium text-ev-accent transition hover:bg-ev-accent/20"
              >
                请先配置 API Key
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="border-t border-ev-border p-3">
        {!hasApiKey && (
          <div className="mb-2 rounded-lg bg-ev-accent/10 px-3 py-2 text-xs text-ev-accent">
            请先{" "}
            <button onClick={onOpenSettings} className="font-medium underline">
              配置 API Key
            </button>{" "}
            以启用对话
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={hasApiKey ? "输入问题... (Enter 发送, Shift+Enter 换行)" : "请先配置 API Key"}
            disabled={!hasApiKey}
            rows={1}
            className="min-h-[38px] max-h-[120px] flex-1 resize-none rounded-lg border border-ev-border bg-ev-bg px-3 py-2 text-sm text-ev-text placeholder:text-ev-muted/50 focus:border-ev-accent focus:outline-none focus:ring-1 focus:ring-ev-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ height: "auto", minHeight: "38px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <button
            onClick={onSend}
            disabled={!input.trim() || isLoading || !hasApiKey}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ev-accent text-white transition hover:bg-ev-accent-dim disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 消息气泡 ──────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          isUser ? "bg-ev-accent/15 text-ev-accent" : "bg-ev-elevated text-ev-muted"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div
        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-ev-accent text-white"
            : "bg-ev-panel text-ev-text"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
      </div>
    </div>
  );
}
