import Link from "next/link";
import type { ReactNode } from "react";

type ToolCardProps = {
  children: ReactNode;
  cta: string;
  href: string;
  title: string;
};

export function ToolCard({ children, cta, href, title }: ToolCardProps) {
  return (
    <div className="card flex flex-col p-7">
      <h3 className="text-[26px] tracking-normal">{title}</h3>
      <p className="mt-3 flex-1 text-[14.5px] leading-6 text-[var(--ink-2)]">{children}</p>
      <Link className="btn mt-6 self-start" href={href}>
        {cta} <span className="arrow">-&gt;</span>
      </Link>
    </div>
  );
}
