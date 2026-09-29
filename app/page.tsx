"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ContactTable from "../components/ContactTable";
import ContactDetail from "../components/ContactDetail";
import DuplicatesCard from "../components/DuplicatesCard";
import ActivityFeed from "../components/ActivityFeed";
import {
  Contact,
  EmailDraft,
  FeedEvent,
  findDuplicateGroups,
  loadContacts,
  mergeGroup,
  randomFeedEvent,
  resetContacts,
  saveContacts,
  seedFeed,
} from "../lib/crm";
import { scoreContact } from "../lib/scoring";

function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8).toUpperCase()
  );
}

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  title: "",
  source: "Website form",
};

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [live, setLive] = useState(true);
  const [emailsQueued, setEmailsQueued] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const contactsRef = useRef<Contact[]>([]);
  contactsRef.current = contacts;

  useEffect(() => {
    const loaded = loadContacts();
    setContacts(loaded);
    setSelectedId(loaded[0]?.id ?? null);
    setFeed(seedFeed());
  }, []);

  // Simulated live pipeline-sync events
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => {
      const list = contactsRef.current;
      if (list.length === 0) return;
      setFeed((prev) => [randomFeedEvent(list), ...prev].slice(0, 30));
    }, 4000);
    return () => clearInterval(t);
  }, [live]);

  const persist = (list: Contact[]) => {
    setContacts(list);
    saveContacts(list);
  };

  const pushFeed = (text: string, kind: FeedEvent["kind"] = "sync") =>
    setFeed((prev) =>
      [{ id: uid(), ts: new Date().toISOString(), kind, text }, ...prev].slice(0, 30)
    );

  const selected = contacts.find((c) => c.id === selectedId) ?? null;

  const dupGroups = useMemo(
    () => findDuplicateGroups(contacts),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contacts]
  );

  const stats = useMemo(() => {
    const a = contacts.filter((c) => c.tier === "A").length;
    const avg =
      contacts.length > 0
        ? Math.round(contacts.reduce((s, c) => s + c.score, 0) / contacts.length)
        : 0;
    return { total: contacts.length, a, avg, dups: dupGroups.length };
  }, [contacts, dupGroups]);

  const onMerge = (ids: string[]) => {
    const merged = mergeGroup(contacts, ids);
    persist(merged);
    const names = ids
      .map((id) => contacts.find((c) => c.id === id))
      .filter(Boolean)
      .map((c) => `${c!.firstName} ${c!.lastName}`)
      .join(" + ");
    pushFeed(`🧹 Merged duplicate records: ${names}`, "merge");
    setSelectedId(merged[0]?.id ?? null);
  };

  const onSimulatedSend = (contact: Contact, draft: EmailDraft) => {
    setEmailsQueued((n) => n + 1);
    pushFeed(
      `✉️ Follow-up queued (simulated) to ${contact.firstName} ${contact.lastName} — “${draft.subject}”`,
      "email"
    );
  };

  const onReset = () => {
    const s = resetContacts();
    setContacts(s);
    setSelectedId(s[0]?.id ?? null);
    setEmailsQueued(0);
    setFeed(seedFeed());
    setQuery("");
    setShowAdd(false);
    setForm(EMPTY_FORM);
  };

  const addContact = (e: React.FormEvent) => {
    e.preventDefault();
    const r = scoreContact({
      email: form.email,
      title: form.title,
      phone: form.phone,
      source: form.source,
      lastActivity: new Date().toISOString(),
      emailsOpened: 0,
      siteVisits: 0,
      calls: 0,
    });
    const c: Contact = {
      id: uid(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || "(sample)",
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
      company: form.company.trim(),
      title: form.title.trim() || undefined,
      source: form.source,
      stage: "new",
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      emailsOpened: 0,
      siteVisits: 0,
      calls: 0,
      score: r.score,
      tier: r.tier,
      scoreReasons: r.reasons,
    };
    const list = [c, ...contacts];
    persist(list);
    setSelectedId(c.id);
    setShowAdd(false);
    setForm(EMPTY_FORM);
    pushFeed(`➕ New contact added: ${c.firstName} ${c.lastName} — AI scored ${c.score}/100 (Tier ${c.tier})`, "sync");
    // Re-run duplicate detection visibility
    const after = findDuplicateGroups(list).filter((g) => g.ids.includes(c.id));
    if (after.length > 0) {
      pushFeed(`⚠️ Possible duplicate flagged for ${c.firstName} ${c.lastName} — review the duplicates panel`, "duplicate");
    }
  };

  const setField = (k: keyof typeof EMPTY_FORM) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-lg">
              🗄️
            </span>
            <span className="font-semibold tracking-tight">
              SyncCRM <span className="text-zinc-500">AI</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-300">
              CONCEPT DEMO — SIMULATED
            </span>
            <button
              onClick={onReset}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-900"
            >
              Reset demo data
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 pb-8 pt-12 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Your CRM, <span className="text-cyan-400">enriched by AI</span> —
          automatically.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-zinc-400">
          A concept demo of an AI layer on a small-business CRM. Every contact
          gets a transparent AI score, duplicates are detected and merged, and
          follow-up emails are drafted for you — while a live feed keeps every
          system in sync.
        </p>
        <p className="mt-3 text-xs text-zinc-600">
          Nothing here is connected to real services — scoring, enrichment,
          emails and sync are all simulated in your browser. All contacts are
          fictional sample data.
        </p>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-5 pb-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Total contacts", String(stats.total), "text-zinc-100"],
            ["Tier A leads", String(stats.a), "text-emerald-300"],
            ["Duplicate groups", String(stats.dups), "text-amber-300"],
            ["Emails queued (simulated)", String(emailsQueued), "text-cyan-300"],
          ].map(([label, value, cls]) => (
            <div
              key={label}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4"
            >
              <p className="text-xs text-zinc-500">{label}</p>
              <p className={`mt-1 text-2xl font-bold ${cls}`}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Add contact */}
      <section className="mx-auto max-w-7xl px-5 pb-8">
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-xl border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-300 transition hover:border-cyan-500/50 hover:text-cyan-300"
          >
            ＋ Add a contact — watch the AI score it and check for duplicates
          </button>
        ) : (
          <form
            onSubmit={addContact}
            className="msg-in rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Add contact</h3>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Cancel ✕
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["firstName", "First name", "Jane"],
                  ["lastName", "Last name", "Cooper"],
                  ["email", "Email", "jane@company.com"],
                  ["phone", "Phone (optional)", "(555) 010-2030"],
                  ["company", "Company", "Cooper HVAC"],
                  ["title", "Title (optional)", "Owner"],
                ] as const
              ).map(([k, label, ph]) => (
                <label key={k} className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-400">
                    {label}
                  </span>
                  <input
                    required={k === "firstName" || k === "email" || k === "company"}
                    type={k === "email" ? "email" : "text"}
                    value={form[k]}
                    onChange={setField(k)}
                    placeholder={ph}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none placeholder:text-zinc-600 focus:border-cyan-500/60"
                  />
                </label>
              ))}
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-400">
                  Source
                </span>
                <select
                  value={form.source}
                  onChange={setField("source")}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-500/60"
                >
                  {["Website form", "Referral", "Walk-in", "Import CSV"].map(
                    (s) => (
                      <option key={s}>{s}</option>
                    )
                  )}
                </select>
              </label>
            </div>
            <button
              type="submit"
              className="mt-4 rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-400"
            >
              Add & AI-score →
            </button>
          </form>
        )}
      </section>

      {/* Main dashboard */}
      <section className="mx-auto max-w-7xl px-5 pb-10">
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="h-[560px]">
              <ContactTable
                contacts={contacts}
                selectedId={selectedId}
                onSelect={setSelectedId}
                query={query}
                onQuery={setQuery}
              />
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="h-[560px] overflow-y-auto feed-scroll pr-1">
              {selected ? (
                <ContactDetail
                  contact={selected}
                  onSimulatedSend={onSimulatedSend}
                />
              ) : (
                <p className="rounded-2xl border border-zinc-800 p-10 text-center text-sm text-zinc-500">
                  Select a contact to see its AI score and drafted follow-up.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <DuplicatesCard
            groups={dupGroups}
            contacts={contacts}
            onMerge={onMerge}
          />
          <ActivityFeed
            events={feed}
            live={live}
            onToggleLive={() => setLive((v) => !v)}
          />
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-zinc-800/80 bg-zinc-900/20">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <h2 className="text-center text-2xl font-bold tracking-tight">
            What the AI layer does
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-zinc-500">
            Five jobs that keep a small-business CRM clean, current and
            action-ready — without manual data entry.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["📥", "Import", "Contacts flow in from website forms, CSV imports, referrals and walk-ins — deduped at the door."],
              ["🧠", "Score", "A transparent rule-based engine scores every contact 0–100 from domain, title, source, engagement and recency. No black box."],
              ["⚠️", "Dedupe", "Same email or same name + company gets flagged as a possible duplicate, then merged in one click."],
              ["✉️", "Draft", "Follow-up emails are auto-drafted in three tones from each contact's real signals — ready to review, never auto-sent."],
              ["🔄", "Sync", "Every change streams to a live activity feed — in production this syncs the CRM, inbox, calendar and website."],
            ].map(([icon, title, body]) => (
              <div
                key={title}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5"
              >
                <p className="text-2xl">{icon}</p>
                <h3 className="mt-2 font-semibold">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simulated vs real */}
      <section className="mx-auto max-w-7xl px-5 py-14">
        <h2 className="text-center text-2xl font-bold tracking-tight">
          Honest breakdown: simulated vs. real
        </h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-6">
            <h3 className="font-semibold text-amber-300">
              Simulated in this demo
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>• Scoring, enrichment, dedupe, email drafts — all in-browser</li>
              <li>• Contacts persist only in your browser (localStorage)</li>
              <li>• Sync feed events are generated on a timer</li>
              <li>• No emails are actually sent anywhere</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-6">
            <h3 className="font-semibold text-cyan-300">
              Real in production
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              <li>• Same scoring rules run server-side on every new contact</li>
              <li>• Real CRM (HubSpot / Supabase) via API — two-way sync</li>
              <li>• Drafts go through owner approval before sending</li>
              <li>• Webhooks keep inbox, calendar and website in sync for real</li>
            </ul>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-zinc-600">
          This is a concept demo built to show what the integration looks like —
          not a client project, and no client names, testimonials or results are
          claimed anywhere.
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/80">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-zinc-600 sm:flex-row">
          <p>
            SyncCRM AI — concept demo. Simulated; no real services connected.
          </p>
          <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-300">
            MOCK CRM — BROWSER ONLY
          </span>
        </div>
      </footer>
    </div>
  );
}
