"use client";

import { useActionState } from "react";
import { Search, UserPlus } from "lucide-react";
import Link from "next/link";
import type { ActionState } from "@/lib/action-state";
import type { MemberStatus, OrganizationRole } from "@/lib/database.types";
import { MemberActionForms } from "@/components/organization-forms";

type ServerAction = (state: ActionState, formData: FormData) => Promise<ActionState>;

export type DirectoryOrganization = { id: string; name: string };
export type DirectoryMembership = DirectoryOrganization & {
  role: OrganizationRole;
  status: MemberStatus;
  joinedAt: string | null;
};

export type DirectoryPerson = {
  userId: string;
  email: string | null;
  fullName: string | null;
  displayName: string | null;
  jobTitle: string | null;
  department: string | null;
  mainResponsibility: string | null;
  preferredLanguage: string | null;
  recentActivityAt: string;
  memberships: DirectoryMembership[];
};

type Props = {
  people: DirectoryPerson[];
  organizations: DirectoryOrganization[];
  activeOrganizationId: string;
  addAccessAction: ServerAction;
  updateRoleAction: ServerAction;
  disableAction: ServerAction;
  removeAction: ServerAction;
  totalPeople: number;
  page: number;
  search: string;
};

const initialState: ActionState = {};
const PEOPLE_PER_PAGE = 10;

function displayName(person: DirectoryPerson) {
  return person.displayName || person.fullName || person.email || `User ${person.userId.slice(0, 8)}`;
}

