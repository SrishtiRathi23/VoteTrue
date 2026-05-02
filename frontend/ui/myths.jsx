// VoteTrue — Myths & Facts

const MythsPage = () => {
  const [openIdx, setOpenIdx] = React.useState(0);

  const myths = [
    {
      myth: "You must have a Voter ID card (EPIC) to vote.",
      verdict: "misleading",
      fact: "If your name is on the electoral roll, you can vote with any of 13 accepted photo IDs — Aadhaar, passport, driving licence, PAN, and more. The EPIC is the standard, not a requirement.",
      source: { doc: "ECI Voter Guide 2026", page: "p. 12" },
      tag: "Identification",
    },
    {
      myth: "EVMs can be hacked over Bluetooth or the internet.",
      verdict: "misleading",
      fact: "Indian EVMs are standalone devices with no networking hardware — no Bluetooth, no Wi-Fi, no internet. They are not connected to any external system at any point in the polling process.",
      source: { doc: "ECI Statement on EVM Security", page: "2024" },
      tag: "EVM",
    },
    {
      myth: "Voting NOTA is the same as not voting.",
      verdict: "misleading",
      fact: "NOTA is a recorded vote and counts toward turnout. It does not currently nullify an election regardless of share, but it is a formally registered preference.",
      source: { doc: "Supreme Court · PUCL v. UoI", page: "2013" },
      tag: "NOTA",
    },
    {
      myth: "Polling booths close at 3 PM in some areas without notice.",
      verdict: "misleading",
      fact: "Polling hours are 7 AM to 6 PM in most constituencies, with any exceptions published in advance by the ECI. There is no unannounced early closure.",
      source: { doc: "Handbook for Polling Personnel", page: "Ch 4.2" },
      tag: "Polling hours",
    },
    {
      myth: "If you arrive before closing time but are still in queue, you will be turned away.",
      verdict: "true",
      fact: "Anyone in the queue at the official close time is allowed to vote, however long it takes. Polling officers are explicitly instructed to issue tokens to those waiting.",
      source: { doc: "ECI Polling Guide", page: "§7.4" },
      tag: "Polling hours",
    },
    {
      myth: "Aadhaar is now mandatory at the polling booth.",
      verdict: "misleading",
      fact: "Aadhaar is one of the accepted photo IDs, but it is not mandatory. Confusing 'accepted' with 'required' is one of the most forwarded election myths.",
      source: { doc: "ECI Press Note · Apr 2024", page: "§3" },
      tag: "Identification",
    },
    {
      myth: "VVPAT slips are destroyed immediately.",
      verdict: "misleading",
      fact: "VVPAT paper slips are sealed and stored for at least 30 months after the election, available for verification in case of disputes or audits.",
      source: { doc: "ECI VVPAT Manual", page: "§5.3" },
      tag: "VVPAT",
    },
    {
      myth: "You can vote at any polling booth in your city.",
      verdict: "misleading",
      fact: "You may only vote at the specific polling booth where you are registered. Check your booth on the ECI Voter Helpline or via the BLO before election day.",
      source: { doc: "ECI Voter Search Portal" },
      tag: "Logistics",
    },
  ];

  const tags = ["All", ...Array.from(new Set(myths.map(m => m.tag)))];
  const [activeTag, setActiveTag] = React.useState("All");
  const filtered = activeTag === "All" ? myths : myths.filter(m => m.tag === activeTag);

  return (
    <div className="page">
      <section className="container" style={{ paddingTop: 40, paddingBottom: 32 }}>
        <Eyebrow>Civic education · Plain corrections</Eyebrow>
        <h1 style={{ fontSize: 38, marginTop: 12, letterSpacing: "-0.018em" }}>
          Myths &amp; Facts
        </h1>
        <p style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 8, maxWidth: 640 }}>
          Eight myths Indian voters hear often, with the official correction. Built for sharing in family WhatsApp groups.
        </p>
      </section>

      <section className="container" style={{ paddingBottom: 80 }}>
        {/* Filter chips */}
        <div style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 20,
          paddingBottom: 18,
          borderBottom: "1px solid var(--rule)",
        }}>
          {tags.map(t => (
            <button
              key={t}
              onClick={() => setActiveTag(t)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid " + (activeTag === t ? "var(--ink)" : "var(--rule)"),
                background: activeTag === t ? "var(--ink)" : "var(--paper)",
                color: activeTag === t ? "var(--paper)" : "var(--ink-2)",
                font: "inherit",
                fontSize: 12.5,
                cursor: "pointer",
                fontFamily: "var(--font-mono)",
              }}
            >
              {t}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)", alignSelf: "center" }}>
            {filtered.length} of {myths.length} myths
          </span>
        </div>

        {/* Myth list — newspaper style */}
        <div style={{ borderTop: "1px solid var(--rule)" }}>
          {filtered.map((m, i) => (
            <MythRow
              key={i}
              index={i + 1}
              total={filtered.length}
              myth={m}
              open={openIdx === i}
              onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
            />
          ))}
        </div>

        <div style={{
          marginTop: 36,
          padding: 24,
          background: "var(--paper-2)",
          border: "1px solid var(--rule)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 style={{ fontSize: 20, letterSpacing: "-0.012em" }}>Got a forward we haven't covered?</h3>
            <p style={{ fontSize: 13.5, color: "var(--ink-2)", marginTop: 6 }}>
              Run it through verification — we'll check every claim and add common ones to this page.
            </p>
          </div>
          <button className="btn civic">Verify a forward <span className="arrow">→</span></button>
        </div>
      </section>
    </div>
  );
};

const MythRow = ({ index, total, myth, open, onToggle }) => (
  <div style={{
    borderBottom: "1px solid var(--rule)",
    transition: "background 0.15s",
    background: open ? "var(--paper-2)" : "transparent",
  }}>
    <button
      onClick={onToggle}
      style={{
        width: "100%",
        textAlign: "left",
        background: "none",
        border: "none",
        font: "inherit",
        padding: "22px 0",
        cursor: "pointer",
        display: "grid",
        gridTemplateColumns: "60px 1fr auto auto",
        gap: 24,
        alignItems: "baseline",
      }}
    >
      <div style={{
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        color: "var(--ink-3)",
        letterSpacing: "0.06em",
        paddingLeft: 4,
      }}>
        {index.toString().padStart(2, "0")} / {total.toString().padStart(2, "0")}
      </div>
      <div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>{myth.tag}</div>
        <p style={{
          fontFamily: "var(--font-serif)",
          fontSize: 22,
          lineHeight: 1.35,
          color: "var(--ink)",
          letterSpacing: "-0.012em",
        }}>
          "{myth.myth}"
        </p>
      </div>
      <Verdict kind={myth.verdict} />
      <span style={{
        fontFamily: "var(--font-mono)",
        fontSize: 14,
        color: "var(--ink-3)",
        paddingRight: 4,
        transition: "transform 0.2s",
        transform: open ? "rotate(45deg)" : "none",
      }}>+</span>
    </button>
    {open && (
      <div style={{
        padding: "0 0 24px",
        display: "grid",
        gridTemplateColumns: "60px 1fr auto auto",
        gap: 24,
      }}>
        <div></div>
        <div style={{ maxWidth: 720 }}>
          <div className="eyebrow" style={{ marginBottom: 8, color: "var(--civic-ink)" }}>The fact</div>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink)" }}>{myth.fact}</p>
          <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center" }}>
            <span className="eyebrow" style={{ marginRight: 4 }}>Source</span>
            <SourceChip doc={myth.source.doc} page={myth.source.page} />
            <button className="btn" style={{ marginLeft: "auto", padding: "8px 14px", fontSize: 13 }}>
              Share correction
            </button>
          </div>
        </div>
        <div></div>
        <div></div>
      </div>
    )}
  </div>
);

Object.assign(window, { MythsPage });
