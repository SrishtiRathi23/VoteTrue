"use client";

import {
  AppShell,
  Confidence,
  Eyebrow,
  SourceChip,
  Verdict,
  VerdictKind,
  WhatsAppPreview,
} from "@/components/votetrue/DesignPrimitives";
import { useMemo, useRef, useState } from "react";

type ApiVerdict = "TRUE" | "MISLEADING" | "UNVERIFIABLE";

type Claim = {
  claim: string;
  verdict: ApiVerdict;
  explanation: string;
  confidence: number;
  sources: { document_name: string; page_number?: number | null }[];
};

type VerifyResponse = {
  extracted_text: string;
  claims: Claim[];
  total_claims: number;
};

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const verdictOrder: Record<ApiVerdict, number> = { MISLEADING: 0, UNVERIFIABLE: 1, TRUE: 2 };

const sampleResult: VerifyResponse = {
  extracted_text:
    "URGENT! Forward to all voters. Polling closes at 3 PM in your area. Aadhaar card is now mandatory at the booth. EVMs were hacked in last election. Vote early!!",
  total_claims: 3,
  claims: [
    {
      claim: "Polling closes at 3 PM in your area.",
      verdict: "MISLEADING",
      explanation:
        "Polling hours should be verified through official ECI notices. Do not rely on forwarded local-time claims without an official source.",
      confidence: 0.94,
      sources: [{ document_name: "ECI Handbook for Polling Personnel", page_number: null }],
    },
    {
      claim: "Aadhaar card is mandatory at the booth.",
      verdict: "MISLEADING",
      explanation:
        "Aadhaar may be accepted as a photo ID, but forwarded claims that it is the only mandatory ID are misleading.",
      confidence: 0.97,
      sources: [{ document_name: "ECI Voter Guide", page_number: null }],
    },
    {
      claim: "EVMs were hacked in the last election.",
      verdict: "UNVERIFIABLE",
      explanation:
        "VoteTrue could not verify this claim from available official ECI context. Unverified allegations should not be forwarded as facts.",
      confidence: 0,
      sources: [{ document_name: "ECI EVM and VVPAT Factsheet", page_number: null }],
    },
  ],
};

