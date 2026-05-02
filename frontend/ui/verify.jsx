// VoteTrue — Verify page (flagship)

const VerifyPage = ({ showConfidence }) => {
  const [stage, setStage] = React.useState("idle"); // idle | extracting | identifying | checking | done
  const [progress, setProgress] = React.useState(0);

  const stages = [
    { id: "extracting", label: "Reading the forward", detail: "Cloud OCR · extracting text from image" },
    { id: "identifying", label: "Identifying claims", detail: "Splitting message into 3 factual claims" },
    { id: "checking", label: "Cross-checking ECI sources", detail: "Searching 247 indexed documents" },
    { id: "done", label: "Verdicts ready", detail: "Complete" },
  ];

  const start = () => {
    setStage("extracting");
    let i = 0;
    const seq = ["extracting", "identifying", "checking", "done"];
    const tick = () => {
      i += 1;
      if (i < seq.length) {
        setStage(seq[i]);
        setTimeout(tick, 900);
      }
    };
    setTimeout(tick, 900);
  };

  const reset = () => { setStage("idle"); };

  return (
    <div className="page">
      <section className="container" style={{ paddingTop: 40, paddingBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Eyebrow>Flagship tool · WhatsApp Forward Verification</Eyebrow>
            <h1 style={{ fontSize: 38, marginTop: 12, letterSpacing: "-0.018em" }}>
              Verify a forward
            </h1>
            <p style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 8, maxWidth: 640 }}>
              Upload a screenshot or paste the message. We'll separate the claims and verify each one against ECI documents.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="eci-badge">ECI corpus · last indexed Apr 18, 2026</span>
          </div>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 80 }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(360px, 0.85fr) minmax(0, 1.15fr)",
          gap: 0,
          border: "1px solid var(--rule)",
          borderRadius: 10,
          background: "var(--paper)",
          overflow: "hidden",
          minHeight: 620,
        }}>
          {/* LEFT — Source */}
          <div style={{ borderRight: "1px solid var(--rule)", background: "var(--paper-2)", display: "flex", flexDirection: "column" }}>
            <div style={{
              padding: "14px 22px",
              borderBottom: "1px solid var(--rule)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
            }}>
              <span>Source · Original forward</span>
              {stage !== "idle" && (
                <button onClick={reset} style={{
                  background: "none",
                  border: "none",
                  font: "inherit",
                  color: "var(--ink-3)",
                  cursor: "pointer",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                }}>
                  ↺ New
                </button>
              )}
            </div>
            <div style={{ padding: 22, flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
              <ScreenshotPreview />
              <div>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Extracted text</div>
                <div style={{
                  background: "var(--paper)",
                  border: "1px solid var(--rule)",
                  borderRadius: 6,
                  padding: "12px 14px",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--ink-2)",
                  fontFamily: "var(--font-mono)",
                }}>
                  "URGENT! Forward to all voters. Polling closes at 3 PM in your area. Aadhaar card is now mandatory at the booth. EVMs were hacked in last election. Vote early!!"
                </div>
              </div>
              <div style={{
                fontSize: 11,
                color: "var(--ink-3)",
                fontFamily: "var(--font-mono)",
                display: "flex",
                gap: 16,
                paddingTop: 12,
                borderTop: "1px solid var(--rule)",
                marginTop: "auto",
              }}>
                <span>IMG · 1080×1920</span>
                <span>Received Apr 18</span>
                <span>3 claims found</span>
              </div>
            </div>
          </div>

          {/* RIGHT — Results */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{
              padding: "14px 22px",
              borderBottom: "1px solid var(--rule)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-3)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span>Verdicts</span>
              {stage === "done" && (
                <span style={{ color: "var(--ink-2)" }}>3 of 3 checked</span>
              )}
            </div>

            {stage === "idle" && <IdleState onStart={start} />}
            {stage !== "idle" && stage !== "done" && (
              <ProgressState stages={stages} current={stage} />
            )}
            {stage === "done" && (
              <ResultsState showConfidence={showConfidence} />
            )}
          </div>
        </div>

        {/* Trust footer */}
        <div style={{
          marginTop: 18,
          display: "flex",
          gap: 28,
          flexWrap: "wrap",
          fontSize: 12.5,
          color: "var(--ink-3)",
        }}>
          <span>↳ Your image is processed and discarded — never stored on our servers.</span>
          <span style={{ fontFamily: "var(--font-mono)", marginLeft: "auto" }}>
            All sources from <span style={{ color: "var(--civic-ink)" }}>eci.gov.in</span>
          </span>
        </div>
      </section>
    </div>
  );
};

const ScreenshotPreview = () => (
  <div style={{
    border: "1px solid var(--rule)",
    borderRadius: 8,
    overflow: "hidden",
    background: "white",
  }}>
    <div style={{
      padding: "8px 12px",
      borderBottom: "1px solid var(--rule)",
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "oklch(0.96 0.008 145)",
      fontSize: 11,
      color: "var(--ink-3)",
      fontFamily: "var(--font-mono)",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: "oklch(0.7 0.12 145)" }}></span>
      Family Group · WhatsApp screenshot
    </div>
    <div className="wa-thread" style={{ borderRadius: 0, border: "none" }}>
      <div className="wa-meta">
        <div className="avatar">UN</div>
        <span>Uncle Naresh</span>
        <span style={{ marginLeft: "auto" }}>Apr 18, 8:42 AM</span>
      </div>
      <div className="wa-bubble">
        <div className="wa-fwd">↪ Forwarded many times</div>
        <strong>URGENT! Forward to all voters.</strong><br /><br />
        Polling closes at <strong>3 PM</strong> in your area. Aadhaar card is now mandatory at the booth. EVMs were hacked in last election. Vote early!!
        <span className="time">8:42 AM ✓✓</span>
      </div>
    </div>
  </div>
);

const IdleState = ({ onStart }) => (
  <div style={{ padding: 40, flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ textAlign: "center", maxWidth: 380 }}>
      <UploadIcon />
      <h3 style={{ fontSize: 22, marginTop: 22, letterSpacing: "-0.012em" }}>
        Drop a screenshot to verify
      </h3>
      <p style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 10, lineHeight: 1.55 }}>
        PNG, JPG, or paste an image. We support English, Hindi, and 6 regional languages.
      </p>
      <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "center" }}>
        <button className="btn civic" onClick={onStart}>
          Use sample forward <span className="arrow">→</span>
        </button>
        <button className="btn">Upload image</button>
      </div>
      <div style={{
        marginTop: 26,
        padding: "10px 14px",
        background: "var(--paper-2)",
        border: "1px dashed var(--rule)",
        borderRadius: 6,
        fontSize: 12,
        color: "var(--ink-3)",
        fontFamily: "var(--font-mono)",
      }}>
        ⌘V to paste · or drop a file anywhere
      </div>
    </div>
  </div>
);

