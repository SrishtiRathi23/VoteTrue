const stats = [
  ["25K+", "Questions Answered"],
  ["5", "Official ECI Sources"],
  ["100%", "Source-Backed Answers"],
  ["<10s", "Average Answer Time"],
];

export default function StatsBar() {
  return (
    <section style={{ background: "#F7F6F1", height: 80 }}>
      <div
        className="container"
        style={{
          alignItems: "center",
          display: "flex",
          height: "100%",
          justifyContent: "space-around",
        }}
      >
        {stats.map(([number, label], index) => (
          <div
            key={label}
            style={{
              alignItems: "center",
              display: "flex",
              flex: 1,
              justifyContent: "center",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "#0D0D0D", fontSize: 24, fontWeight: 600, lineHeight: 1.1 }}>
                {number}
              </p>
              <p style={{ color: "#6B6B6B", fontSize: 13, marginTop: 4 }}>{label}</p>
            </div>
            {index < stats.length - 1 ? (
              <span
                aria-hidden="true"
                style={{
                  background: "#E8E8E4",
                  height: 40,
                  marginLeft: "auto",
                  width: 1,
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