export default function VerifyPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stage, setStage] = useState<"idle" | "extracting" | "identifying" | "checking" | "done">("idle");
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<VerifyResponse | null>(null);

  const sortedClaims = useMemo(
    () => [...(result?.claims ?? [])].sort((a, b) => verdictOrder[a.verdict] - verdictOrder[b.verdict]),
    [result],
  );

  async function verifyFile(file: File) {
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setError("");
    setResult(null);
    setStage("extracting");

    window.setTimeout(() => setStage("identifying"), 700);
    window.setTimeout(() => setStage("checking"), 1400);

    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`${apiBase}/api/v1/verify-forward`, {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        const message = String(detail.detail ?? "");
        if (message.includes("No text")) throw new Error("no_text");
        if (message.includes("No verifiable claims")) throw new Error("no_claims");
        throw new Error("network");
      }

      setResult((await response.json()) as VerifyResponse);
      setStage("done");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "network";
      setStage("idle");
      if (message === "no_text") {
        setError("We could not read text from this image. Try a clearer WhatsApp screenshot.");
      } else if (message === "no_claims") {
        setError("We found text, but no election-rule claim that can be verified.");
      } else {
        setError("We could not verify this forward right now. Please try again.");
      }
    }
  }

  function useSampleForward() {
    setFileName("sample-whatsapp-forward.png");
    setPreviewUrl("");
    setError("");
    setResult(null);
    setStage("extracting");
    window.setTimeout(() => setStage("identifying"), 700);
    window.setTimeout(() => setStage("checking"), 1400);
    window.setTimeout(() => {
      setResult(sampleResult);
      setStage("done");
    }, 2200);
  }

  function reset() {
    setStage("idle");
    setResult(null);
    setError("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  }

  function openFilePicker() {
    if (fileInputRef.current) fileInputRef.current.value = "";
    fileInputRef.current?.click();
  }

  function tryAnotherImage() {
    reset();
    window.setTimeout(openFilePicker, 0);
  }

  return (
    <AppShell active="verify">
      <div className="page">
        <section className="container" style={{ paddingBottom: 24, paddingTop: 40 }}>
          <div
            style={{
              alignItems: "baseline",
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              justifyContent: "space-between",
            }}
          >
            <div>
              <Eyebrow>Flagship tool - WhatsApp Forward Verification</Eyebrow>
              <h1 style={{ fontSize: 38, letterSpacing: "-0.018em", marginTop: 12 }}>
                Verify a forward
              </h1>
              <p style={{ color: "var(--ink-2)", fontSize: 15, marginTop: 8, maxWidth: 640 }}>
                Upload a screenshot. We&apos;ll separate the claims and verify each one against
                ECI documents.
              </p>
            </div>
            <span className="eci-badge">ECI corpus - local index ready</span>
          </div>
        </section>

        <section className="container" style={{ paddingBottom: 80 }}>
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--rule)",
              borderRadius: 10,
              display: "grid",
              gap: 0,
              gridTemplateColumns: "minmax(360px, 0.85fr) minmax(0, 1.15fr)",
              minHeight: 620,
              overflow: "hidden",
            }}
          >
            <SourcePanel
              fileName={fileName}
              onReset={reset}
              previewUrl={previewUrl}
              result={result}
              showReset={stage !== "idle"}
            />
            <ResultsPanel
              claims={sortedClaims}
              error={error}
              onSample={useSampleForward}
              onTryAnother={tryAnotherImage}
              onUpload={openFilePicker}
              stage={stage}
            />
          </div>

          <input
            aria-describedby="verify-file-help"
            aria-label="Upload WhatsApp forward image"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void verifyFile(file);
            }}
            ref={fileInputRef}
            type="file"
          />

          <div
            style={{
              color: "var(--ink-3)",
              display: "flex",
              flexWrap: "wrap",
              fontSize: 12.5,
              gap: 28,
              marginTop: 18,
            }}
          >
            <span>Your image is processed for verification and should not be committed to the repo.</span>
            <span style={{ fontFamily: "var(--font-mono)", marginLeft: "auto" }}>
              All sources from <span style={{ color: "var(--civic-ink)" }}>eci.gov.in</span>
            </span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function SourcePanel({
  fileName,
  onReset,
  previewUrl,
  result,
  showReset,
}: {
  fileName: string;
  onReset: () => void;
  previewUrl: string;
  result: VerifyResponse | null;
  showReset: boolean;
}) {
  return (
    <div
      style={{
        background: "var(--paper-2)",
        borderRight: "1px solid var(--rule)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          alignItems: "center",
          borderBottom: "1px solid var(--rule)",
          color: "var(--ink-3)",
          display: "flex",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          justifyContent: "space-between",
          letterSpacing: "0.08em",
          padding: "14px 22px",
          textTransform: "uppercase",
        }}
      >
        <span>Source - Original forward</span>
        {showReset ? (
          <button
            aria-label="Start new verification"
            onClick={onReset}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-3)",
              cursor: "pointer",
              font: "inherit",
              fontSize: 11,
              letterSpacing: "0.08em",
            }}
            type="button"
          >
            New
          </button>
        ) : null}
      </div>
      <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 18, padding: 22 }}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt="Uploaded WhatsApp forward"
            src={previewUrl}
            style={{ border: "1px solid var(--rule)", borderRadius: 8, maxHeight: 360, objectFit: "contain", width: "100%" }}
          />
        ) : (
          <WhatsAppPreview extractedText={result?.extracted_text} />
        )}
        <div>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Extracted text
          </div>
          <div
            style={{
              background: "var(--paper)",
              border: "1px solid var(--rule)",
              borderRadius: 6,
              color: "var(--ink-2)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              lineHeight: 1.6,
              padding: "12px 14px",
            }}
          >
            {result?.extracted_text ||
              "Upload a WhatsApp forward screenshot, or use the sample forward to preview the verification flow."}
          </div>
        </div>
        <div
          style={{
            borderTop: "1px solid var(--rule)",
            color: "var(--ink-3)",
            display: "flex",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            gap: 16,
            marginTop: "auto",
            paddingTop: 12,
          }}
        >
          <span>{fileName || "No file selected"}</span>
          <span>{result ? `${result.total_claims} claims found` : "Waiting for forward"}</span>
        </div>
      </div>
    </div>
  );
}

