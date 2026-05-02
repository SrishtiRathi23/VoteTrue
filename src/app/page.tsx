import Link from "next/link";
import {
  AppShell,
  Confidence,
  Eyebrow,
  SourceChip,
  Verdict,
} from "@/components/votetrue/DesignPrimitives";

export default function Home() {
  return (
    <AppShell active="home">
      <div className="page">
        <section className="container" style={{ paddingBottom: 56, paddingTop: 64 }}>
          <div
            style={{
              alignItems: "start",
              display: "grid",
              gap: 80,
              gridTemplateColumns: "1.1fr 0.9fr",
            }}
          >
            <div>
              <Eyebrow num="01">Civic verification, source-backed</Eyebrow>
              <h1 style={{ fontSize: 56, letterSpacing: "-0.022em", lineHeight: 1.05, marginTop: 22 }}>
                Got a suspicious
                <br />
                WhatsApp forward?
              </h1>
              <p
                style={{
                  color: "var(--ink-2)",
                  fontSize: 18,
                  lineHeight: 1.55,
                  marginTop: 22,
                  maxWidth: 540,
                }}
              >
                Upload it, and we&apos;ll check every claim against official Election Commission
                of India documents - with verdicts, citations, and plain-language explanations.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 32 }}>
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
              <div
                style={{
                  alignItems: "center",
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 18,
                  marginTop: 28,
                }}
              >
                <span className="eci-badge">Backed by official ECI documents</span>
                <span
                  style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 12 }}
                >
                  Non-partisan - No ads - No tracking
                </span>
              </div>
            </div>
            <DemoPreview />
          </div>
        </section>

        <hr className="divider" />

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
            {[
              ["01", "Read the forward", "We extract text from screenshots, images, or pasted messages."],
              ["02", "Identify each claim", "Long forwards are split into separate, checkable factual claims."],
              ["03", "Cross-check ECI sources", "Each claim is matched against indexed Election Commission of India publications."],
              ["04", "Show the verdict", "True, Misleading, or Unverifiable - with the source on every result."],
            ].map(([n, title, body]) => (
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

        <hr className="divider" />

        <section className="container" style={{ padding: "56px 28px" }}>
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
              <VerdictExplainer
                body="The claim is supported by an official ECI publication or rule."
                example="Voters can use accepted photo IDs at the polling booth."
                kind="true"
                title="True"
              />
              <VerdictExplainer
                body="Part of the claim is true, but framing or context is wrong."
                example="Polling hours are official; forwarded local exceptions need proof."
                kind="misleading"
                title="Misleading"
              />
              <VerdictExplainer
                body="No official source confirms or denies. We flag it and stop."
                example="Anecdotal reports without ECI documentation."
                kind="unverifiable"
                title="Unverifiable"
              />
            </div>
          </div>
        </section>

        <hr className="divider" />

        <section className="container" style={{ padding: "56px 28px 80px" }}>
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1fr 1fr" }}>
            <ToolCard
              body="Have a question like 'What ID do I need to vote?' Type it. Get a short, cited answer."
              cta="Ask a question"
              href="/ask"
              tag="Direct doubts"
              title="Ask VoteTrue"
            />
            <ToolCard
              body="Eight common election myths, corrected. Built for sharing in family WhatsApp groups."
              cta="Browse myths"
              href="/myths"
              tag="Civic education"
              title="Myths & Facts"
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function DemoPreview() {
  return (
    <div className="card" style={{ boxShadow: "var(--shadow)", overflow: "hidden", padding: 0 }}>
      <div
        style={{
          alignItems: "center",
          background: "var(--paper-2)",
          borderBottom: "1px solid var(--rule)",
          color: "var(--ink-3)",
          display: "flex",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          justifyContent: "space-between",
          letterSpacing: "0.06em",
          padding: "10px 16px",
        }}
      >
        <span>VERIFICATION RESULT - CASE #VT-2026-0418</span>
        <span style={{ color: "var(--true-ink)" }}>Complete</span>
      </div>
      <div style={{ padding: 22 }}>
        <div className="eyebrow">Original claim</div>
        <p
          style={{
            background: "var(--paper-2)",
            border: "1px solid var(--rule-2)",
            borderRadius: 6,
            color: "var(--ink-2)",
            fontSize: 14.5,
            fontStyle: "italic",
            lineHeight: 1.55,
            marginTop: 10,
            padding: "12px 14px",
          }}
        >
          &quot;Polling closes at 3 PM in your area. Vote early or you&apos;ll miss it!&quot;
        </p>
        <div style={{ marginTop: 18 }}>
          <Verdict kind="misleading" />
        </div>
        <p style={{ color: "var(--ink)", fontSize: 14, lineHeight: 1.55, marginTop: 14 }}>
          Polling hours should be checked against official ECI notices, not forwarded messages.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          <SourceChip doc="ECI Handbook for Polling Personnel" page="Ch 4.2" />
          <SourceChip doc="Conduct of Elections Rules, 1961" />
        </div>
        <div style={{ marginTop: 16 }}>
          <Confidence value={94} />
        </div>
      </div>
    </div>
  );
}

function VerdictExplainer({
  body,
  example,
  kind,
  title,
}: {
  body: string;
  example: string;
  kind: "true" | "misleading" | "unverifiable";
  title: string;
}) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <Verdict kind={kind} label={title} />
      <p style={{ color: "var(--ink-2)", fontSize: 13.5, lineHeight: 1.5, marginTop: 14 }}>
        {body}
      </p>
      <div
        style={{
          background: "var(--paper-2)",
          borderLeft: "2px solid var(--rule)",
          color: "var(--ink-3)",
          fontSize: 12,
          fontStyle: "italic",
          lineHeight: 1.5,
          marginTop: 14,
          padding: "10px 12px",
        }}
      >
        e.g. {example}
      </div>
    </div>
  );
}

function ToolCard({
  body,
  cta,
  href,
  tag,
  title,
}: {
  body: string;
  cta: string;
  href: string;
  tag: string;
  title: string;
}) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", padding: 28 }}>
      <div className="eyebrow">{tag}</div>
      <h3 style={{ fontSize: 26, letterSpacing: "-0.015em", marginTop: 12 }}>{title}</h3>
      <p style={{ color: "var(--ink-2)", flex: 1, fontSize: 14.5, lineHeight: 1.55, marginTop: 10 }}>
        {body}
      </p>
      <Link className="btn" href={href} style={{ alignSelf: "flex-start", marginTop: 22 }}>
        {cta} <span className="arrow">-&gt;</span>
      </Link>
    </div>
  );
}
