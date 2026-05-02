// VoteTrue — Home page

const HomePage = ({ setRoute, showConfidence }) => {
  return (
    <div className="page">
      {/* Hero */}
      <section className="container" style={{ paddingTop: 64, paddingBottom: 56 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 80, alignItems: "start" }}>
          <div>
            <Eyebrow num="01">Civic verification, source-backed</Eyebrow>
            <h1 style={{ fontSize: 56, lineHeight: 1.05, marginTop: 22, letterSpacing: "-0.022em" }}>
              Got a suspicious<br />
              WhatsApp forward?
            </h1>
            <p style={{ fontSize: 18, color: "var(--ink-2)", marginTop: 22, maxWidth: 540, lineHeight: 1.55 }}>
              Upload it, and we'll check every claim against official Election Commission of India documents — with verdicts, citations, and plain-language explanations.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
              <button className="btn civic" onClick={() => setRoute("verify")}>
                Verify a Forward
                <span className="arrow">→</span>
              </button>
              <button className="btn" onClick={() => setRoute("ask")}>
                Ask a Question
              </button>
            </div>
            <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 28, flexWrap: "wrap" }}>
              <span className="eci-badge">Backed by official ECI documents</span>
              <span style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
                Non-partisan · No ads · No tracking
              </span>
            </div>
          </div>

          {/* Demo card preview */}
          <DemoPreview showConfidence={showConfidence} />
        </div>
      </section>

      <hr className="divider" />

      {/* How it works */}
      <section className="container" style={{ padding: "64px 28px" }}>
        <Eyebrow num="02">How verification works</Eyebrow>
        <h2 style={{ fontSize: 34, marginTop: 14, maxWidth: 720, letterSpacing: "-0.018em" }}>
          A four-step process. No magic, no chatbot — just careful comparison.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, marginTop: 40, background: "var(--rule)", border: "1px solid var(--rule)", borderRadius: 8, overflow: "hidden" }}>
          {[
            { n: "01", title: "Read the forward", body: "We extract text from screenshots, images, or pasted messages." },
            { n: "02", title: "Identify each claim", body: "Long forwards are split into separate, checkable factual claims." },
            { n: "03", title: "Cross-check ECI sources", body: "Each claim is matched against indexed Election Commission of India publications." },
            { n: "04", title: "Show the verdict", body: "True, Misleading, or Unverifiable — with the source on every result." },
          ].map((s, i) => (
            <div key={i} style={{ background: "var(--paper)", padding: 28 }}>
              <div className="eyebrow" style={{ color: "var(--civic-ink)" }}>{s.n}</div>
              <h3 style={{ fontSize: 18, marginTop: 14, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 13.5, color: "var(--ink-2)" }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* Verdict legend */}
      <section className="container" style={{ padding: "56px 28px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 60, alignItems: "start" }}>
          <div>
            <Eyebrow num="03">Three verdicts</Eyebrow>
            <h2 style={{ fontSize: 30, marginTop: 14, letterSpacing: "-0.018em" }}>
              Clear labels.<br />Always sourced.
            </h2>
            <p style={{ fontSize: 14.5, color: "var(--ink-2)", marginTop: 16, maxWidth: 360 }}>
              Every verdict is tied to a specific document. We never guess. If the ECI hasn't said it, we mark it Unverifiable.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <VerdictExplainer
              kind="true"
              title="True"
              body="The claim is supported by an official ECI publication or rule."
              example="Voters can use any of 12 alternative photo IDs at the polling booth."
            />
            <VerdictExplainer
              kind="misleading"
              title="Misleading"
              body="Part of the claim is true, but framing or context is wrong."
              example="Polling hours are uniform — the claim's local-time exception is false."
            />
            <VerdictExplainer
              kind="unverifiable"
              title="Unverifiable"
              body="No ECI source confirms or denies. We flag it and stop."
              example="Anecdotal reports without ECI documentation."
            />
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* Secondary tools */}
      <section className="container" style={{ padding: "56px 28px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <ToolCard
            tag="Direct doubts"
            title="Ask VoteTrue"
            body="Have a question like 'What ID do I need to vote?' Type it. Get a short, cited answer."
            cta="Ask a question"
            onClick={() => setRoute("ask")}
          />
          <ToolCard
            tag="Civic education"
            title="Myths & Facts"
            body="Eight common election myths, corrected. Built for sharing in family WhatsApp groups."
            cta="Browse myths"
            onClick={() => setRoute("myths")}
          />
        </div>
      </section>
    </div>
  );
};

const VerdictExplainer = ({ kind, title, body, example }) => (
  <div className="card" style={{ padding: 22 }}>
    <Verdict kind={kind} label={title} />
    <p style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 14, lineHeight: 1.5 }}>
      {body}
    </p>
    <div style={{
      marginTop: 14,
      padding: "10px 12px",
      background: "var(--paper-2)",
      borderLeft: "2px solid var(--rule)",
      fontSize: 12,
      color: "var(--ink-3)",
      fontStyle: "italic",
      lineHeight: 1.5,
    }}>
      e.g. {example}
    </div>
  </div>
);

const ToolCard = ({ tag, title, body, cta, onClick }) => (
  <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column" }}>
    <div className="eyebrow">{tag}</div>
    <h3 style={{ fontSize: 26, marginTop: 12, letterSpacing: "-0.015em" }}>{title}</h3>
    <p style={{ fontSize: 14.5, color: "var(--ink-2)", marginTop: 10, lineHeight: 1.55, flex: 1 }}>{body}</p>
    <button className="btn" onClick={onClick} style={{ marginTop: 22, alignSelf: "flex-start" }}>
      {cta} <span className="arrow">→</span>
    </button>
  </div>
);

const DemoPreview = ({ showConfidence }) => (
  <div className="card" style={{ padding: 0, overflow: "hidden", boxShadow: "var(--shadow)" }}>
    <div style={{
      padding: "10px 16px",
      borderBottom: "1px solid var(--rule)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      background: "var(--paper-2)",
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--ink-3)",
      letterSpacing: "0.06em",
    }}>
      <span>VERIFICATION RESULT · CASE #VT-2026-0418</span>
      <span style={{ color: "var(--true-ink)" }}>● Complete</span>
    </div>
    <div style={{ padding: 22 }}>
      <div className="eyebrow">Original claim</div>
      <p style={{
        fontSize: 14.5,
        marginTop: 10,
        padding: "12px 14px",
        background: "var(--paper-2)",
        border: "1px solid var(--rule-2)",
        borderRadius: 6,
        color: "var(--ink-2)",
        lineHeight: 1.55,
        fontStyle: "italic",
      }}>
        "Polling closes at 3 PM in your area. Vote early or you'll miss it!"
      </p>
      <div style={{ marginTop: 18 }}>
        <Verdict kind="misleading" />
      </div>
      <p style={{ fontSize: 14, marginTop: 14, color: "var(--ink)", lineHeight: 1.55 }}>
        Polling in general elections runs <strong>7 AM to 6 PM</strong> across most constituencies. There is no general "3 PM close" rule.
      </p>
      <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <SourceChip doc="ECI Handbook for Polling Personnel" page="4.2" />
        <SourceChip doc="Conduct of Elections Rules, 1961" />
      </div>
      {showConfidence && (
        <div style={{ marginTop: 16 }}>
          <Confidence value={94} />
        </div>
      )}
    </div>
  </div>
);

Object.assign(window, { HomePage });
