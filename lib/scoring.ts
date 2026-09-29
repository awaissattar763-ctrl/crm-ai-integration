// Transparent, rule-based contact scoring engine for the AI-enriched CRM demo.
// Every point is explainable — reasons[] lists exactly what changed the score.

export type Tier = "A" | "B" | "C";
export type Tone = "friendly" | "professional" | "concise";

export interface ScoreResult {
  score: number; // 0–100
  tier: Tier;
  reasons: string[]; // human-readable explanation of the score
}

const FREE_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "protonmail.com",
];

const DECISION_TITLES = ["owner", "ceo", "founder", "director", "partner"];
const MANAGER_TITLES = ["manager", "lead", "supervisor", "coordinator"];

const SPAM_HINTS = ["promo", "seo", "blast", "marketing-services"];

export interface ScoreSignals {
  email: string;
  title?: string;
  phone?: string;
  source: string;
  lastActivity: string; // ISO
  emailsOpened: number;
  siteVisits: number;
  calls: number;
}

export function scoreContact(s: ScoreSignals): ScoreResult {
  let score = 10; // every contact starts at 10
  const reasons: string[] = [];

  // Email domain
  const domain = (s.email.split("@")[1] || "").toLowerCase();
  if (SPAM_HINTS.some((h) => s.email.toLowerCase().includes(h))) {
    score -= 30;
    reasons.push("Spam-like email pattern detected: −30 pts");
  } else if (domain && !FREE_DOMAINS.includes(domain)) {
    score += 15;
    reasons.push(`Business email domain (${domain}): +15 pts`);
  } else {
    reasons.push(`Free/personal email domain: +0 pts`);
  }

  // Title / authority
  const title = (s.title || "").toLowerCase();
  if (DECISION_TITLES.some((t) => title.includes(t))) {
    score += 12;
    reasons.push(`Decision-maker title (“${s.title}”): +12 pts`);
  } else if (MANAGER_TITLES.some((t) => title.includes(t))) {
    score += 6;
    reasons.push(`Manager-level title (“${s.title}”): +6 pts`);
  } else if (title) {
    reasons.push(`Title given (“${s.title}”): +0 pts`);
  } else {
    reasons.push("No title on record: +0 pts");
  }

  // Phone on file
  if (s.phone && s.phone.trim()) {
    score += 8;
    reasons.push("Phone number on file: +8 pts");
  }

  // Source
  const src = s.source.toLowerCase();
  if (src.includes("referral")) {
    score += 10;
    reasons.push("Source: referral: +10 pts");
  } else if (src.includes("website")) {
    score += 6;
    reasons.push("Source: website form: +6 pts");
  } else if (src.includes("walk")) {
    score += 4;
    reasons.push("Source: walk-in / in-person: +4 pts");
  } else {
    score += 2;
    reasons.push("Source: imported list: +2 pts");
  }

  // Engagement
  const eo = Math.min(10, s.emailsOpened * 2);
  const sv = Math.min(6, s.siteVisits * 1);
  const cl = Math.min(9, s.calls * 3);
  score += eo + sv + cl;
  reasons.push(
    `Engagement: ${s.emailsOpened} emails opened (+${eo}), ${s.siteVisits} site visits (+${sv}), ${s.calls} calls (+${cl})`
  );

  // Recency
  const days =
    (Date.now() - new Date(s.lastActivity).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 7) {
    score += 8;
    reasons.push("Active within the last 7 days: +8 pts");
  } else if (days <= 30) {
    score += 4;
    reasons.push("Active within the last 30 days: +4 pts");
  } else if (days > 90) {
    score -= 10;
    reasons.push("No activity in 90+ days: −10 pts (going cold)");
  } else {
    reasons.push("Last activity 30–90 days ago: +0 pts");
  }

  score = Math.max(0, Math.min(100, score));
  const tier: Tier = score >= 70 ? "A" : score >= 45 ? "B" : "C";
  reasons.push(`Total clamped to 0–100 → ${score}/100 (Tier ${tier})`);

  return { score, tier, reasons };
}

export function tierBadge(tier: Tier): { label: string; classes: string } {
  if (tier === "A")
    return {
      label: "A",
      classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    };
  if (tier === "B")
    return {
      label: "B",
      classes: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    };
  return {
    label: "C",
    classes: "bg-zinc-500/15 text-zinc-400 border-zinc-600/50",
  };
}
