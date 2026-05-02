"use client";

import {
  AppShell,
  Eyebrow,
  SourceChip,
  Verdict,
  VerdictKind,
} from "@/components/votetrue/DesignPrimitives";
import { useMemo, useState } from "react";

type Myth = {
  myth: string;
  verdict: VerdictKind;
  fact: string;
  source: { doc: string; page?: string };
  tag: string;
};

const myths: Myth[] = [
  {
    myth: "You must have a Voter ID card (EPIC) to vote.",
    verdict: "misleading",
    fact: "If your name is on the electoral roll, you can vote with any accepted photo ID. The EPIC is standard, but it is not the only valid document.",
    source: { doc: "ECI Voter Guide", page: "ID documents" },
    tag: "Identification",
  },
  {
    myth: "EVMs can be hacked over Bluetooth or the internet.",
    verdict: "misleading",
    fact: "Indian EVMs are standalone devices with no networking hardware. They are not connected to Wi-Fi, Bluetooth, or the internet during polling.",
    source: { doc: "ECI EVM and VVPAT Factsheet", page: "Security" },
    tag: "EVM",
  },
  {
    myth: "Voting NOTA is the same as not voting.",
    verdict: "misleading",
    fact: "NOTA is a recorded choice and appears in official results. It does not currently cancel an election by itself, but it is formally counted.",
    source: { doc: "ECI Electoral Guidance", page: "NOTA" },
    tag: "NOTA",
  },
  {
    myth: "Polling booths close at 3 PM in some areas without notice.",
    verdict: "misleading",
    fact: "Polling hours are officially notified. Voters should rely on ECI notices and voter services, not forwarded early-closure messages.",
    source: { doc: "ECI Polling Personnel Handbook", page: "Polling hours" },
    tag: "Polling hours",
  },
  {
    myth: "If you arrive before closing time but are still in queue, you will be turned away.",
    verdict: "true",
    fact: "Voters already in the queue at official closing time are generally allowed to vote according to polling procedure.",
    source: { doc: "ECI Polling Guide", page: "Queue procedure" },
    tag: "Polling hours",
  },
  {
    myth: "Aadhaar is now mandatory at the polling booth.",
    verdict: "misleading",
    fact: "Aadhaar may be accepted as one identity document, but it should not be presented as the only mandatory voting ID.",
    source: { doc: "ECI Voter Guide", page: "Accepted IDs" },
    tag: "Identification",
  },
  {
    myth: "VVPAT slips are destroyed immediately.",
    verdict: "misleading",
    fact: "VVPAT slips are sealed and stored under election procedure so they can support verification and audit processes.",
    source: { doc: "ECI VVPAT Guidelines", page: "Storage" },
    tag: "VVPAT",
  },
  {
    myth: "You can vote at any polling booth in your city.",
    verdict: "misleading",
    fact: "You must vote at the polling booth assigned to your electoral roll entry. Check your booth before election day.",
    source: { doc: "ECI Voter Services Guide", page: "Polling booth" },
    tag: "Logistics",
  },
];

