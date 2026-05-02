import Badge from "@/components/ui/Badge";

const myths = [
  ["You need Aadhaar card to vote", "Any of 12 approved IDs are accepted."],
  ["NOTA votes are not counted", "NOTA results are officially reported."],
  ["EVMs can be hacked remotely", "EVMs are standalone, never networked."],
];

export default function MythsSection() {
  return (
    <section className="section" style={{ background: "#FFFFFF" }}>
      <div className="container">
        <h2 style={{ fontSize: 36, fontWeight: 600 }}>
          <span style={{ color: "#0D0D0D", display: "block" }}>Common myths.</span>
          <span style={{ color: "#0F6E56", display: "block" }}>Official verdicts.</span>
        </h2>
        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(3, 1fr)",
            marginTop: 48,
          }}
        >
          {myths.map(([claim, correction]) => (
            <article className="card" key={claim}>
              <p style={{ color: "#0D0D0D", fontSize: 15, fontWeight: 500, lineHeight: 1.5 }}>
                {claim}
              </p>
              <div style={{ marginTop: 20 }}>
                <Badge variant="misleading">MISLEADING</Badge>
              </div>
              <p style={{ color: "#6B6B6B", fontSize: 13, lineHeight: 1.6, marginTop: 16 }}>
                {correction}
              </p>
            </article>
          ))}
        </div>
        <a href="#" style={{ display: "inline-block", fontSize: 14, marginTop: 32 }}>
          Explore all myths →
        </a>
      </div>
    </section>
  );
}
