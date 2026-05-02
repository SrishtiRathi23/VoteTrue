import { Verdict } from "@/components/votetrue/DesignPrimitives";

type TrustCardProps = {
  body: string;
  kind: "true" | "misleading" | "unverifiable";
  title: string;
};

export function TrustCard({ body, kind, title }: TrustCardProps) {
  return (
    <div className="card p-6">
      <Verdict kind={kind} label={title} />
      <p className="mt-4 text-[13.5px] leading-6 text-[var(--ink-2)]">{body}</p>
    </div>
  );
}
