"use client";

import { FeedEvent } from "../lib/crm";

export default function ActivityFeed({
  events,
  live,
  onToggleLive,
}: {
  events: FeedEvent[];
  live: boolean;
  onToggleLive: () => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
      <div className="flex items-center justify-between border-b border-zinc-800/80 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${live ? "live-dot bg-emerald-400" : "bg-zinc-600"}`} />
          Pipeline sync feed
        </h3>
        <button
          onClick={onToggleLive}
          className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-300 transition hover:border-zinc-500"
        >
          {live ? "⏸ Pause" : "▶ Resume"}
        </button>
      </div>
      <div className="feed-scroll max-h-72 flex-1 space-y-2 overflow-y-auto p-4">
        {events.map((e) => (
          <div key={e.id} className="msg-in text-xs leading-relaxed">
            <span className="font-mono text-[10px] text-zinc-600">
              {new Date(e.ts).toLocaleTimeString()}
            </span>{" "}
            <span className="text-zinc-300">{e.text}</span>
          </div>
        ))}
      </div>
      <p className="border-t border-zinc-800/80 px-4 py-2.5 text-[11px] text-zinc-600">
        Simulated sync events — in production this streams from the CRM, inbox,
        calendar and website.
      </p>
    </div>
  );
}
