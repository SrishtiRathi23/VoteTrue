import Link from "next/link";
import { MessageCircle, MessageSquareWarning, ShieldCheck } from "lucide-react";

const features = [
  {
    Icon: MessageSquareWarning,
    title: "Forward Verification Engine",
    description: "Upload WhatsApp screenshots",
    href: "/verify",
  },
  {
    Icon: MessageCircle,
    title: "Ask VoteTrue",
    description: "Ask anything, cited answers only",
    href: "/ask",
  },
  {
    Icon: ShieldCheck,
    title: "Myths & Facts",
    description: "15+ verified election myths",
    href: "/myths",
  },
];

export default function FeatureGrid() {
  return (
    <section className="section" style={{ background: "#F7F6F1" }}>
      <div className="container" style={{ textAlign: "center" }}>
        <p className="section-label">EXPLORE OUR TOOLS</p>
        <h2 style={{ color: "#0D0D0D", fontSize: 36, fontWeight: 600, marginTop: 12 }}>
          Everything you need to vote informed.
        </h2>
        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(3, 1fr)",
            marginTop: 48,
            textAlign: "left",
          }}
        >
          {features.map(({ Icon, title, description, href }) => (
            <Link
              aria-label={`Open ${title}`}
              className="card"
              href={href}
              key={title}
              style={{
                color: "inherit",
                display: "block",
                minHeight: 164,
                position: "relative",
                textDecoration: "none",
              }}
            >
              <Icon aria-hidden="true" color="#0F6E56" size={20} strokeWidth={1.8} />
              <h3 style={{ color: "#0D0D0D", fontSize: 15, fontWeight: 500, marginTop: 12 }}>
                {title}
              </h3>
              <p style={{ color: "#6B6B6B", fontSize: 13, lineHeight: 1.6, marginTop: 6 }}>
                {description}
              </p>
              <span
                aria-hidden="true"
                style={{ bottom: 24, color: "#0F6E56", fontSize: 14, position: "absolute", right: 24 }}
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
