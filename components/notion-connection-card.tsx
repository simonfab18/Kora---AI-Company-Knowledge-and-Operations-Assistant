"use client";

import type { ActionState } from "@/lib/action-state";
import type { NotionConnection } from "@/lib/database.types";
import { Database, ExternalLink, PlugZap, Unplug } from "lucide-react";
import { useActionState } from "react";

type ServerAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

type NotionConnectionCardProps = {
  connection: NotionConnection | null;
  canUseDevelopmentToken: boolean;
  disconnectAction: ServerAction;
  connectDevelopmentAction: () => Promise<ActionState>;
  statusMessage?: string;
};

function statusCopy(status?: string) {
  if (status === "connected") return "Notion connected.";
  if (status === "connection_failed") return "Notion could not be connected. Check configuration and try again.";
  if (status === "configuration_error") return "Notion OAuth is not configured yet.";
  if (status === "rate_limited") return "Too many Notion connection attempts right now. Wait a moment, then try again.";
  if (status === "invalid_state" || status === "expired_state") return "The Notion authorization session expired. Start again.";
  if (status === "provider_error") return "Notion returned an authorization error.";
  return null;
}

export function NotionConnectionCard({
  connection,
  canUseDevelopmentToken,
  disconnectAction,
  connectDevelopmentAction,
  statusMessage,
}: NotionConnectionCardProps) {
  const [disconnectState, disconnectFormAction, disconnectPending] = useActionState(disconnectAction, {});
  const [developmentState, developmentFormAction, developmentPending] = useActionState(() => connectDevelopmentAction(), {});
  const routeMessage = statusCopy(statusMessage);
  const connected = connection?.status === "connected";

  return (
    <section className="glass-panel rounded-lg p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">Notion connection</p>
          <h2 className="mt-3 font-outfit text-2xl font-semibold">
            {connected ? connection.notion_workspace_name : "No workspace connected"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Connect an approved Notion workspace so later milestones can synchronize pages, index knowledge, and cite original sources.
          </p>
        </div>
        <span className={`glass-soft inline-flex w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm capitalize ${connected ? "text-emerald-200" : "text-slate-300"}`}>
          <Database size={16} aria-hidden="true" />
          {connection?.status ?? "not connected"}
        </span>
      </div>

      {routeMessage || disconnectState.error || disconnectState.message || developmentState.error || developmentState.message ? (
        <div className="mt-5 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-slate-300">
          {routeMessage ?? disconnectState.error ?? disconnectState.message ?? developmentState.error ?? developmentState.message}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
        <div className="glass-soft rounded-lg p-4">
          <p className="font-semibold text-white">Workspace</p>
          <p className="mt-2 truncate text-slate-400">{connection?.notion_workspace_name ?? "Waiting for OAuth"}</p>
        </div>
        <div className="glass-soft rounded-lg p-4">
          <p className="font-semibold text-white">Last sync</p>
          <p className="mt-2 text-slate-400">{connection?.last_synced_at ? new Date(connection.last_synced_at).toLocaleString() : "Not started"}</p>
        </div>
        <div className="glass-soft rounded-lg p-4">
          <p className="font-semibold text-white">Access</p>
          <p className="mt-2 text-slate-400">Owner/admin only</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <a
          href="/api/notion/authorize"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-200"
        >
          <PlugZap size={16} aria-hidden="true" />
          {connected ? "Reconnect Notion" : "Connect Notion"}
        </a>

        {connected ? (
          <form action={disconnectFormAction}>
            <input type="hidden" name="connectionId" value={connection.id} />
            <button
              type="submit"
              disabled={disconnectPending}
              className="glass-soft inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Unplug size={16} aria-hidden="true" />
              {disconnectPending ? "Disconnecting" : "Disconnect"}
            </button>
          </form>
        ) : null}

        {canUseDevelopmentToken ? (
          <form action={developmentFormAction}>
            <button
              type="submit"
              disabled={developmentPending}
              className="glass-soft inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ExternalLink size={16} aria-hidden="true" />
              {developmentPending ? "Saving" : "Use dev token"}
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}