"use client";

import { Contact, STAGE_LABELS } from "../lib/crm";
import { tierBadge } from "../lib/scoring";

export default function ContactTable({
  contacts,
  selectedId,
  onSelect,
  query,
  onQuery,
}: {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  query: string;
  onQuery: (q: string) => void;
}) {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? contacts.filter((c) =>
        `${c.firstName} ${c.lastName} ${c.email} ${c.company}`
          .toLowerCase()
          .includes(q)
      )
    : contacts;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
      <div className="border-b border-zinc-800/80 p-4">
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search contacts, companies, emails…"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-500/60"
        />
      </div>
      <div className="feed-scroll flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-zinc-500">
            No contacts match “{query}”.
          </p>
        )}
        {filtered.map((c) => {
          const b = tierBadge(c.tier);
          const active = c.id === selectedId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={`block w-full border-b border-zinc-800/60 px-4 py-3 text-left transition hover:bg-zinc-900/60 ${
                active ? "bg-cyan-500/5" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-zinc-100">
                  {c.firstName} {c.lastName}
                  {c.mergedCount ? (
                    <span
                      className="ml-2 rounded bg-cyan-500/15 px-1.5 py-0.5 text-[10px] text-cyan-300"
                      title="Duplicate records merged into this contact"
                    >
                      +{c.mergedCount} merged
                    </span>
                  ) : null}
                </p>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${b.classes}`}
                >
                  {b.label}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                {c.company} · {c.email}
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[11px]">
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-400">
                  {STAGE_LABELS[c.stage]}
                </span>
                <span className="text-zinc-600">
                  Score {c.score}/100
                </span>
              </div>
            </button>
          );
        })}
      </div>
      <p className="border-t border-zinc-800/80 px-4 py-2.5 text-[11px] text-zinc-600">
        {contacts.length} contacts · sample data only
      </p>
    </div>
  );
}
