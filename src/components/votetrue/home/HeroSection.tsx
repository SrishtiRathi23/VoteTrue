import Link from "next/link";
import {
  Confidence,
  Eyebrow,
  SourceChip,
  Verdict,
} from "@/components/votetrue/DesignPrimitives";

export function HeroSection() {
  return (
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