function initials(label: string) {
  return label.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

function AddAccessForm({ person, organizations, action }: { person: DirectoryPerson; organizations: DirectoryOrganization[]; action: ServerAction }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const existing = new Set(person.memberships.map((membership) => membership.id));
  const available = organizations.filter((organization) => !existing.has(organization.id));

  if (available.length === 0) return <p className="text-xs text-slate-500">Access granted to every managed organization.</p>;

  return (
    <form action={formAction} className="mt-4 grid gap-2 md:grid-cols-[1fr_140px_auto] md:items-end">
      <input type="hidden" name="userId" value={person.userId} />
      <label className="text-xs font-medium text-slate-400">Organization
        <select className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-[#111] px-3 text-sm text-white" name="organizationId" defaultValue={available[0]?.id}>
          {available.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
        </select>
      </label>
      <label className="text-xs font-medium text-slate-400">Role
        <select className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-[#111] px-3 text-sm text-white" name="role" defaultValue="member">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <button className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink disabled:opacity-60" disabled={pending} type="submit">
        <UserPlus size={15} aria-hidden="true" /> {pending ? "Adding..." : "Add access"}
      </button>
      {state.error ? <p className="text-sm text-rose-200 md:col-span-3" role="alert">{state.error}</p> : null}
      {state.message ? <p className="text-sm text-emerald-200 md:col-span-3" role="status">{state.message}</p> : null}
    </form>
  );
}

export function WorkspaceMemberDirectory(props: Props) {
  const pageCount = Math.max(1, Math.ceil(props.totalPeople / PEOPLE_PER_PAGE));
  const currentPage = Math.min(Math.max(props.page, 1), pageCount);
  const pageStart = props.totalPeople === 0 ? 0 : (currentPage - 1) * PEOPLE_PER_PAGE + 1;

  function pageHref(page: number) {
    const params = new URLSearchParams();
    if (props.search) params.set("memberSearch", props.search);
    if (page > 1) params.set("memberPage", String(page));
    const qs = params.toString();
    return qs ? `/app/members?${qs}` : "/app/members";
  }

  return (
    <section className="glass-panel rounded-lg p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Member directory</p>
          <h2 className="mt-2 font-outfit text-2xl font-semibold">People across your organizations</h2>
          <p className="mt-2 text-sm text-slate-400">Only people from organizations you manage are listed. Recent users appear first.</p>
        </div>
        <form className="relative block w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} aria-hidden="true" />
          <input className="h-11 w-full rounded-lg border border-white/10 bg-black/20 pl-10 pr-3 text-sm text-white outline-none focus:border-blue-300/50" name="memberSearch" defaultValue={props.search} placeholder="Search name, team, role..." />
        </form>
      </div>

      <p className="mt-5 text-sm text-slate-500">{props.totalPeople} people</p>
      <div className="kora-scroll-panel mt-4 max-h-[760px] space-y-3 overflow-y-auto pr-2">
        {props.people.map((person) => {
          const label = displayName(person);
          const activeMembership = person.memberships.find((membership) => membership.id === props.activeOrganizationId);
          return (
            <article key={person.userId} className="rounded-lg border border-white/10 bg-white/[0.025] p-4">
              <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10 font-outfit text-sm font-semibold text-white">{initials(label)}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-white">{label}</p></div>
                    <p className="mt-1 text-sm text-slate-400">{person.jobTitle || "No job title"}{person.department ? ` / ${person.department}` : ""}</p>
                    <div className="mt-3 flex flex-wrap gap-2">{person.memberships.map((membership) => <span key={membership.id} className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-300">{membership.name} / {membership.role}</span>)}</div>
                  </div>
                </div>
                {activeMembership ? <MemberActionForms userId={person.userId} role={activeMembership.role} status={activeMembership.status} isCurrentUser={false} updateRoleAction={props.updateRoleAction} disableAction={props.disableAction} removeAction={props.removeAction} /> : null}
              </div>
              <details className="mt-4 border-t border-white/10 pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-slate-300">View profile and organization access</summary>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-3">
                  <p><span className="text-slate-500">Full name</span><br />{person.fullName || "Not provided"}</p>
                  <p><span className="text-slate-500">Email</span><br />{person.email || "Not available"}</p>
                  <p><span className="text-slate-500">Department</span><br />{person.department || "Not provided"}</p>
                  <p><span className="text-slate-500">Job title</span><br />{person.jobTitle || "Not provided"}</p>
                  <p><span className="text-slate-500">Preferred language</span><br />{person.preferredLanguage || "Not provided"}</p>
                  <p className="md:col-span-2"><span className="text-slate-500">Main responsibility</span><br />{person.mainResponsibility || "Not provided"}</p>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Organization access</p>
                  {person.memberships.map((membership) => (
                    <div key={membership.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-sm">
                      <span className="font-semibold text-white">{membership.name}</span>
                      <span className="text-slate-400">{membership.role} / {membership.status} / {membership.joinedAt ? `Joined ${new Date(membership.joinedAt).toLocaleDateString()}` : "Join date unavailable"}</span>
                    </div>
                  ))}
                </div>
                <AddAccessForm person={person} organizations={props.organizations} action={props.addAccessAction} />
              </details>
            </article>
          );
        })}
        {props.people.length === 0 ? <p className="rounded-lg border border-white/10 p-5 text-sm text-slate-400">No people match your search.</p> : null}
      </div>
      {props.totalPeople > 0 ? (
        <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">Showing {pageStart}-{Math.min(pageStart + props.people.length - 1, props.totalPeople)} of {props.totalPeople}</p>
          <div className="flex items-center gap-2">
            <Link aria-disabled={currentPage === 1} href={pageHref(Math.max(1, currentPage - 1))} className={`h-10 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold ${currentPage === 1 ? "pointer-events-none opacity-40" : "text-slate-300"}`}>Previous</Link>
            <span className="min-w-20 text-center text-sm text-slate-400">{currentPage} / {pageCount}</span>
            <Link aria-disabled={currentPage === pageCount} href={pageHref(Math.min(pageCount, currentPage + 1))} className={`h-10 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold ${currentPage === pageCount ? "pointer-events-none opacity-40" : "text-slate-300"}`}>Next</Link>
          </div>
        </div>
      ) : null}    </section>
  );
}
