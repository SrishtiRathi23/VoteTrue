// VoteTrue — shared shell components

const Shell = ({ route, setRoute, children }) => {
  const tabs = [
    { id: "home", label: "Home" },
    { id: "verify", label: "Verify a Forward" },
    { id: "ask", label: "Ask VoteTrue" },
    { id: "myths", label: "Myths & Facts" },
  ];
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <a
            className="brand"
            onClick={(e) => { e.preventDefault(); setRoute("home"); }}
            href="#home"
          >
            <span className="brand-mark">V</span>
            VoteTrue
            <span className="brand-tag">Misinformation Firewall</span>
          </a>
          <nav className="nav">
            {tabs.map(t => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className={route === t.id ? "active" : ""}
                onClick={(e) => { e.preventDefault(); setRoute(t.id); }}
              >
                {t.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main style={{ flex: 1 }} data-screen-label={`Page: ${route}`}>
        {children}
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <div>
            VoteTrue is an independent civic verification tool. Not affiliated with the Election Commission of India.
          </div>
          <div className="mono">v1.0 · 2026 General Elections</div>
        </div>
      </footer>
    </div>
  );
};

const Verdict = ({ kind, label }) => {
  const labels = {
    true: label || "True",
    misleading: label || "Misleading",
    unverifiable: label || "Unverifiable",
  };
  return (
    <span className={`verdict ${kind}`}>
      <span className="verdict-dot"></span>
      {labels[kind]}
    </span>
  );
};

const SourceChip = ({ doc, page }) => (
  <a className="source-chip" href="#" onClick={(e) => e.preventDefault()}>
    <span className="doc"></span>
    {doc}{page ? ` · §${page}` : ""}
  </a>
);

const Confidence = ({ value, label }) => (
  <div className="conf">
    <span>{label || "Confidence"}</span>
    <div className="conf-track">
      <div className="conf-fill" style={{ width: `${value}%` }}></div>
    </div>
    <span>{value}%</span>
  </div>
);

const Eyebrow = ({ children, num }) => (
  <div className="eyebrow" style={{ display: "flex", alignItems: "center", gap: 10 }}>
    {num && <span style={{ color: "var(--ink)" }}>{num}</span>}
    {num && <span style={{ width: 18, height: 1, background: "var(--rule)" }}></span>}
    {children}
  </div>
);

Object.assign(window, { Shell, Verdict, SourceChip, Confidence, Eyebrow });
