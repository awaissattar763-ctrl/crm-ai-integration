"use client";

import { useMemo, useState } from "react";
import { Contact, EmailDraft, STAGE_LABELS, draftEmail } from "../lib/crm";
import { Tone, tierBadge } from "../lib/scoring";

const TONES: { key: Tone; label: string }[] = [
  { key: "friendly", label: "😊 Friendly" },
  { key: "professional", label: "💼 Professional" },
  { key: "concise", label: "⚡ Concise" },
];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ContactDetail({
  contact,
  onSimulatedSend,
}: {
  contact: Contact;
  onSimulatedSend: (contact: Contact, draft: EmailDraft) => void;
}) {
  const [tone, setTone] = useState<Tone>("friendly");
  const [variant, setVariant] = useState(0);
  const [sent, setSent] = useState(false);

  const draft = useMemo(
    () => draftEmail(contact, tone, variant),
    [contact, tone, variant]
  );
  const badge = tierBadge(contact.tier);

  const regenerate = () => {
    setVariant((v) => v + 1);
    setSent(false);
  };
  const switchTone = (t: Tone) => {
    setTone(t);
    setVariant(0);
    setSent(false);
  };
  const send = () => {
    onSimulatedSend(contact, draft);
    setSent(true);
  };

  const timeline = [
    {
      when: fmtDate(contact.lastActivity),
      text: `Last activity — ${contact.emailsOpened} emails opened, ${contact.siteVisits} site visits, ${contact.calls} calls logged`,
    },
    {
      when: fmtDate(contact.createdAt),
      text: `Added via ${contact.source}`,
    },
  ];

  return (
    <div className="msg-in flex h-full flex-col gap-4">
      {/* Identity + score */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">
              {contact.firstName} {contact.lastName}
            </h3>
            <p className="text-sm text-zinc-400">
              {contact.title ? `${contact.title} · ` : ""}
              {contact.company}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {contact.email}
              {contact.phone ? ` · ${contact.phone}` : ""} ·{" "}
              {STAGE_LABELS[contact.stage]}
            </p>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full border text-lg font-bold ${badge.classes}`}
            >
              {badge.label}
            </span>
            <p className="mt-1 text-xs text-zinc-400">
              <span className="font-bold text-cyan-300">{contact.score}</span>/100
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-black/30 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
            🧠 Why this AI score
          </p>
          <ul className="space-y-1.5 text-xs text-zinc-400">
            {contact.scoreReasons.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-cyan-400">›</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* AI-drafted email */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            ✉️ Auto-drafted follow-up{" "}
            <span className="ml-1 rounded bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-300">
              SIMULATED
            </span>
          </h4>
          <div className="flex gap-1.5">
            {TONES.map((t) => (
              <button
                key={t.key}
                onClick={() => switchTone(t.key)}
                className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                  tone === t.key
                    ? "border-cyan-500/60 bg-cyan-500/10 text-cyan-300"
                    : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs text-zinc-500">
            To: <span className="text-zinc-300">{contact.email}</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-100">
            Subject: {draft.subject}
          </p>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-300">
            {draft.body}
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={regenerate}
            className="rounded-lg border border-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-900"
          >
            ↻ Regenerate draft
          </button>
          <button
            onClick={send}
            disabled={sent}
            className="flex-1 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-cyan-400 disabled:cursor-default disabled:opacity-60"
          >
            {sent ? "✓ Queued (simulated — nothing sent)" : "Queue send (simulated) →"}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
          Activity timeline
        </h4>
        <div className="space-y-3">
          {timeline.map((t, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
                {i < timeline.length - 1 && (
                  <span className="h-8 w-px bg-zinc-800" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-400">{t.when}</p>
                <p className="text-sm text-zinc-300">{t.text}</p>
              </div>
            </div>
          ))}
        </div>
        {contact.notes && (
          <p className="mt-4 rounded-lg border border-zinc-800 bg-black/30 p-3 text-xs leading-relaxed text-zinc-400">
            <span className="font-semibold text-zinc-300">Note:</span>{" "}
            {contact.notes}
          </p>
        )}
      </div>
    </div>
  );
}