const UploadIcon = () => (
  <div style={{
    width: 64,
    height: 64,
    borderRadius: 12,
    background: "var(--civic-soft)",
    margin: "0 auto",
    display: "grid",
    placeItems: "center",
    border: "1px solid oklch(0.85 0.04 235)",
  }}>
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--civic-ink)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M12 4L7 9M12 4L17 9" />
      <path d="M4 17V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V17" />
    </svg>
  </div>
);

const ProgressState = ({ stages, current }) => {
  const currentIdx = stages.findIndex(s => s.id === current);
  return (
    <div style={{ padding: 40, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div className="eyebrow" style={{ marginBottom: 22, color: "var(--civic-ink)" }}>Verifying…</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {stages.map((s, i) => {
          const state = i < currentIdx ? "done" : i === currentIdx ? "active" : "pending";
          return (
            <div key={s.id} style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr auto",
              alignItems: "center",
              gap: 14,
              padding: "14px 4px",
              borderBottom: i < stages.length - 1 ? "1px solid var(--rule-2)" : "none",
              opacity: state === "pending" ? 0.4 : 1,
              transition: "opacity 0.3s",
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 999,
                border: state === "pending" ? "1px solid var(--rule)" : "1px solid var(--civic)",
                background: state === "done" ? "var(--civic)" : "var(--paper)",
                display: "grid", placeItems: "center",
                fontFamily: "var(--font-mono)", fontSize: 11,
                color: state === "done" ? "white" : "var(--civic-ink)",
                position: "relative",
              }}>
                {state === "done" ? "✓" : (i + 1).toString().padStart(2, "0")}
                {state === "active" && (
                  <span style={{
                    position: "absolute",
                    inset: -4,
                    borderRadius: 999,
                    border: "1px solid var(--civic)",
                    animation: "pulse 1.2s ease infinite",
                  }}></span>
                )}
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                  {s.detail}
                </div>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
                {state === "done" ? "OK" : state === "active" ? "…" : ""}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

const ResultsState = ({ showConfidence }) => {
  const claims = [
    {
      claim: "Polling closes at 3 PM in your area.",
      verdict: "misleading",
      explanation: "Polling for general elections runs uniformly from 7 AM to 6 PM in most constituencies, with minor exceptions for security-affected areas published by the ECI. There is no general '3 PM close' rule for any state.",
      sources: [
        { doc: "Handbook for Polling Personnel", page: "Ch 4.2" },
        { doc: "Conduct of Elections Rules, 1961", page: "Rule 49" },
      ],
      confidence: 94,
    },
    {
      claim: "Aadhaar card is now mandatory at the booth.",
      verdict: "misleading",
      explanation: "Aadhaar is one of 12 acceptable photo IDs at the polling booth, but it is not mandatory. Voter ID (EPIC) or any of the listed alternatives is sufficient. Confusing 'accepted' with 'mandatory' is a common error.",
      sources: [
        { doc: "ECI Press Note · Apr 2024", page: "§3" },
        { doc: "Voter Guide 2026", page: "p. 12" },
      ],
      confidence: 97,
    },
    {
      claim: "EVMs were hacked in the last election.",
      verdict: "unverifiable",
      explanation: "No verified ECI report or court ruling supports this claim. EVM tampering allegations have been raised in petitions; the Supreme Court of India dismissed the most recent challenge in 2024. We do not assess unsubstantiated allegations as 'False' — we mark them Unverifiable.",
      sources: [
        { doc: "ECI Statement on EVM Security", page: "2024" },
      ],
      confidence: null,
    },
  ];

  const counts = claims.reduce((acc, c) => {
    acc[c.verdict] = (acc[c.verdict] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: "22px 22px 28px", flex: 1, overflow: "auto" }}>
      {/* Summary strip */}
      <div style={{
        display: "flex",
        gap: 24,
        padding: "14px 18px",
        background: "var(--paper-2)",
        border: "1px solid var(--rule)",
        borderRadius: 6,
        marginBottom: 18,
        alignItems: "center",
      }}>
        <div>
          <div className="eyebrow">Summary</div>
          <div style={{ fontSize: 13.5, marginTop: 4, color: "var(--ink-2)" }}>
            This forward contains <strong style={{ color: "var(--ink)" }}>misleading</strong> and <strong style={{ color: "var(--ink)" }}>unverified</strong> claims. Do not forward.
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 14, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>
          {counts.true > 0 && <span><span style={{ color: "var(--true-ink)" }}>●</span> {counts.true} true</span>}
          {counts.misleading > 0 && <span><span style={{ color: "var(--warn-ink)" }}>●</span> {counts.misleading} misleading</span>}
          {counts.unverifiable > 0 && <span><span style={{ color: "var(--grey-ink)" }}>●</span> {counts.unverifiable} unverifiable</span>}
        </div>
      </div>

      {/* Claim cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {claims.map((c, i) => (
          <ClaimCard key={i} index={i + 1} {...c} showConfidence={showConfidence} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--rule)" }}>
        <button className="btn">Copy summary</button>
        <button className="btn">Share verdict</button>
        <button className="btn" style={{ marginLeft: "auto" }}>Download as PDF</button>
      </div>
    </div>
  );
};

const ClaimCard = ({ index, claim, verdict, explanation, sources, confidence, showConfidence }) => (
  <div style={{
    border: "1px solid var(--rule)",
    borderRadius: 8,
    background: "var(--paper)",
    padding: 20,
  }}>
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: "var(--ink-3)",
        paddingTop: 4,
        minWidth: 32,
        letterSpacing: "0.06em",
      }}>
        CLAIM<br />
        <span style={{ color: "var(--ink)", fontSize: 14, fontWeight: 600 }}>0{index}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 10 }}>
          <p style={{
            fontFamily: "var(--font-serif)",
            fontSize: 17,
            lineHeight: 1.4,
            color: "var(--ink)",
            letterSpacing: "-0.005em",
          }}>
            "{claim}"
          </p>
          <Verdict kind={verdict} />
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)", marginTop: 12 }}>
          {explanation}
        </p>
        <div style={{
          marginTop: 14,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
        }}>
          <span className="eyebrow" style={{ marginRight: 4 }}>Sources</span>
          {sources.map((s, i) => <SourceChip key={i} doc={s.doc} page={s.page} />)}
        </div>
        {showConfidence && confidence !== null && (
          <div style={{ marginTop: 14, maxWidth: 340 }}>
            <Confidence value={confidence} />
          </div>
        )}
      </div>
    </div>
  </div>
);

Object.assign(window, { VerifyPage });
