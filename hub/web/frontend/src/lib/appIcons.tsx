import {
  Brain,
  Film,
  Music,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { EverecAppId } from "../types";

const ICON_MAP: Record<string, LucideIcon> = {
  brain: Brain,
  film: Film,
  music: Music,
  sparkles: Sparkles,
  users: Users,
};

interface Props {
  icon: string;
  size?: number;
  className?: string;
}

export function AppIcon({ icon, size = 28, className }: Props) {
  const Icon = ICON_MAP[icon] ?? Sparkles;
  return <Icon size={size} className={className} />;
}

export function getAppAccent(appId: EverecAppId): string {
  const accents: Record<EverecAppId, string> = {
    knowgo: "text-ev-teal",
    simcut: "text-ev-orange",
    desound: "text-ev-purple",
    inspibrary: "text-ev-pink",
    prerector: "text-ev-blue",
  };
  return accents[appId];
}
