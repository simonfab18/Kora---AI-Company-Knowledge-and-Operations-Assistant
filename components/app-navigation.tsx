"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import type { OrganizationRole } from "@/lib/database.types";
import type { ActiveOrganization } from "@/lib/auth";
import { appNavigation, canAccessNavigationItem } from "@/lib/navigation";

type NavigationProps = {
  role: OrganizationRole | null;
};

type MobileNavigationProps = NavigationProps & {
  organizationName: string;
  userLabel: string;
  organizations: ActiveOrganization[];
  activeOrganizationId?: string;
  switchOrganizationAction: (formData: FormData) => Promise<void>;
};

function isActivePath(pathname: string, href: string) {
  return href === "/app" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function navigationItems(role: OrganizationRole | null) {
  return appNavigation.filter((item) => canAccessNavigationItem(item, role));
}

export function SidebarNavigation({ role }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Application navigation" className="space-y-1">
      {navigationItems(role).map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition duration-300 ease-premium ${
              active
                ? "bg-white/[0.08] text-white"
                : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <item.icon size={17} aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileAppNavigation({ role, organizationName, userLabel, organizations, activeOrganizationId, switchOrganizationAction }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const items = navigationItems(role);

  return (
    <div className="sticky top-0 z-[60] border-b border-white/10 bg-[#050505]/85 px-4 py-3 backdrop-blur-xl lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-outfit text-lg font-semibold">Kora</p>
          <p className="truncate text-xs text-slate-500">{organizationName}</p>
        </div>
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="glass-soft flex h-10 w-10 items-center justify-center rounded-lg text-slate-200"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-[70] bg-[#050505]/80 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Application menu">
          <div className="glass-strong m-3 rounded-lg p-4">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-outfit text-xl font-semibold">Kora</p>
                <p className="mt-1 truncate text-sm text-slate-400">{organizationName}</p>
                <p className="mt-1 truncate text-xs text-slate-500">{userLabel}</p>
              </div>
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setOpen(false)}
                className="glass-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-200"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {organizations.length > 1 ? (
              <form action={switchOrganizationAction} className="mb-5 grid grid-cols-[1fr_auto] gap-2">
                <select
                  aria-label="Switch organization"
                  className="h-11 min-w-0 rounded-lg border border-white/10 bg-[#111] px-3 text-sm text-white outline-none"
                  name="organizationId"
                  defaultValue={activeOrganizationId}
                >
                  {organizations.map((item) => (
                    <option key={item.organization.id} value={item.organization.id}>
                      {item.organization.name}
                    </option>
                  ))}
                </select>
                <button className="rounded-lg bg-white px-4 text-sm font-semibold text-ink" type="submit">
                  Switch
                </button>
              </form>
            ) : null}

            <nav aria-label="Mobile application navigation" className="grid gap-2">
              {items.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition duration-300 ease-premium ${
                      active
                        ? "bg-white/[0.09] text-white"
                        : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <item.icon size={17} aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}