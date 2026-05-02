import Link from "next/link";
import type { ReactNode } from "react";

type ToolCardProps = {
  children: ReactNode;
  cta: string;
  href: string;
  tag: string;
  title: string;
};

export function ToolCard({ children, cta, href, tag, title }: ToolCardProps) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", padding: 28 }}>
      <div className="eyebrow">{tag}</div>
      <h3 style={{ fontSize: 26, letterSpacing: "-0.015em", marginTop: 12 }}>{title}</h3>
      <p style={{ color: "var(--ink-2)", flex: 1, fontSize: 14.5, lineHeight: 1.55, marginTop: 10 }}>
        {children}
      </p>
      <Link className="btn" href={href} style={{ alignSelf: "flex-start", marginTop: 22 }}>
        {cta} <span className="arrow">-&gt;</span>
      </Link>
    </div>
  );
}