export default function MythsPage() {
  const [openIndex, setOpenIndex] = useState(0);
  const [activeTag, setActiveTag] = useState("All");
  const tags = useMemo(() => ["All", ...Array.from(new Set(myths.map((myth) => myth.tag)))], []);
  const filtered = activeTag === "All" ? myths : myths.filter((myth) => myth.tag === activeTag);

  return (
    <AppShell active="myths">
      <div className="page">
        <section className="container" style={{ paddingBottom: 32, paddingTop: 40 }}>
          <Eyebrow>Civic education - Plain corrections</Eyebrow>
          <h1 style={{ fontSize: 38, letterSpacing: "-0.018em", marginTop: 12 }}>
            Myths &amp; Facts
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15, marginTop: 8, maxWidth: 640 }}>
            Eight myths Indian voters hear often, with the official correction. Built for sharing
            in family WhatsApp groups.
          </p>
        </section>

        <section className="container" style={{ paddingBottom: 80 }}>
          <div
            style={{
              borderBottom: "1px solid var(--rule)",
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              marginBottom: 20,
              paddingBottom: 18,
            }}
          >
            {tags.map((tag) => (
              <button
                aria-pressed={activeTag === tag}
                key={tag}
                onClick={() => {
                  setActiveTag(tag);
                  setOpenIndex(0);
                }}
                style={{
                  background: activeTag === tag ? "var(--ink)" : "var(--paper)",
                  border: `1px solid ${activeTag === tag ? "var(--ink)" : "var(--rule)"}`,
                  borderRadius: 999,
                  color: activeTag === tag ? "var(--paper)" : "var(--ink-2)",
                  cursor: "pointer",
                  font: "inherit",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12.5,
                  padding: "6px 12px",
                }}
                type="button"
              >
                {tag}
              </button>
            ))}
            <span
              style={{
                alignSelf: "center",
                color: "var(--ink-3)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                marginLeft: "auto",
              }}
            >
              {filtered.length} of {myths.length} myths
            </span>
          </div>

          <div style={{ borderTop: "1px solid var(--rule)" }}>
            {filtered.map((myth, index) => (
              <MythRow
                index={index + 1}
                key={`${myth.tag}-${myth.myth}`}
                myth={myth}
                onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
                open={openIndex === index}
                total={filtered.length}
              />
            ))}
          </div>

          <div
            style={{
              alignItems: "center",
              background: "var(--paper-2)",
              border: "1px solid var(--rule)",
              borderRadius: 10,
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
              marginTop: 36,
              padding: 24,
            }}
          >
            <div style={{ flex: 1, minWidth: 280 }}>
              <h3 style={{ fontSize: 20, letterSpacing: "-0.012em" }}>
                Got a forward we haven&apos;t covered?
              </h3>
              <p style={{ color: "var(--ink-2)", fontSize: 13.5, marginTop: 6 }}>
                Run it through verification - we&apos;ll check every claim and add common ones to
                this page.
              </p>
            </div>
            <a className="btn civic" href="/verify">
              Verify a forward <span className="arrow">-&gt;</span>
            </a>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function MythRow({
  index,
  myth,
  onToggle,
  open,
  total,
}: {
  index: number;
  myth: Myth;
  onToggle: () => void;
  open: boolean;
  total: number;
}) {
  return (
    <div style={{ background: open ? "var(--paper-2)" : "transparent", borderBottom: "1px solid var(--rule)" }}>
      <button
        aria-expanded={open}
        onClick={onToggle}
        style={{
          alignItems: "baseline",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "grid",
          font: "inherit",
          gap: 24,
          gridTemplateColumns: "60px 1fr auto auto",
          padding: "22px 0",
          textAlign: "left",
          width: "100%",
        }}
        type="button"
      >
        <div
          style={{
            color: "var(--ink-3)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.06em",
            paddingLeft: 4,
          }}
        >
          {index.toString().padStart(2, "0")} / {total.toString().padStart(2, "0")}
        </div>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            {myth.tag}
          </div>
          <p
            style={{
              color: "var(--ink)",
              fontFamily: "var(--font-serif)",
              fontSize: 22,
              letterSpacing: "-0.012em",
              lineHeight: 1.35,
            }}
          >
            &quot;{myth.myth}&quot;
          </p>
        </div>
        <Verdict kind={myth.verdict} />
        <span
          style={{
            color: "var(--ink-3)",
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            paddingRight: 4,
            transform: open ? "rotate(45deg)" : "none",
            transition: "transform 0.2s",
          }}
        >
          +
        </span>
      </button>
      {open ? (
        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "60px 1fr auto auto",
            padding: "0 0 24px",
          }}
        >
          <div />
          <div style={{ maxWidth: 720 }}>
            <div className="eyebrow" style={{ color: "var(--civic-ink)", marginBottom: 8 }}>
              The fact
            </div>
            <p style={{ color: "var(--ink)", fontSize: 15, lineHeight: 1.6 }}>{myth.fact}</p>
            <div style={{ alignItems: "center", display: "flex", gap: 8, marginTop: 16 }}>
              <span className="eyebrow" style={{ marginRight: 4 }}>
                Source
              </span>
              <SourceChip doc={myth.source.doc} page={myth.source.page} />
            </div>
          </div>
          <div />
          <div />
        </div>
      ) : null}
    </div>
  );
}
