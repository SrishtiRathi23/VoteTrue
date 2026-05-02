const steps = [
  "Register your voter ID",
  "Verify your enrollment",
  "Find your polling booth",
  "Prepare your documents",
  "Cast your vote with confidence",
];

export default function FirstTimeVoterCTA() {
  return (
    <section style={{ background: "#0F6E56", padding: "100px 80px" }}>
      <div
        className="container"
        style={{
          display: "grid",
          gap: 80,
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        <div>
          <h2 style={{ fontSize: 42, fontWeight: 600 }}>
            <span style={{ color: "#FFFFFF", display: "block" }}>New to voting?</span>
            <span style={{ color: "#9FE1CB", display: "block" }}>
              We&apos;ll walk you through every step.
            </span>
          </h2>
          <p style={{ color: "#9FE1CB", fontSize: 16, marginTop: 20, maxWidth: 410 }}>
            From registration to casting your vote, we make the process simple and stress-free.
          </p>
          <button
            className="btn-cta"
            type="button"
            style={{
              height: 48,
              marginTop: 32,
              padding: "0 24px",
            }}
          >
            Start the First-Time Guide →
          </button>
        </div>
        <ol
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            justifyContent: "center",
            listStyle: "none",
          }}
        >
          {steps.map((step, index) => (
            <li key={step} style={{ alignItems: "baseline", display: "flex", gap: 16 }}>
              <span style={{ color: "#9FE1CB", fontSize: 13, minWidth: 14 }}>{index + 1}</span>
              <span style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 500 }}>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
