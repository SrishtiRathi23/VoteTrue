import { Eyebrow } from "@/components/votetrue/DesignPrimitives";
import { ToolCard } from "@/components/votetrue/home/ToolCard";
import { TrustCard } from "@/components/votetrue/home/TrustCard";

export function TrustSection() {
  return (
    <section className="container" style={{ padding: "56px 28px 80px" }}>
      <div
        style={{
          alignItems: "start",
          display: "grid",
          gap: 60,
          gridTemplateColumns: "1fr 2fr",
        }}
      >
        <div>
          <Eyebrow num="03">Three verdicts</Eyebrow>
          <h2 style={{ fontSize: 30, letterSpacing: "-0.018em", marginTop: 14 }}>
            Clear labels.
            <br />
            Always sourced.
          </h2>
          <p style={{ color: "var(--ink-2)", fontSize: 14.5, marginTop: 16, maxWidth: 360 }}>
            Every verdict is tied to a specific document. We never guess. If the ECI
            hasn&apos;t said it, we mark it Unverifiable.
          </p>
        </div>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(3, 1fr)" }}>
          <TrustCard
            body="The claim is supported by an official ECI publication or rule."
            example="Voters can use accepted photo IDs at the polling booth."
            kind="true"
            title="True"
          />
          <TrustCard
            body="Part of the claim is true, but framing or context is wrong."
            example="Polling hours are official; forwarded local exceptions need proof."
            kind="misleading"
            title="Misleading"
          />
          <TrustCard
            body="No official source confirms or denies. We flag it and stop."
            example="Anecdotal reports without ECI documentation."
            kind="unverifiable"
            title="Unverifiable"
          />
        </div>
      </div>
      <section style={{ paddingTop: 56 }}>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
          <ToolCard cta="Ask a question" href="/ask" tag="Direct doubts" title="Ask VoteTrue">
            Have a question like &quot;What ID do I need to vote?&quot; Type it. Get a short,
            cited answer.
          </ToolCard>
          <ToolCard cta="Browse myths" href="/myths" tag="Civic education" title="Myths & Facts">
            Eight common election myths, corrected. Built for sharing in family WhatsApp groups.
          </ToolCard>
        </div>
      </section>
    </section>
  );
}
