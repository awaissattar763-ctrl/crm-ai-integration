import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SyncCRM AI — Concept Demo",
  description:
    "Concept demo: an AI-enriched CRM for small businesses — transparent lead scoring, duplicate detection, auto-drafted follow-ups, and a pipeline-sync feed. Simulated.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
