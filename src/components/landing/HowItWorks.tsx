const steps = [
  ["1", "Ask or Upload", "Type a question or upload a WhatsApp forward"],
  ["2", "AI Verifies", "Scans 5 official ECI documents using Gemini"],
  ["3", "Get Trusted Answer", "Source, page, and confidence score included"],
];

export default function HowItWorks() {
  return (
    <section className="section" style={{ background: "#FFFFFF" }}>
      <div className="container" style={{ textAlign: "center" }}>
        <p className="section-label">HOW IT WORKS</p>
        <h2 style={{ color: "#0D0D0D", fontSize: 36, fontWeight: 600, marginTop: 20 }}>
          From question to <span style={{ color: "#0F6E56" }}>verified</span> answer in under
          10 seconds.
        </h2>
        <div
          style={{
            display: "grid",
            gap: 80,
            gridTemplateColumns: "repeat(3, 1fr)",
            marginTop: 56,
          }}
        >
          {steps.map(([number, title, description], index) => (
            <div
              key={title}
              style={{
                borderRight: index < steps.length - 1 ? "1px dashed #E8E8E4" : 0,
                paddingRight: index < steps.length - 1 ? 40 : 0,
                textAlign: "center",
              }}
            >
              <span
                style={{
                  alignItems: "center",
                  background: "#0F6E56",
                  borderRadius: "50%",
                  color: "#FFFFFF",
                  display: "inline-flex",
                  fontSize: 14,
                  fontWeight: 500,
                  height: 32,
                  justifyContent: "center",
                  width: 32,
                }}
              >
                {number}
              </span>
              <h3 style={{ color: "#0D0D0D", fontSize: 16, fontWeight: 500, marginTop: 16 }}>
                {title}
              </h3>
              <p style={{ color: "#6B6B6B", fontSize: 14, marginTop: 8 }}>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
