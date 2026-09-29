import { ArrowUpRight, Menu, X } from "lucide-react";

export type View =
  "Overview" | "Markets" | "Strategies" | "Activity" | "Architecture" | "Learning path";
const views: View[] = [
  "Overview",
  "Markets",
  "Strategies",
  "Activity",
  "Architecture",
  "Learning path",
];

// One navigation list serves the desktop masthead and the mobile menu.
export function Navigation({
  view,
  setView,
  open,
  onClose,
  onOpen,
}: {
  view: View;
  setView: (view: View) => void;
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
}) {
  const select = (next: View) => {
    setView(next);
    onClose();
  };
  return (
    <header className="masthead">
      <button className="brand" onClick={() => select("Overview")} aria-label="TradeLab home">
        <span className="brand-mark" aria-hidden="true">
          ↗
        </span>
        Trade<span>Lab</span>
        <small>RESEARCH TERMINAL</small>
      </button>
      <button
        className="mobile-menu icon-button"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={open ? onClose : onOpen}
        aria-expanded={open}
        aria-controls="main-navigation"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav
        id="main-navigation"
        className={`main-navigation ${open ? "open" : ""}`}
        aria-label="Workspace"
      >
        {views.map((name, index) => (
          <button
            key={name}
            className={`nav-item ${view === name ? "active" : ""}`}
            onClick={() => select(name)}
            aria-current={view === name ? "page" : undefined}
          >
            <span className="nav-index" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            {name}
          </button>
        ))}
      </nav>
      <button className="masthead-version" onClick={() => select("Learning path")}>
        FIELD NOTES <ArrowUpRight size={13} />
      </button>
    </header>
  );
}
