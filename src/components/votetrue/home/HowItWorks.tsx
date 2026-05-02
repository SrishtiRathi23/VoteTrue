import { Eyebrow } from "@/components/votetrue/DesignPrimitives";

const steps = [
  ["01", "Read the forward", "We extract text from screenshots, images, or pasted messages."],
  ["02", "Identify each claim", "Long forwards are split into separate, checkable factual claims."],
  ["03", "Cross-check ECI sources", "Each claim is matched against indexed Election Commission of India publications."],
  ["04", "Show the verdict", "True, Misleading, or Unverifiable - with the source on every result."],
] as const;

export function HowItWorks() {
  return (
    <section className="container py-16">
      <Eyebrow num="02">How verification works</Eyebrow>
      <h2 className="mt-4 max-w-[720px] text-[34px] tracking-normal">
        A four-step process. No magic, no chatbot - just careful comparison.
      </h2>
      <div className="mt-10 grid overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--rule)] gap-px md:grid-cols-4">
        {steps.map(([n, title, body]) => (
          <div className="bg-[var(--paper)] p-7" key={n}>
            <div className="eyebrow text-[var(--civic-ink)]">{n}</div>
            <h3 className="mb-3 mt-4 text-lg">{title}</h3>
            <p className="text-[13.5px] text-[var(--ink-2)]">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
