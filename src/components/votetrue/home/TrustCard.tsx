import { Verdict } from "@/components/votetrue/DesignPrimitives";

type TrustCardProps = {
  body: string;
  example: string;
  kind: "true" | "misleading" | "unverifiable";
  title: string;
};

export function TrustCard({ body, example, kind, title }: TrustCardProps) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <Verdict kind={kind} label={title} />
      <p style={{ color: "var(--ink-2)", fontSize: 13.5, lineHeight: 1.5, marginTop: 14 }}>
        {body}
      </p>
      <div
        style={{
          background: "var(--paper-2)",
          borderLeft: "2px solid var(--rule)",
          color: "var(--ink-3)",
          fontSize: 12,
          fontStyle: "italic",
          lineHeight: 1.5,
          marginTop: 14,
          padding: "10px 12px",
        }}
      >
        e.g. {example}
      </div>
    </div>
  );
}
