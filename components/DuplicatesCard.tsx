"use client";

import { Contact, DuplicateGroup } from "../lib/crm";

export default function DuplicatesCard({
  groups,
  contacts,
  onMerge,
}: {
  groups: DuplicateGroup[];
  contacts: Contact[];
  onMerge: (ids: string[]) => void;
}) {
  const byId = new Map(contacts.map((c) => [c.id, c]));

  return (
    <div className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-amber-300">
          ⚠️ Duplicate detection
        </h3>
        <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
          {groups.length} group{groups.length === 1 ? "" : "s"}
        </span>
      </div>

      {groups.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-400">
          ✓ No duplicates found — the CRM is clean. Add a contact with an
          existing email to see detection in action.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {groups.map((g, i) => (
            <div
              key={i}
              className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {g.ids
                      .map((id) => {
                        const c = byId.get(id);
                        return c ? `${c.firstName} ${c.lastName}` : "?";
                      })
                      .join("  ↔  ")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {g.reasons.map((r) => `• ${r}`).join("  ")}
                  </p>
                </div>
                <button
                  onClick={() => onMerge(g.ids)}
                  className="rounded-lg border border-amber-400/40 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/10"
                >
                  Merge records →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[11px] text-zinc-600">
        Detection is rule-based: same email (case-insensitive) or same name +
        company. Merging keeps the most recently active record and combines
        engagement stats.
      </p>
    </div>
  );
}
