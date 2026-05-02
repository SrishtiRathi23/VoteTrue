import { Eyebrow } from "@/components/votetrue/DesignPrimitives";
import { ToolCard } from "@/components/votetrue/home/ToolCard";
import { TrustCard } from "@/components/votetrue/home/TrustCard";

export function TrustSection() {
  return (
    <section className="container py-14">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Eyebrow num="03">Trust layer</Eyebrow>
          <h2 className="mt-4 text-3xl tracking-normal">
            Clear labels.
            <br />
            Always sourced.
          </h2>
          <p className="mt-4 max-w-[360px] text-[14.5px] text-[var(--ink-2)]">
            Every verdict is tied to a specific document. We never guess. If the ECI
            hasn&apos;t said it, we mark it Unverifiable.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <span className="eci-badge">Backed by official ECI documents</span>
            <span className="font-mono text-xs text-[var(--ink-3)]">
              Non-partisan - No ads - No tracking
            </span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <TrustCard
            body="The claim is supported by an official ECI publication or rule."
            kind="true"
            title="True"
          />
          <TrustCard
            body="Part of the claim is true, but framing or context is wrong."
            kind="misleading"
            title="Misleading"
          />
          <TrustCard
            body="No official source confirms or denies. We flag it and stop."
            kind="unverifiable"
            title="Unverifiable"
          />
        </div>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <ToolCard cta="Ask a question" href="/ask" title="Ask VoteTrue">
          Have a question like &quot;What ID do I need to vote?&quot; Type it. Get a short,
          cited answer.
        </ToolCard>
        <ToolCard cta="Browse myths" href="/myths" title="Myths & Facts">
          Eight common election myths, corrected. Built for sharing in family WhatsApp groups.
        </ToolCard>
      </div>
    </section>
  );
}
