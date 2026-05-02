"use client";

import {
  AppShell,
  Confidence,
  Eyebrow,
  SourceChip,
  Verdict,
} from "@/components/votetrue/DesignPrimitives";
import { useState } from "react";

type Source = {
  document_name: string;
  page_number?: number | null;
  excerpt?: string | null;
};

type AskResponse = {
  answer: string;
  sources: Source[];
  confidence: number;
  language: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const suggestions = [
  "Can I vote without being on the electoral roll?",
  "Does NOTA actually count for anything?",
  "What time do polling booths close?",
  "What is VVPAT and how does it protect my vote?",
];

export default function AskPage() {
  const [question, setQuestion] = useState("What ID do I need to bring to vote?");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [stage, setStage] = useState<"idle" | "thinking" | "answered">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<AskResponse | null>(null);

  async function submit(nextQuestion = question) {
    const cleanQuestion = nextQuestion.trim();
    if (cleanQuestion.length < 5) {
      setError("Please ask a complete election question.");
      return;
    }

    setQuestion(cleanQuestion);
    setStage("thinking");
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${apiBase}/api/v1/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: cleanQuestion, language }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setResult((await response.json()) as AskResponse);
      setStage("answered");
    } catch {
      setStage("idle");
      setError("We could not verify this right now. Please try again in a moment.");
    }
  }

  return (
    <AppShell active="ask">
      <div className="page">
        <section className="container" style={{ paddingBottom: 24, paddingTop: 40 }}>
          <Eyebrow>Direct doubts - Question and answer</Eyebrow>
          <h1 style={{ fontSize: 38, letterSpacing: "-0.018em", marginTop: 12 }}>Ask VoteTrue</h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15, marginTop: 8, maxWidth: 640 }}>
            Type a voting question. We&apos;ll answer in plain language using only what&apos;s in
            official ECI documents.
          </p>
        </section>

        <section className="container" style={{ paddingBottom: 80 }}>
          <div
            style={{
              alignItems: "start",
              display: "grid",
              gap: 28,
              gridTemplateColumns: "1fr 320px",
            }}
          >
            <div>
              <div className="card" style={{ padding: 22 }}>
                <label className="eyebrow" htmlFor="question" style={{ display: "block", marginBottom: 10 }}>
                  Your question
                </label>
                <textarea
                  id="question"
                  onChange={(event) => setQuestion(event.target.value)}
                  rows={3}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--ink)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 22,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.45,
                    outline: "none",
                    padding: 0,
                    resize: "none",
                    width: "100%",
                  }}
                  value={question}
                />
                <div
                  style={{
                    alignItems: "center",
                    borderTop: "1px solid var(--rule-2)",
                    display: "flex",
                    gap: 12,
                    marginTop: 16,
                    paddingTop: 16,
                  }}
                >
                  <label className="sr-only" htmlFor="language">
                    Answer language
                  </label>
                  <select
                    id="language"
                    onChange={(event) => setLanguage(event.target.value as "en" | "hi")}
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--rule)",
                      borderRadius: 6,
                      color: "var(--ink-2)",
                      font: "inherit",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12.5,
                      padding: "7px 10px",
                    }}
                    value={language}
                  >
                    <option value="en">EN - English</option>
                    <option value="hi">HI - Hindi</option>
                  </select>
                  <span style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    {question.length} chars
                  </span>
                  <button
                    className="btn civic"
                    disabled={stage === "thinking"}
                    onClick={() => submit()}
                    style={{ marginLeft: "auto" }}
                    type="button"
                  >
                    Verify answer <span className="arrow">-&gt;</span>
                  </button>
                </div>
              </div>

              {stage === "thinking" ? <ThinkingCard /> : null}
              {error ? <ErrorCard message={error} /> : null}
              {stage === "answered" && result ? <AnswerCard result={result} /> : null}
            </div>

            <aside style={{ display: "flex", flexDirection: "column", gap: 20, position: "sticky", top: 88 }}>
              <div className="card" style={{ padding: 18 }}>
                <div className="eyebrow">Try asking</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 12 }}>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      onClick={() => submit(suggestion)}
                      style={{
                        background: "none",
                        border: "none",
                        borderTop: index > 0 ? "1px solid var(--rule-2)" : "none",
                        color: "var(--ink-2)",
                        cursor: "pointer",
                        font: "inherit",
                        fontSize: 13.5,
                        lineHeight: 1.4,
                        padding: "10px 0",
                        textAlign: "left",
                      }}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  background: "var(--paper-2)",
                  border: "1px solid var(--rule)",
                  borderRadius: 10,
                  padding: 18,
                }}
              >
                <div className="eyebrow">A note on accuracy</div>
                <p style={{ color: "var(--ink-2)", fontSize: 12.5, lineHeight: 1.55, marginTop: 10 }}>
                  If confidence drops too low, VoteTrue points you to{" "}
                  <strong style={{ color: "var(--civic-ink)" }}>eci.gov.in</strong> rather than
                  risk a wrong answer. Voting is too important to guess.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ThinkingCard() {
  return (
    <div
      aria-live="polite"
      className="card"
      role="status"
      style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 12, marginTop: 18, padding: 28 }}
    >
      <span
        aria-hidden="true"
        style={{ background: "var(--civic)", borderRadius: 999, display: "inline-block", height: 8, marginRight: 8, width: 8 }}
      />
      Searching ECI corpus - checking official documents...
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div
      className="card"
      role="alert"
      style={{ background: "var(--warn-soft)", color: "var(--warn-ink)", marginTop: 18, padding: 18 }}
    >
      {message}
    </div>
  );
}

function AnswerCard({ result }: { result: AskResponse }) {
  const confidence = Math.round(result.confidence * 100);
  const safeConfidence = Number.isFinite(confidence) ? confidence : 0;

  return (
    <div aria-live="polite" className="card" style={{ marginTop: 18, padding: 28 }}>
      <div style={{ alignItems: "center", display: "flex", gap: 10, marginBottom: 18 }}>
        <Verdict kind={safeConfidence > 0 ? "true" : "unverifiable"} label="Answer - ECI-backed" />
        <span
          style={{
            color: "var(--ink-3)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            marginLeft: "auto",
          }}
        >
          {result.sources.length} sources
        </span>
      </div>

      <p
        style={{
          color: "var(--ink)",
          fontFamily: "var(--font-serif)",
          fontSize: 22,
          letterSpacing: "-0.008em",
          lineHeight: 1.45,
        }}
      >
        {result.answer}
      </p>

      <div
        style={{
          borderTop: "1px solid var(--rule-2)",
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginTop: 22,
          paddingTop: 18,
        }}
      >
        <span className="eyebrow" style={{ marginRight: 4 }}>
          Sources
        </span>
        {result.sources.length > 0 ? (
          result.sources.map((source) => (
            <SourceChip
              doc={source.document_name}
              key={`${source.document_name}-${source.page_number ?? "na"}`}
              page={source.page_number ? `Page ${source.page_number}` : undefined}
            />
          ))
        ) : (
          <span style={{ color: "var(--ink-3)", fontSize: 13 }}>
            Answer confidence is low - please verify at eci.gov.in.
          </span>
        )}
      </div>

      <div style={{ marginTop: 18, maxWidth: 360 }}>
        <Confidence value={safeConfidence} />
      </div>
    </div>
  );
}
