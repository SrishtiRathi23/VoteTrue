// VoteTrue — Ask page

const AskPage = ({ showConfidence }) => {
  const [question, setQuestion] = React.useState("What ID do I need to bring to vote?");
  const [stage, setStage] = React.useState("answered"); // idle | thinking | answered

  const submit = () => {
    setStage("thinking");
    setTimeout(() => setStage("answered"), 1400);
  };

  const suggestions = [
    "Can I vote without being on the electoral roll?",
    "Does NOTA actually count for anything?",
    "What time do polling booths close?",
    "What is VVPAT and how does it protect my vote?",
  ];

  return (
    <div className="page">
      <section className="container" style={{ paddingTop: 40, paddingBottom: 24 }}>
        <Eyebrow>Direct doubts · Question and answer</Eyebrow>
        <h1 style={{ fontSize: 38, marginTop: 12, letterSpacing: "-0.018em" }}>
          Ask VoteTrue
        </h1>
        <p style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 8, maxWidth: 640 }}>
          Type a voting question. We'll answer in plain language using only what's in official ECI documents.
        </p>
      </section>

      <section className="container" style={{ paddingBottom: 80 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }}>
          <div>
            {/* Question composer */}
            <div className="card" style={{ padding: 22 }}>
              <div className="eyebrow" style={{ marginBottom: 10 }}>Your question</div>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontFamily: "var(--font-serif)",
                  fontSize: 22,
                  lineHeight: 1.45,
                  color: "var(--ink)",
                  resize: "none",
                  padding: 0,
                  letterSpacing: "-0.01em",
                }}
              />
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid var(--rule-2)",
              }}>
                <select style={{
                  border: "1px solid var(--rule)",
                  borderRadius: 6,
                  padding: "7px 10px",
                  font: "inherit",
                  fontSize: 12.5,
                  fontFamily: "var(--font-mono)",
                  background: "var(--paper)",
                  color: "var(--ink-2)",
                }}>
                  <option>EN — English</option>
                  <option>HI — हिन्दी</option>
                  <option>TA — தமிழ்</option>
                  <option>BN — বাংলা</option>
                </select>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                  {question.length} chars
                </span>
                <button className="btn civic" style={{ marginLeft: "auto" }} onClick={submit}>
                  Verify answer <span className="arrow">→</span>
                </button>
              </div>
            </div>

            {/* Answer */}
            {stage === "thinking" && (
              <div className="card" style={{ padding: 28, marginTop: 18, color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 999, background: "var(--civic)", marginRight: 8, animation: "blink 1s infinite" }}></span>
                Searching ECI corpus · 247 documents…
                <style>{`@keyframes blink { 50% { opacity: 0.3; } }`}</style>
              </div>
            )}

            {stage === "answered" && <AnswerCard showConfidence={showConfidence} />}
          </div>

          {/* Sidebar */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 88 }}>
            <div className="card" style={{ padding: 18 }}>
              <div className="eyebrow">Try asking</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuestion(s); setStage("thinking"); setTimeout(() => setStage("answered"), 1100); }}
                    style={{
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      borderTop: i > 0 ? "1px solid var(--rule-2)" : "none",
                      padding: "10px 0",
                      fontSize: 13.5,
                      color: "var(--ink-2)",
                      cursor: "pointer",
                      font: "inherit",
                      lineHeight: 1.4,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-2)"}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              padding: 18,
              border: "1px solid var(--rule)",
              borderRadius: 10,
              background: "var(--paper-2)",
            }}>
              <div className="eyebrow">A note on accuracy</div>
              <p style={{ fontSize: 12.5, color: "var(--ink-2)", marginTop: 10, lineHeight: 1.55 }}>
                If our confidence drops below 60%, we'll redirect you to <strong style={{ color: "var(--civic-ink)" }}>eci.gov.in</strong> rather than risk a wrong answer. Voting is too important to guess.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
};

const AnswerCard = ({ showConfidence }) => (
  <div className="card" style={{ padding: 28, marginTop: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <Verdict kind="true" label="Answer · ECI-backed" />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", marginLeft: "auto" }}>
        Answered in 1.2s · 4 sources
      </span>
    </div>

    <p style={{
      fontFamily: "var(--font-serif)",
      fontSize: 22,
      lineHeight: 1.45,
      color: "var(--ink)",
      letterSpacing: "-0.008em",
    }}>
      You can vote with any one of <strong>13 accepted photo IDs</strong>. The Voter ID card (EPIC) is the standard, but it is <strong>not the only option</strong>.
    </p>

    <div style={{ marginTop: 22, paddingTop: 22, borderTop: "1px solid var(--rule-2)" }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>Accepted IDs at the polling booth</div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "6px 24px",
        fontSize: 13.5,
        color: "var(--ink-2)",
      }}>
        {[
          "Voter ID card (EPIC)",
          "Aadhaar card",
          "PAN card",
          "Indian passport",
          "Driving licence",
          "Service ID with photo",
          "Bank/Post Office passbook with photo",
          "PAN card",
          "Smart card by RGI under NPR",
          "MNREGA Job Card",
          "Health Insurance Smart Card (Min. of Labour)",
          "Pension document with photo",
        ].slice(0, 10).map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "5px 0" }}>
            <span style={{ color: "var(--civic-ink)", fontFamily: "var(--font-mono)", fontSize: 11, paddingTop: 2 }}>
              {(i + 1).toString().padStart(2, "0")}
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>

    <div style={{
      marginTop: 22,
      padding: "14px 16px",
      background: "var(--paper-2)",
      borderLeft: "2px solid var(--civic)",
      fontSize: 13,
      color: "var(--ink-2)",
      lineHeight: 1.55,
      borderRadius: "0 4px 4px 0",
    }}>
      <strong style={{ color: "var(--ink)" }}>Important:</strong> If your name is on the electoral roll, you cannot be turned away for not having an EPIC card — bring any one of the accepted IDs.
    </div>

    <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--rule-2)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      <span className="eyebrow" style={{ marginRight: 4 }}>Sources</span>
      <SourceChip doc="ECI Voter Guide 2026" page="p. 12" />
      <SourceChip doc="Press Note PN/12/2024" />
      <SourceChip doc="Form 49O Instructions" />
      <SourceChip doc="Conduct of Elections Rules" page="Rule 28" />
    </div>

    {showConfidence && (
      <div style={{ marginTop: 18, maxWidth: 360 }}>
        <Confidence value={96} />
      </div>
    )}
  </div>
);

Object.assign(window, { AskPage });