function ResultsPanel({
  claims,
  error,
  onSample,
  onTryAnother,
  onUpload,
  stage,
}: {
  claims: Claim[];
  error: string;
  onSample: () => void;
  onTryAnother: () => void;
  onUpload: () => void;
  stage: "idle" | "extracting" | "identifying" | "checking" | "done";
}) {
  return (
    <div
      aria-busy={stage !== "idle" && stage !== "done" ? "true" : undefined}
      aria-live={stage !== "idle" && stage !== "done" ? "polite" : undefined}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          alignItems: "center",
          borderBottom: "1px solid var(--rule)",
          color: "var(--ink-3)",
          display: "flex",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          justifyContent: "space-between",
          letterSpacing: "0.08em",
          padding: "14px 22px",
          textTransform: "uppercase",
        }}
      >
        <span>Verdicts</span>
        {stage === "done" ? <span style={{ color: "var(--ink-2)" }}>{claims.length} checked</span> : null}
      </div>

      {stage === "idle" && !error ? (
        <IdleState onSample={onSample} onUpload={onUpload} />
      ) : null}
      {error ? <ErrorState message={error} onUpload={onTryAnother} /> : null}
      {stage !== "idle" && stage !== "done" ? <ProgressState current={stage} /> : null}
      {stage === "done" ? <ResultsState claims={claims} /> : null}
    </div>
  );
}

function IdleState({
  onSample,
  onUpload,
}: {
  onSample: () => void;
  onUpload: () => void;
}) {
  return (
    <div style={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center", padding: 40 }}>
      <div style={{ maxWidth: 380, textAlign: "center" }}>
        <UploadIcon />
        <h3 style={{ fontSize: 22, letterSpacing: "-0.012em", marginTop: 22 }}>
          Drop a screenshot to verify
        </h3>
        <p style={{ color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55, marginTop: 10 }}>
          PNG, JPG, or WebP up to 5MB. We verify election-related WhatsApp forwards against ECI
          documents.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 24 }}>
          <button className="btn civic" onClick={onSample} type="button">
            Use sample forward <span className="arrow">-&gt;</span>
          </button>
          <button aria-describedby="verify-file-help" className="btn" onClick={onUpload} type="button">
            Upload image
          </button>
        </div>
        <p className="sr-only" id="verify-file-help">
          Choose an image file to verify a WhatsApp forward.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message, onUpload }: { message: string; onUpload: () => void }) {
  return (
    <div style={{ alignItems: "center", display: "flex", flex: 1, justifyContent: "center", padding: 40 }}>
      <div className="card" role="alert" style={{ background: "var(--warn-soft)", color: "var(--warn-ink)", maxWidth: 420, padding: 24 }}>
        <div className="eyebrow" style={{ color: "var(--warn-ink)" }}>
          Verification paused
        </div>
        <p style={{ fontSize: 15, marginTop: 12 }}>{message}</p>
        <button aria-describedby="verify-file-help" className="btn" onClick={onUpload} style={{ marginTop: 18 }} type="button">
          Try another image
        </button>
      </div>
    </div>
  );
}

const stages = [
  { id: "extracting", label: "Reading the forward", detail: "Cloud OCR - extracting text from image" },
  { id: "identifying", label: "Identifying claims", detail: "Splitting message into factual claims" },
  { id: "checking", label: "Cross-checking ECI sources", detail: "Searching indexed documents" },
  { id: "done", label: "Verdicts ready", detail: "Complete" },
] as const;

