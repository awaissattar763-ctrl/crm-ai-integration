// Mock CRM data layer — everything lives in the browser's localStorage.
// All contacts are fictional sample data, clearly labeled "(sample)". No real
// people, companies, metrics, or testimonials anywhere.

import { ScoreResult, Tier, Tone, scoreContact } from "./scoring";

export type Stage = "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  title?: string;
  source: string;
  stage: Stage;
  createdAt: string;
  lastActivity: string; // ISO
  emailsOpened: number;
  siteVisits: number;
  calls: number;
  notes?: string;
  score: number;
  tier: Tier;
  scoreReasons: string[];
  mergedCount?: number; // how many duplicate records were merged into this one
}

export interface FeedEvent {
  id: string;
  ts: string;
  kind: "sync" | "email" | "score" | "call" | "booking" | "duplicate" | "merge";
  text: string;
}

export const STAGE_LABELS: Record<Stage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

const KEY = "crmai_contacts_v1";

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
}

function mk(
  c: Omit<Contact, "id" | "score" | "tier" | "scoreReasons"> & { id?: string }
): Contact {
  const r: ScoreResult = scoreContact({
    email: c.email,
    title: c.title,
    phone: c.phone,
    source: c.source,
    lastActivity: c.lastActivity,
    emailsOpened: c.emailsOpened,
    siteVisits: c.siteVisits,
    calls: c.calls,
  });
  return { ...c, id: c.id ?? uid(), score: r.score, tier: r.tier, scoreReasons: r.reasons };
}

// Fictional sample data for the demo business "Brightline Home Services".
export function seedContacts(): Contact[] {
  return [
    mk({
      firstName: "Sarah",
      lastName: "Mitchell (sample)",
      email: "sarah@mitchellroofing.com",
      phone: "(602) 555-0147",
      company: "Mitchell Roofing",
      title: "Owner",
      source: "Website form",
      stage: "qualified",
      createdAt: daysAgo(21),
      lastActivity: daysAgo(1),
      emailsOpened: 4,
      siteVisits: 6,
      calls: 2,
      notes: "Asked about after-hours call answering. Wants pricing this week.",
    }),
    mk({
      firstName: "sarah",
      lastName: "mitchell (sample)",
      email: "Sarah.Mitchell@mitchellroofing.com",
      company: "Mitchell Roofing",
      title: "owner",
      source: "Import CSV",
      stage: "new",
      createdAt: daysAgo(60),
      lastActivity: daysAgo(58),
      emailsOpened: 0,
      siteVisits: 0,
      calls: 0,
      notes: "Duplicate of the record above (same person, different import).",
    }),
    mk({
      firstName: "Tom",
      lastName: "Becker (sample)",
      email: "tom.becker@gmail.com",
      phone: "(480) 555-0192",
      company: "Becker Plumbing",
      title: "Operations Manager",
      source: "Referral",
      stage: "contacted",
      createdAt: daysAgo(12),
      lastActivity: daysAgo(4),
      emailsOpened: 2,
      siteVisits: 3,
      calls: 1,
    }),
    mk({
      firstName: "Thomas",
      lastName: "Becker (sample)",
      email: "TOM.BECKER@GMAIL.COM",
      company: "Becker Plumbing Co.",
      source: "Import CSV",
      stage: "new",
      createdAt: daysAgo(90),
      lastActivity: daysAgo(88),
      emailsOpened: 0,
      siteVisits: 0,
      calls: 0,
      notes: "Duplicate of Tom Becker (same email, different import).",
    }),
    mk({
      firstName: "Priya",
      lastName: "Nair (sample)",
      email: "priya@nairdental.com",
      phone: "(623) 555-0118",
      company: "Nair Dental",
      title: "Practice Manager",
      source: "Website form",
      stage: "proposal",
      createdAt: daysAgo(30),
      lastActivity: daysAgo(2),
      emailsOpened: 6,
      siteVisits: 9,
      calls: 3,
      notes: "Comparing two vendors. Proposal sent; decision expected Friday.",
    }),
    mk({
      firstName: "Marcus",
      lastName: "Webb (sample)",
      email: "marcus@webblandscaping.com",
      company: "Webb Landscaping",
      title: "Founder",
      source: "Walk-in",
      stage: "contacted",
      createdAt: daysAgo(45),
      lastActivity: daysAgo(40),
      emailsOpened: 1,
      siteVisits: 1,
      calls: 0,
    }),
    mk({
      firstName: "SEO",
      lastName: "Blast Team (sample)",
      email: "promo@seoblast-services.com",
      company: "SEO Blast",
      source: "Import CSV",
      stage: "new",
      createdAt: daysAgo(10),
      lastActivity: daysAgo(10),
      emailsOpened: 0,
      siteVisits: 0,
      calls: 0,
      notes: "Looks like a spam import — AI scored it near zero.",
    }),
    mk({
      firstName: "Dana",
      lastName: "Reyes (sample)",
      email: "dana@reyeshvac.com",
      phone: "(520) 555-0163",
      company: "Reyes HVAC",
      title: "CEO",
      source: "Referral",
      stage: "won",
      createdAt: daysAgo(120),
      lastActivity: daysAgo(95),
      emailsOpened: 8,
      siteVisits: 4,
      calls: 5,
      notes: "Closed last quarter. Reactivation candidate — no activity in 90+ days.",
    }),
  ];
}

