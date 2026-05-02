export default function Footer() {
  return (
    <footer style={{ background: "#0D0D0D", padding: 80 }}>
      <div
        className="container"
        style={{
          display: "grid",
          gap: 60,
          gridTemplateColumns: "1fr 1fr 1fr",
        }}
      >
        <div>
          <p style={{ color: "#FFFFFF", fontSize: 16, fontWeight: 500 }}>VoteTrue</p>
          <p style={{ color: "#6B6B6B", fontSize: 13, marginTop: 8 }}>
            Don&apos;t just vote. Vote informed.
          </p>
          <p style={{ color: "#444444", fontSize: 12, marginTop: 6 }}>Built for PromptWars 2025</p>
        </div>

        <div>
          <p
            style={{
              color: "#444444",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            POWERED BY
          </p>
          <p style={{ color: "#6B6B6B", fontSize: 14, marginTop: 12 }}>
            Google Gemini · Google Cloud · ChromaDB
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          <p>
            <a href="#" style={{ color: "#FFFFFF", fontSize: 14 }}>
              GitHub ↗
            </a>{" "}
            <span style={{ color: "#6B6B6B", fontSize: 14 }}>★ 1.2k</span>
          </p>
          <p style={{ marginTop: 8 }}>
            <a href="#" style={{ color: "#FFFFFF", fontSize: 14 }}>
              Election Commission of India ↗
            </a>
          </p>
          <p style={{ color: "#444444", fontSize: 12, marginTop: 8 }}>Open Source License</p>
          <span
            style={{
              border: "1px solid #444444",
              borderRadius: 20,
              color: "#FFFFFF",
              display: "inline-flex",
              fontSize: 13,
              marginTop: 16,
              padding: "8px 16px",
            }}
          >
            EN | हिंदी
          </span>
        </div>
      </div>
    </footer>
  );
}
