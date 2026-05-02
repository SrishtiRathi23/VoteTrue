export default function SearchBar() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <form
        aria-label="Ask an election process question"
        style={{
          alignItems: "center",
          background: "#FFFFFF",
          border: "1px solid #E8E8E4",
          borderRadius: 28,
          display: "flex",
          height: 48,
          maxWidth: 560,
          padding: "4px 4px 4px 20px",
          width: "100%",
        }}
      >
        <label htmlFor="election-query" style={{ position: "absolute", left: -9999 }}>
          Ask anything about voting
        </label>
        <input
          id="election-query"
          placeholder="Ask anything about voting..."
          style={{
            background: "transparent",
            border: 0,
            color: "#0D0D0D",
            flex: 1,
            fontSize: 15,
            minWidth: 0,
            outline: "none",
          }}
          type="text"
        />
        <button
          className="btn-primary"
          type="button"
          style={{
            height: 40,
            padding: "0 22px",
            whiteSpace: "nowrap",
          }}
        >
          Verify Now →
        </button>
      </form>
      <p style={{ color: "#6B6B6B", fontSize: 13, marginTop: 12 }}>
        or upload a WhatsApp forward screenshot
      </p>
    </div>
  );
}