// ---------- storage ----------

export function loadContacts(): Contact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seedContacts();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : seedContacts();
  } catch {
    return seedContacts();
  }
}

export function saveContacts(contacts: Contact[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(contacts));
  } catch {
    /* storage full or unavailable — demo continues in memory */
  }
}

export function resetContacts(): Contact[] {
  const s = seedContacts();
  saveContacts(s);
  return s;
}

// ---------- duplicate detection ----------

function normEmail(e: string): string {
  return e.trim().toLowerCase();
}
function normName(n: string): string {
  return n
    .toLowerCase()
    .replace(/\(sample\)/g, "")
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function normCompany(c: string): string {
  return c
    .toLowerCase()
    .replace(/\b(co|company|inc|llc|ltd)\b\.?/g, "")
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface DuplicateGroup {
  ids: string[];
  reasons: string[];
}

export function findDuplicateGroups(contacts: Contact[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < contacts.length; i++) {
    if (seen.has(contacts[i].id)) continue;
    const g: DuplicateGroup = { ids: [contacts[i].id], reasons: [] };
    for (let j = i + 1; j < contacts.length; j++) {
      if (seen.has(contacts[j].id)) continue;
      const a = contacts[i];
      const b = contacts[j];
      const reasons: string[] = [];
      if (normEmail(a.email) === normEmail(b.email)) {
        reasons.push("Same email address (case-insensitive match)");
      }
      const na = normName(`${a.firstName} ${a.lastName}`);
      const nb = normName(`${b.firstName} ${b.lastName}`);
      const ca = normCompany(a.company);
      const cb = normCompany(b.company);
      if (na && na === nb && ca && ca === cb && ca.length > 2) {
        reasons.push("Same name + same company");
      }
      if (reasons.length > 0) {
        g.ids.push(b.id);
        seen.add(b.id);
        g.reasons = [...new Set([...g.reasons, ...reasons])];
      }
    }
    if (g.ids.length > 1) {
      seen.add(contacts[i].id);
      groups.push(g);
    }
  }
  return groups;
}

export function mergeGroup(contacts: Contact[], ids: string[]): Contact[] {
  const byId = new Map(contacts.map((c) => [c.id, c]));
  const inGroup = ids.map((id) => byId.get(id)).filter(Boolean) as Contact[];
  if (inGroup.length < 2) return contacts;
  // Keep the most recently active record as the primary one.
  const sorted = [...inGroup].sort(
    (a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );
  const primary = sorted[0];
  const merged: Contact = {
    ...primary,
    emailsOpened: inGroup.reduce((s, c) => s + c.emailsOpened, 0),
    siteVisits: inGroup.reduce((s, c) => s + c.siteVisits, 0),
    calls: inGroup.reduce((s, c) => s + c.calls, 0),
    notes:
      (primary.notes ? primary.notes + " " : "") +
      `Merged ${inGroup.length - 1} duplicate record(s) on ${new Date().toLocaleDateString()}.`,
    mergedCount: (primary.mergedCount ?? 0) + (inGroup.length - 1),
    lastActivity: new Date().toISOString(),
  };
  const r = scoreContact({
    email: merged.email,
    title: merged.title,
    phone: merged.phone,
    source: merged.source,
    lastActivity: merged.lastActivity,
    emailsOpened: merged.emailsOpened,
    siteVisits: merged.siteVisits,
    calls: merged.calls,
  });
  merged.score = r.score;
  merged.tier = r.tier;
  merged.scoreReasons = r.reasons;

  const idSet = new Set(ids);
  return [merged, ...contacts.filter((c) => !idSet.has(c.id))];
}

// ---------- AI-drafted follow-up emails (simulated templates) ----------

const SUBJECTS: Record<Tone, string[]> = {
  friendly: [
    "Quick hello from {company-name} 👋",
    "Following up — {firstName}, still interested?",
    "A better way to handle {signal}",
  ],
  professional: [
    "Follow-up: {signal} for {company}",
    "Next steps on your {signal} inquiry",
    "{firstName} — a short proposal for {company}",
  ],
  concise: [
    "Re: your inquiry",
    "2-minute follow-up",
    "{signal} — next step?",
  ],
};

const BODIES: Record<Tone, string[]> = {
  friendly: [
    "Hi {firstName},\n\nJust checking in — you reached out about {signal} a little while ago and I wanted to make sure you got everything you needed.\n\nMost businesses like {company} tell us the biggest win is {benefit}. Happy to show you what that looks like in a quick 10-minute call — no pressure at all.\n\nWould Thursday or Friday work?\n\n— The {company-name} team",
    "Hi {firstName},\n\nI noticed you {activity} — thanks for your interest in {signal}!\n\nIf it helps, I can put together a one-page summary tailored to {company}. Just reply “yes” and I’ll send it over today.\n\nBest,\n{company-name}",
  ],
  professional: [
    "Hello {firstName},\n\nFollowing up on your recent inquiry regarding {signal} at {company}.\n\nBased on what similar businesses prioritize, {benefit} tends to be the highest-impact starting point. I’d welcome the chance to walk you through a brief plan — would a 15-minute call this week suit your schedule?\n\nKind regards,\n{company-name}",
    "Hello {firstName},\n\nPer your interest in {signal}, I’ve attached a short outline of how {company} could approach this, with typical timelines and next steps.\n\nI’m available for a brief call if you’d like to discuss — please let me know a time that works.\n\nKind regards,\n{company-name}",
  ],
  concise: [
    "Hi {firstName} — still interested in {signal}?\n\nOne line: {benefit}.\n\n10-min call this week?\n\n— {company-name}",
    "Hi {firstName},\n\nQuick follow-up on {signal} for {company}.\n\nReply “yes” and I’ll send a one-page plan today.\n\n— {company-name}",
  ],
};

function fill(tpl: string, c: Contact): string {
  const signal =
    c.notes && c.notes.length > 12
      ? c.notes.split(".")[0].toLowerCase()
      : "your recent inquiry";
  const benefit =
    c.tier === "A"
      ? "never missing another after-hours inquiry"
      : "a faster, more consistent follow-up process";
  const activity =
    c.siteVisits >= 5
      ? "spent some time on our site"
      : c.emailsOpened > 0
        ? "opened our last email"
        : "reached out recently";
  return tpl
    .replaceAll("{firstName}", c.firstName)
    .replaceAll("{company}", c.company)
    .replaceAll("{company-name}", "Brightline Home Services")
    .replaceAll("{signal}", signal)
    .replaceAll("{benefit}", benefit)
    .replaceAll("{activity}", activity);
}

export interface EmailDraft {
  subject: string;
  body: string;
  tone: Tone;
  variant: number;
}

export function draftEmail(c: Contact, tone: Tone, variant: number): EmailDraft {
  const subs = SUBJECTS[tone];
  const bodies = BODIES[tone];
  const i = variant % subs.length;
  const j = variant % bodies.length;
  return {
    subject: fill(subs[i], c),
    body: fill(bodies[j], c),
    tone,
    variant,
  };
}

// ---------- simulated pipeline-sync feed ----------

const FEED_TEMPLATES: Array<{ kind: FeedEvent["kind"]; text: (c: Contact) => string }> = [
  { kind: "sync", text: (c) => `🔄 Sync: ${c.firstName} ${c.lastName} updated in CRM from website form` },
  { kind: "email", text: (c) => `✉️ ${c.firstName} ${c.lastName} opened the follow-up email` },
  { kind: "score", text: (c) => `🧠 AI re-scored ${c.firstName} ${c.lastName}: ${c.score}/100 (Tier ${c.tier})` },
  { kind: "call", text: (c) => `📞 Call logged with ${c.firstName} ${c.lastName} — 6 min, positive` },
  { kind: "booking", text: (c) => `📅 Calendar booking synced for ${c.firstName} ${c.lastName} — Thu 10:00 AM` },
  { kind: "sync", text: (c) => `🔄 Sync: deal stage for ${c.company} moved to “${STAGE_LABELS[c.stage]}”` },
];

export function randomFeedEvent(contacts: Contact[]): FeedEvent {
  const c = contacts[Math.floor(Math.random() * contacts.length)];
  const t = FEED_TEMPLATES[Math.floor(Math.random() * FEED_TEMPLATES.length)];
  return { id: uid(), ts: new Date().toISOString(), kind: t.kind, text: t.text(c) };
}

export function seedFeed(): FeedEvent[] {
  const now = Date.now();
  const texts: Array<[FeedEvent["kind"], string]> = [
    ["sync", "🔄 Sync: CRM connected — 8 contacts imported (simulated)"],
    ["score", "🧠 AI enrichment pass complete — 8 contacts scored"],
    ["duplicate", "⚠️ Duplicate scan found 2 possible duplicate groups"],
  ];
  return texts.map(([kind, text], i) => ({
    id: uid() + i,
    ts: new Date(now - (3 - i) * 60000).toISOString(),
    kind,
    text,
  }));
}
