import Link from "next/link";
import { Eyebrow } from "@/components/votetrue/DesignPrimitives";

export function HeroSection() {
  return (
    <section className="container py-16">
      <div className="grid items-start gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div>
          <Eyebrow num="01">Civic verification, source-backed</Eyebrow>
          <h1 className="mt-6 text-[56px] leading-[1.05] tracking-normal">
            Got a suspicious
            <br />
            WhatsApp forward?
          </h1>
          <p className="mt-6 max-w-[540px] text-lg leading-7 text-[var(--ink-2)]">
            Upload it, and we&apos;ll check every claim against official Election Commission
            of India documents - with verdicts, citations, and plain-language explanations.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn civic" href="/verify">
              Verify a Forward <span className="arrow">-&gt;</span>
            </Link>
            <Link className="btn" href="/ask">
              Ask a Question
            </Link>
            <Link className="btn" href="/login">
              Optional sign in
            </Link>
          </div>
        </div>
        <div className="card overflow-hidden p-0 shadow-[var(--shadow)]">
          <div className="flex items-center justify-between border-b border-[var(--rule)] bg-[var(--paper-2)] px-4 py-3 font-mono text-[11px] tracking-[0.06em] text-[var(--ink-3)]">
            <span>VERIFICATION RESULT - CASE #VT-2026-0418</span>
            <span className="text-[var(--true-ink)]">Complete</span>
          </div>
          <div className="p-6">
            <div className="eyebrow">Original claim</div>
            <p className="mt-3 rounded-md border border-[var(--rule-2)] bg-[var(--paper-2)] px-4 py-3 text-[14.5px] italic leading-6 text-[var(--ink-2)]">
              &quot;Polling closes at 3 PM in your area. Vote early or you&apos;ll miss it!&quot;
            </p>
            <div className="mt-5 inline-flex rounded-full border border-[oklch(0.85_0.08_75)] bg-[var(--warn-soft)] px-3 py-1 font-mono text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[var(--warn-ink)]">
              Misleading
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--ink)]">
              Polling hours should be checked against official ECI notices, not forwarded
              messages.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
