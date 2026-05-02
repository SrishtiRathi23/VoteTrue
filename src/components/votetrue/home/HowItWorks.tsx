import { Eyebrow } from "@/components/votetrue/DesignPrimitives";

const steps = [
  ["01", "Read the forward", "We extract text from screenshots, images, or pasted messages."],
  ["02", "Identify each claim", "Long forwards are split into separate, checkable factual claims."],
  ["03", "Cross-check ECI sources", "Each claim is matched against indexed Election Commission of India publications."],
  ["04", "Show the verdict", "True, Misleading, or Unverifiable - with the source on every result."],
] as const;

export function HowItWorks() {
  return (
    <section className="container" style={{ padding: "64px 28px" }}>
      <Eyebrow num="02">How verification works</Eyebrow>
      <h2 style={{ fontSize: 34, letterSpacing: "-0.018em", marginTop: 14, maxWidth: 720 }}>
        A four-step process. No magic, no chatbot - just careful comparison.
      </h2>
      <div
        style={{
          background: "var(--rule)",
          border: "1px solid var(--rule)",
          borderRadius: 8,
          display: "grid",
          gap: 1,
          gridTemplateColumns: "repeat(4, 1fr)",
          marginTop: 40,
          overflow: "hidden",
        }}
      >
        {steps.map(([n, title, body]) => (
          <div key={n} style={{ background: "var(--paper)", padding: 28 }}>
            <div className="eyebrow" style={{ color: "var(--civic-ink)" }}>
              {n}
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 10, marginTop: 14 }}>{title}</h3>
            <p style={{ color: "var(--ink-2)", fontSize: 13.5 }}>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
