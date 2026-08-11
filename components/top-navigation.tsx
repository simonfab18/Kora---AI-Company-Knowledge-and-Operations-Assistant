"use client";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import type { DailyAiUsage } from "@/lib/ai-usage";
import type { OrganizationRole } from "@/lib/database.types";
import { Bell, BookOpen, Check, ChevronRight, CreditCard, HelpCircle, LifeBuoy, LogOut, MessageCircleWarning, Plus, RefreshCw, Settings, Shield, Sparkles, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";

type ServerAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;
type SyncAction = () => Promise<ActionState>;
type SignOutAction = () => Promise<void>;
type MarkNotificationsReadAction = (formData: FormData) => Promise<void>;
type MenuId = "create" | "usage" | "help" | "notifications" | "account";

type HeaderNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  timestamp: string;
  tone: "info" | "success" | "warning" | "error";
  unread: boolean;
};

type TopNavigationProps = {
  userName: string;
  email: string;
  organizationName: string;
  role: OrganizationRole | null;
  avatarUrl?: string | null;
  dailyUsage: DailyAiUsage | null;
  notifications: HeaderNotification[];
  canManage: boolean;
  inviteMemberAction: ServerAction;
  startSyncAction: SyncAction;
  signOutAction: SignOutAction;
  readNotificationIds: string[];
  markNotificationsReadAction: MarkNotificationsReadAction;
};

type MenuControlProps = {
  openMenu: MenuId | null;
  setOpenMenu: (menu: MenuId | null) => void;
};

const panelClass = "absolute right-0 top-full z-50 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-lg border border-white/10 bg-[#0b0b0b]/95 shadow-2xl shadow-black/40 backdrop-blur-xl";
const itemClass = "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white";

