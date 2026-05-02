import Link from "next/link";
import Badge from "@/components/ui/Badge";
import SourceChip from "@/components/ui/SourceChip";

const trustChips = [
  "ECI Verified Sources",
  "Zero Political Bias",
  "No Personal Data Stored",
  "100% Transparent",
];

export default function HeroSection() {
  return (
    <section
      style={{
        alignItems: "center",
        background: "#F7F6F1",
        display: "flex",
        minHeight: "100vh",
        padding: "120px 80px",
      }}
    >
      <div className="container" style={{ textAlign: "center", width: "100%" }}>
        <span
          style={{
            alignItems: "center",
            background: "#E1F5EE",
            borderRadius: 20,
            color: "#0F6E56",
            display: "inline-flex",
            fontSize: 12,
            fontWeight: 500,
            gap: 8,
            padding: "7px 14px",
          }}
        >
          <span
            aria-hidden="true"
            style={{ background: "#0F6E56", borderRadius: "50%", height: 8, width: 8 }}
          />
          Verified against official ECI documents
        </span>

        <h1
          style={{
            color: "#0D0D0D",
            fontSize: 72,
            fontWeight: 600,
            lineHeight: 1.1,
            marginTop: 80,
          }}
        >
          <span style={{ display: "block" }}>Don&apos;t just vote.</span>
          <span style={{ display: "block" }}>
            Vote{" "}
            <span
              style={{
                textDecoration: "underline",
                textDecorationColor: "#0F6E56",
                textUnderlineOffset: 4,
              }}
            >
              informed.
            </span>
          </span>
        </h1>

        <p style={{ color: "#6B6B6B", fontSize: 18, lineHeight: 1.5, marginTop: 28 }}>
          Verify any election claim in seconds - powered by Election Commission of India.
        </p>

        <Link
          aria-label="Get started by asking VoteTrue an election question"
          className="btn-primary"
          href="/ask"
          style={{ display: "inline-flex", marginTop: 48, textDecoration: "none" }}
        >
          Get Started
        </Link>

        <div
          aria-label="Trust signals"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            justifyContent: "center",
            marginTop: 28,
          }}
        >
          {trustChips.map((chip) => (
            <span
              key={chip}
              style={{
                background: "#F0EFE8",
                borderRadius: 20,
                color: "#6B6B6B",
                fontSize: 12,
                padding: "8px 16px",
              }}
            >
              {chip}
            </span>
          ))}
        </div>

        <article className="card" style={{ margin: "48px auto 0", maxWidth: 480, textAlign: "left" }}>
          <p
            style={{
              color: "#9B9B9B",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            FORWARD VERIFICATION RESULT
          </p>
          <p style={{ color: "#0D0D0D", fontSize: 17, fontWeight: 500, marginTop: 12 }}>
            WhatsApp forward: Polling booths will close at 4 PM in Delhi
          </p>
          <div style={{ marginTop: 12 }}>
            <Badge variant="misleading">MISLEADING</Badge>
          </div>
          <p style={{ color: "#6B6B6B", fontSize: 13, lineHeight: 1.7, marginTop: 10 }}>
            Standard polling hours should be verified only from official ECI notifications and
            voter services, not from forwarded messages.
          </p>
          <div style={{ marginTop: 12 }}>
            <SourceChip text="Source: ECI Notification and Voter Services guidance" />
          </div>
          <div style={{ marginTop: 16 }}>
            <p style={{ color: "#6B6B6B", fontSize: 12 }}>Confidence Score&nbsp;&nbsp;78%</p>
            <div
              aria-hidden="true"
              style={{
                background: "#E8E8E4",
                borderRadius: 4,
                height: 4,
                marginTop: 8,
                overflow: "hidden",
                width: "100%",
              }}
            >
              <div style={{ background: "#0F6E56", borderRadius: 4, height: "100%", width: "78%" }} />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