function ProgressState({ current }: { current: string }) {
  const currentIndex = stages.findIndex((stage) => stage.id === current);
  return (
    <div aria-busy="true" aria-live="polite" role="status" style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", padding: 40 }}>
      <div className="eyebrow" style={{ color: "var(--civic-ink)", marginBottom: 22 }}>
        Verifying...
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {stages.map((stage, index) => {
          const state = index < currentIndex ? "done" : index === currentIndex ? "active" : "pending";
          return (
            <div
              key={stage.id}
              style={{
                alignItems: "center",
                borderBottom: index < stages.length - 1 ? "1px solid var(--rule-2)" : "none",
                display: "grid",
                gap: 14,
                gridTemplateColumns: "32px 1fr auto",
                opacity: state === "pending" ? 0.4 : 1,
                padding: "14px 4px",
              }}
            >
              <div
                style={{
                  background: state === "done" ? "var(--civic)" : "var(--paper)",
                  border: state === "pending" ? "1px solid var(--rule)" : "1px solid var(--civic)",
                  borderRadius: 999,
                  color: state === "done" ? "white" : "var(--civic-ink)",
                  display: "grid",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  height: 26,
                  placeItems: "center",
                  width: 26,
                }}
              >
                {state === "done" ? "OK" : (index + 1).toString().padStart(2, "0")}
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 500 }}>{stage.label}</div>
                <div style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 12, marginTop: 2 }}>
                  {stage.detail}
                </div>
              </div>
              <div style={{ color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                {state === "active" ? "..." : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultsState({ claims }: { claims: Claim[] }) {
  const trueCount = claims.filter((claim) => claim.verdict === "TRUE").length;
  const misleadingCount = claims.filter((claim) => claim.verdict === "MISLEADING").length;
  const unverifiableCount = claims.filter((claim) => claim.verdict === "UNVERIFIABLE").length;

  return (
    <div aria-live="polite" style={{ flex: 1, overflow: "auto", padding: "22px 22px 28px" }}>
      <div
        style={{
          alignItems: "center",
          background: "var(--paper-2)",
          border: "1px solid var(--rule)",
          borderRadius: 6,
          display: "flex",
          gap: 24,
          marginBottom: 18,
          padding: "14px 18px",
        }}
      >
        <div>
          <div className="eyebrow">Summary</div>
          <div style={{ color: "var(--ink-2)", fontSize: 13.5, marginTop: 4 }}>
            This forward contains checked claims. Review each verdict before sharing.
          </div>
        </div>
        <div style={{ color: "var(--ink-3)", display: "flex", fontFamily: "var(--font-mono)", fontSize: 11, gap: 14, marginLeft: "auto" }}>
          <span>{trueCount} true</span>
          <span>{misleadingCount} misleading</span>
          <span>{unverifiableCount} unverifiable</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {claims.map((claim, index) => (
          <ClaimCard claim={claim} index={index + 1} key={`${claim.claim}-${index}`} />
        ))}
      </div>
    </div>
  );
}

function ClaimCard({ claim, index }: { claim: Claim; index: number }) {
  const kind = verdictKind(claim.verdict);
  const confidence = Math.round(claim.confidence * 100);
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ alignItems: "flex-start", display: "flex", gap: 16 }}>
        <div
          style={{
            color: "var(--ink-3)",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.06em",
            minWidth: 32,
            paddingTop: 4,
          }}
        >
          CLAIM
          <br />
          <span style={{ color: "var(--ink)", fontSize: 14, fontWeight: 600 }}>0{index}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ alignItems: "flex-start", display: "flex", gap: 14, justifyContent: "space-between", marginBottom: 10 }}>
            <p style={{ color: "var(--ink)", fontFamily: "var(--font-serif)", fontSize: 17, letterSpacing: "-0.005em", lineHeight: 1.4 }}>
              &quot;{claim.claim}&quot;
            </p>
            <Verdict kind={kind} />
          </div>
          <p style={{ color: "var(--ink-2)", fontSize: 13.5, lineHeight: 1.6, marginTop: 12 }}>
            {claim.explanation}
          </p>
          <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            <span className="eyebrow" style={{ marginRight: 4 }}>
              Sources
            </span>
            {claim.sources.length > 0 ? (
              claim.sources.map((source) => (
                <SourceChip
                  doc={source.document_name}
                  key={`${source.document_name}-${source.page_number ?? "na"}`}
                  page={source.page_number ? `Page ${source.page_number}` : undefined}
                />
              ))
            ) : (
              <span style={{ color: "var(--ink-3)", fontSize: 12 }}>No source returned</span>
            )}
          </div>
          {confidence > 0 ? (
            <div style={{ marginTop: 14, maxWidth: 340 }}>
              <Confidence value={confidence} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function verdictKind(verdict: ApiVerdict): VerdictKind {
  if (verdict === "TRUE") return "true";
  if (verdict === "UNVERIFIABLE") return "unverifiable";
  return "misleading";
}

function UploadIcon() {
  return (
    <div
      style={{
        background: "var(--civic-soft)",
        border: "1px solid oklch(0.85 0.04 235)",
        borderRadius: 12,
        display: "grid",
        height: 64,
        margin: "0 auto",
        placeItems: "center",
        width: 64,
      }}
    >
      <svg
        aria-hidden="true"
        fill="none"
        height="28"
        stroke="var(--civic-ink)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        viewBox="0 0 24 24"
        width="28"
      >
        <path d="M12 16V4M12 4L7 9M12 4L17 9" />
        <path d="M4 17V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V17" />
      </svg>
    </div>
  );
}
