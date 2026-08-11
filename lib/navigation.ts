import type { OrganizationRole } from "@/lib/database.types";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BarChart3,
  BookOpen,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

export type AppNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  allowedRoles: OrganizationRole[];
  requiresOrganization: boolean;
};

export const appNavigation = [
  {
    href: "/app",
    label: "Overview",
    icon: BarChart3,
    allowedRoles: ["owner", "admin", "member"],
    requiresOrganization: false,
  },
  {
    href: "/app/ask",
    label: "Ask AI",
    icon: Sparkles,
    allowedRoles: ["owner", "admin", "member"],
    requiresOrganization: true,
  },
  {
    href: "/app/conversations",
    label: "Conversations",
    icon: MessageSquare,
    allowedRoles: ["owner", "admin", "member"],
    requiresOrganization: true,
  },
  {
    href: "/app/knowledge",
    label: "Knowledge",
    icon: BookOpen,
    allowedRoles: ["owner", "admin"],
    requiresOrganization: true,
  },
  {
    href: "/app/sync",
    label: "Sync Activity",
    icon: Activity,
    allowedRoles: ["owner", "admin"],
    requiresOrganization: true,
  },
  {
    href: "/app/insights",
    label: "Insights",
    icon: BarChart3,
    allowedRoles: ["owner", "admin"],
    requiresOrganization: true,
  },
  {
    href: "/app/members",
    label: "Members",
    icon: Users,
    allowedRoles: ["owner", "admin"],
    requiresOrganization: true,
  },
  {
    href: "/app/settings",
    label: "Settings",
    icon: Settings,
    allowedRoles: ["owner", "admin"],
    requiresOrganization: true,
  },
] satisfies AppNavigationItem[];

export function canAccessNavigationItem(
  item: AppNavigationItem,
  role: OrganizationRole | null,
) {
  if (!item.requiresOrganization) {
    return true;
  }

  return role ? item.allowedRoles.includes(role) : false;
}

