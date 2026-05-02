import Image from "next/image";
import Link from "next/link";
import { AuthStatus } from "@/components/votetrue/AuthStatus";

export type VerdictKind = "true" | "misleading" | "unverifiable";

type ShellProps = {
  active: "home" | "verify" | "ask" | "myths" | "login";
  children: React.ReactNode;
};

const tabs = [
  { id: "home", label: "Home", href: "/" },
  { id: "verify", label: "Verify a Forward", href: "/verify" },
  { id: "ask", label: "Ask VoteTrue", href: "/ask" },
  { id: "myths", label: "Myths & Facts", href: "/myths" },
] as const;

export function AppShell({ active, children }: ShellProps) {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              <Image
                alt=""
                height={34}
                priority
                src="/images/logo.png"
                width={34}
              />
            </span>
            VoteTrue
            <span className="brand-tag">Misinformation Firewall</span>
          </Link>
          <nav aria-label="Primary navigation" className="nav">
            {tabs.map((tab) => (
              <Link
                aria-current={active === tab.id ? "page" : undefined}
                className={active === tab.id ? "active" : ""}
                href={tab.href}
                key={tab.id}
              >
                {tab.label}
              </Link>
            ))}
          </nav>
          <AuthStatus />
        </div>
      </header>
      <main data-screen-label={`Page: ${active}`} id="main-content" style={{ flex: 1 }}>
        {children}
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <div>
            VoteTrue is an independent civic verification tool. Not affiliated with the Election
            Commission of India.
          </div>
          <div className="mono">v1.0 - 2026 General Elections</div>
        </div>
      </footer>
    </div>
  );
}

export function Verdict({ kind, label }: { kind: VerdictKind; label?: string }) {
  const labels: Record<VerdictKind, string> = {
    true: label || "True",
    misleading: label || "Misleading",
    unverifiable: label || "Unverifiable",
  };

  return (
    <span className={`verdict ${kind}`}>
      <span aria-hidden="true" className="verdict-dot" />
      {labels[kind]}
    </span>
  );
}

export function SourceChip({ doc, page }: { doc: string; page?: string | number | null }) {
  const label = page ? `${doc} - ${page}` : doc;
  return (
    <span aria-label={`Source: ${label}`} className="source-chip">
      <span aria-hidden="true" className="doc" />
      {label}
    </span>
  );
}

export function Confidence({ value, label = "Confidence" }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="conf">
      <span>{label}</span>
      <div
        aria-label={`${label} ${clamped} percent`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={clamped}
        className="conf-track"
        role="progressbar"
      >
        <div className="conf-fill" style={{ width: `${clamped}%` }} />
      </div>
      <span>{clamped}%</span>
    </div>
  );
}

export function Eyebrow({ children, num }: { children: React.ReactNode; num?: string }) {
  return (
    <div className="eyebrow" style={{ alignItems: "center", display: "flex", gap: 10 }}>
      {num ? <span style={{ color: "var(--ink)" }}>{num}</span> : null}
      {num ? <span style={{ background: "var(--rule)", height: 1, width: 18 }} /> : null}
      {children}
    </div>
  );
}

export function WhatsAppPreview({ extractedText }: { extractedText?: string }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid var(--rule)",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "oklch(0.96 0.008 145)",
          borderBottom: "1px solid var(--rule)",
          color: "var(--ink-3)",
          display: "flex",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          gap: 8,
          padding: "8px 12px",
        }}
      >
        <span
          aria-hidden="true"
          style={{ background: "oklch(0.7 0.12 145)", borderRadius: 999, height: 8, width: 8 }}
        />
        Family Group - WhatsApp screenshot
      </div>
      <div className="wa-thread" style={{ border: "none", borderRadius: 0 }}>
        <div className="wa-meta">
          <div className="avatar">UN</div>
          <span>Uncle Naresh</span>
          <span style={{ marginLeft: "auto" }}>Apr 18, 8:42 AM</span>
        </div>
        <div className="wa-bubble">
          <div className="wa-fwd">Forwarded many times</div>
          {extractedText || (
            <>
              <strong>URGENT! Forward to all voters.</strong>
              <br />
              <br />
              Polling closes at <strong>3 PM</strong> in your area. Aadhaar card is now mandatory
              at the booth. EVMs were hacked in last election. Vote early!!
            </>
          )}
          <span className="time">8:42 AM</span>
        </div>
      </div>
    </div>
  );
}
