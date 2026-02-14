import {
  Gauge,
  Settings,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export const adminNav: NavItem[] = [
  { label: "Overseer", href: "/overseer", icon: Gauge },
];

export const developerNav: NavItem[] = [
  { label: "My Milestones", href: "/my-milestones", icon: ListChecks },
];

export const portals = [
  { label: "Admin Portal", href: "/overseer", description: "Team milestone oversight", icon: Settings },
  { label: "Developer Portal", href: "/my-milestones", description: "My tasks and checkpoints", icon: ListChecks },
];