function roleLabel(role: OrganizationRole | null) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Setup required";
}

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function formatReset(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function ActionMessage({ state }: { state: ActionState }) {
  if (state.error) return <p className="mt-2 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-100">{state.error}</p>;
  if (state.message) return <p className="mt-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">{state.message}</p>;
  return null;
}

function MenuShell({
  id,
  label,
  trigger,
  children,
  openMenu,
  setOpenMenu,
}: {
  id: MenuId;
  label: string;
  trigger: React.ReactNode;
  children: React.ReactNode;
} & MenuControlProps) {
  const isOpen = openMenu === id;

  return (
    <div className="relative">
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={label}
        className="block border-0 bg-transparent p-0 text-left"
        title={label}
        type="button"
        onClick={() => setOpenMenu(isOpen ? null : id)}
      >
        {trigger}
      </button>
      {isOpen ? children : null}
    </div>
  );
}

function QuickCreateMenu({ canManage, inviteMemberAction, startSyncAction, openMenu, setOpenMenu }: Pick<TopNavigationProps, "canManage" | "inviteMemberAction" | "startSyncAction"> & MenuControlProps) {
  const [inviteState, inviteFormAction, invitePending] = useActionState(inviteMemberAction, initialActionState);
  const [syncState, setSyncState] = useState<ActionState>(initialActionState);
  const [syncPending, startTransition] = useTransition();

  return (
    <MenuShell
      id="create"
      label="Quick create"
      openMenu={openMenu}
      setOpenMenu={setOpenMenu}
      trigger={
        <span className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink shadow-[0_10px_28px_-8px_rgba(255,255,255,0.4)] transition hover:bg-slate-200">
          <Plus size={16} aria-hidden="true" /> Create
        </span>
      }
    >
      <div className={panelClass} role="menu">
        <div className="border-b border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Quick create</p>
          <p className="mt-1 text-sm text-slate-400">Start common workspace actions from anywhere.</p>
        </div>
        {canManage ? (
          <div className="max-h-[70vh] overflow-y-auto p-3">
            <form action={inviteFormAction} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-white"><UserPlus size={16} aria-hidden="true" /> Invite member</div>
              <input className="mt-3 h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-300" name="email" type="email" placeholder="teammate@company.com" required />
              <select className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#111] px-3 text-sm text-white outline-none focus:border-blue-300" name="role" defaultValue="member">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
              <textarea className="mt-2 min-h-16 w-full resize-none rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-300" placeholder="Optional personal message" aria-label="Optional personal message" />
              <button className="mt-2 h-9 w-full rounded-md bg-white text-sm font-semibold text-ink transition hover:bg-slate-200 disabled:opacity-60" type="submit" disabled={invitePending}>{invitePending ? "Inviting..." : "Create invite"}</button>
              <ActionMessage state={inviteState} />
            </form>

            <div className="mt-3 grid gap-1">
              <Link className={itemClass} href="/app/settings?onboarding=notion" onClick={() => setOpenMenu(null)}><Sparkles size={16} aria-hidden="true" /> Connect source <ChevronRight className="ml-auto" size={15} aria-hidden="true" /></Link>
              <button
                className={itemClass}
                type="button"
                disabled={syncPending}
                onClick={() => {
                  startTransition(async () => {
                    setSyncState(await startSyncAction());
                  });
                }}
              >
                <RefreshCw className={syncPending ? "animate-spin" : ""} size={16} aria-hidden="true" /> {syncPending ? "Starting sync..." : "Start sync"}
              </button>
              <Link className={itemClass} href="/app/collections/new" onClick={() => setOpenMenu(null)}><BookOpen size={16} aria-hidden="true" /> Create collection <ChevronRight className="ml-auto" size={15} aria-hidden="true" /></Link>
              <ActionMessage state={syncState} />
            </div>
          </div>
        ) : (
          <div className="p-4 text-sm leading-6 text-slate-400">Quick create is available to owners and admins. Members can still use Help, Account, and relevant notifications.</div>
        )}
      </div>
    </MenuShell>
  );
}

function UsageMenu({ dailyUsage, openMenu, setOpenMenu }: { dailyUsage: DailyAiUsage | null } & MenuControlProps) {
  const percent = dailyUsage ? Math.min(100, Math.round((dailyUsage.userUsed / Math.max(dailyUsage.userLimit, 1)) * 100)) : 0;

  return (
    <MenuShell
      id="usage"
      label="AI usage"
      openMenu={openMenu}
      setOpenMenu={setOpenMenu}
      trigger={<span className="glass-soft hidden h-11 rounded-lg px-3 py-1.5 text-left text-xs text-slate-300 transition hover:border-white/20 sm:block"><span className="block font-semibold text-white">AI Usage</span><span>{dailyUsage ? `${dailyUsage.userUsed}/${dailyUsage.userLimit} today` : "No usage yet"}</span></span>}
    >
      <div className={panelClass} role="menu">
        <div className="border-b border-white/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">AI Usage</p>
          <h2 className="mt-2 font-outfit text-xl font-semibold text-white">Portfolio Free</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">Usage is shown for demonstration and monitoring only. No charges will be made.</p>
        </div>
        <div className="space-y-3 p-4 text-sm text-slate-300">
          <div>
            <div className="flex justify-between"><span>Your questions today</span><span className="font-mono text-white">{dailyUsage ? `${dailyUsage.userUsed}/${dailyUsage.userLimit}` : "0/20"}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-300" style={{ width: `${percent}%` }} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3"><p className="text-xs text-slate-500">Global AI</p><p className="mt-1 font-mono text-white">{dailyUsage ? `${dailyUsage.globalUsed}/${dailyUsage.globalLimit}` : "0/100"}</p></div>
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-3"><p className="text-xs text-slate-500">Reset</p><p className="mt-1 font-mono text-white">{dailyUsage ? formatReset(dailyUsage.resetAt) : "Daily"}</p></div>
          </div>
          <Link href="/app/usage" className="inline-flex w-full items-center justify-between rounded-md bg-white px-3 py-2 font-semibold text-ink transition hover:bg-slate-200" onClick={() => setOpenMenu(null)}>Open usage details <ChevronRight size={15} /></Link>
        </div>
      </div>
    </MenuShell>
  );
}

function HelpMenu({ openMenu, setOpenMenu }: MenuControlProps) {
  return (
    <MenuShell id="help" label="Help" openMenu={openMenu} setOpenMenu={setOpenMenu} trigger={<span className="glass-soft flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-200 transition hover:border-white/20"><HelpCircle size={16} aria-hidden="true" /> Help</span>}>
      <div className={panelClass} role="menu">
        <div className="border-b border-white/10 p-3">
          <Link className={itemClass} href="/documentation" target="_blank" rel="noreferrer" onClick={() => setOpenMenu(null)}><BookOpen size={16} aria-hidden="true" /> Documentation</Link>
          <Link className={itemClass} href="/support?from=app" onClick={() => setOpenMenu(null)}><LifeBuoy size={16} aria-hidden="true" /> Contact support</Link>
          <Link className={itemClass} href="/report-problem?from=app" onClick={() => setOpenMenu(null)}><MessageCircleWarning size={16} aria-hidden="true" /> Report a problem</Link>
        </div>
      </div>
    </MenuShell>
  );
}

function NotificationsMenu({ notifications, initialReadIds, markNotificationsReadAction, openMenu, setOpenMenu }: { notifications: HeaderNotification[]; initialReadIds: string[]; markNotificationsReadAction: MarkNotificationsReadAction } & MenuControlProps) {
  const [readIds, setReadIds] = useState<string[]>(initialReadIds);
  const [readPending, startReadTransition] = useTransition();
  const visible = notifications.map((item) => ({ ...item, unread: item.unread && !readIds.includes(item.id) }));
  const unreadCount = visible.filter((item) => item.unread).length;

  return (
    <MenuShell
      id="notifications"
      label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
      openMenu={openMenu}
      setOpenMenu={setOpenMenu}
      trigger={<span className="glass-soft relative flex h-11 w-11 items-center justify-center rounded-lg text-slate-300 transition hover:border-white/20"><Bell size={16} aria-hidden="true" />{unreadCount ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-300" /> : null}</span>}
    >
      <div className={panelClass} role="menu">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">Notifications</p><p className="mt-1 text-sm text-slate-400">Sync, member, and knowledge-gap updates.</p></div>
          <button className="text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-60" type="button" disabled={readPending} onClick={() => { const nextIds = notifications.map((item) => item.id); setReadIds(nextIds); startReadTransition(async () => { const formData = new FormData(); nextIds.forEach((id) => formData.append("notificationId", id)); await markNotificationsReadAction(formData); }); }}>{readPending ? "Saving..." : "Mark all read"}</button>
        </div>
        <div className="max-h-[440px] overflow-y-auto p-3">
          {visible.length ? visible.map((item) => (
            <Link key={item.id} href={item.href} className="mb-2 block rounded-lg border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/20" onClick={() => setOpenMenu(null)}>
              <div className="flex items-start gap-3">
                <span className={`mt-1 h-2 w-2 rounded-full ${item.unread ? "bg-blue-300" : "bg-slate-700"}`} />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-white">{item.title}</span><span className="mt-1 block text-sm leading-5 text-slate-400">{item.body}</span><span className="mt-2 block text-xs text-slate-600">{item.timestamp}</span></span>
              </div>
            </Link>
          )) : (
            <div className="rounded-lg border border-dashed border-white/10 p-6 text-center"><Check className="mx-auto text-emerald-200" size={22} /><h2 className="mt-3 font-outfit text-xl font-semibold">You are all caught up</h2><p className="mt-2 text-sm leading-6 text-slate-400">New sync updates, member activity, and knowledge gaps will appear here.</p></div>
          )}
        </div>
        <div className="border-t border-white/10 p-3"><Link href="/app/notifications" className="inline-flex w-full items-center justify-between rounded-md bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:bg-slate-200" onClick={() => setOpenMenu(null)}>Open notification history <ChevronRight size={15} /></Link></div>
      </div>
    </MenuShell>
  );
}

function AccountMenu({ userName, email, organizationName, role, avatarUrl, signOutAction, openMenu, setOpenMenu }: Pick<TopNavigationProps, "userName" | "email" | "organizationName" | "role" | "avatarUrl" | "signOutAction"> & MenuControlProps) {
  return (
    <MenuShell
      id="account"
      label="Account menu"
      openMenu={openMenu}
      setOpenMenu={setOpenMenu}
      trigger={
        <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-slate-500 to-slate-900 text-sm font-semibold text-white transition hover:border-white/30">
          {avatarUrl ? <span className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${avatarUrl})` }} aria-hidden="true" /> : initials(userName, email)}
        </span>
      }
    >
      <div className={panelClass} role="menu">
        <div className="border-b border-white/10 p-4">
          <p className="font-semibold text-white">{userName}</p>
          <p className="mt-1 truncate text-sm text-slate-400">{email}</p>
          <p className="mt-1 truncate text-sm text-slate-500">{organizationName} · {roleLabel(role)}</p>
        </div>
        <div className="p-3">
          <Link className={itemClass} href="/app/profile" onClick={() => setOpenMenu(null)}><User size={16} aria-hidden="true" /> Profile</Link>
          <Link className={itemClass} href="/app/account" onClick={() => setOpenMenu(null)}><Shield size={16} aria-hidden="true" /> Account settings</Link>
          {role === "owner" || role === "admin" ? <Link className={itemClass} href="/app/settings" onClick={() => setOpenMenu(null)}><Settings size={16} aria-hidden="true" /> Organization settings</Link> : null}
          <Link className={itemClass} href="/app/billing" onClick={() => setOpenMenu(null)}><CreditCard size={16} aria-hidden="true" /> Billing</Link>
        </div>
        <div className="border-t border-white/10 p-3">
          <form action={signOutAction}>
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold text-rose-100 transition hover:bg-rose-500/10" type="submit"><LogOut size={16} aria-hidden="true" /> Sign out</button>
          </form>
        </div>
      </div>
    </MenuShell>
  );
}

export function TopNavigation(props: TopNavigationProps) {
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const menuControl = { openMenu, setOpenMenu };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
      {props.canManage ? <QuickCreateMenu canManage={props.canManage} inviteMemberAction={props.inviteMemberAction} startSyncAction={props.startSyncAction} {...menuControl} /> : null}
      <Link href="/app/sync" className="glass-soft hidden h-11 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 md:inline-flex"><RefreshCw size={16} aria-hidden="true" /> Sync setup</Link>
      <UsageMenu dailyUsage={props.dailyUsage} {...menuControl} />
      <HelpMenu {...menuControl} />
      <NotificationsMenu notifications={props.notifications} initialReadIds={props.readNotificationIds} markNotificationsReadAction={props.markNotificationsReadAction} {...menuControl} />
      <AccountMenu userName={props.userName} email={props.email} organizationName={props.organizationName} role={props.role} avatarUrl={props.avatarUrl} signOutAction={props.signOutAction} {...menuControl} />
    </div>
  );
}
