import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Boxes,
  ChevronDown,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  Network,
  Terminal,
  X,
} from "lucide-react";

export type View =
  "Overview" | "Markets" | "Strategies" | "Activity" | "Architecture" | "Learning path";
const navigation = [
  { name: "Overview", icon: LayoutDashboard },
  { name: "Markets", icon: Activity },
  { name: "Strategies", icon: FlaskConical },
  { name: "Activity", icon: Terminal },
] as const;
export function Sidebar({
  view,
  setView,
  open,
  onClose,
}: {
  view: View;
  setView: (view: View) => void;
  open: boolean;
  onClose: () => void;
}) {
  const select = (next: View) => {
    setView(next);
    onClose();
  };
  return (
    <>
      <button
        className={`sidebar-backdrop ${open ? "visible" : ""}`}
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <button className="brand" onClick={() => select("Overview")} aria-label="TradeLab home">
          <span className="brand-mark">
            <Activity size={24} strokeWidth={2.8} />
          </span>
          Trade<span>Lab</span>
          <span className="version">α</span>
        </button>
        <button className="mobile-close icon-button" aria-label="Close menu" onClick={onClose}>
          <X size={20} />
        </button>
        <div className="workspace">
          <span className="workspace-icon">
            <Boxes size={18} />
          </span>
          <div>
            <b>Personal workspace</b>
            <span>Local environment</span>
          </div>
          <ChevronDown size={14} />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Workspace">
          {navigation.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${view === name ? "active" : ""}`}
              onClick={() => select(name)}
            >
              <Icon size={18} />
              <span>{name}</span>
              {name === "Strategies" && <span className="nav-count">3</span>}
            </button>
          ))}
        </nav>
        <p className="nav-label build-label">BUILD & LEARN</p>
        <nav aria-label="Resources">
          <button
            className={`nav-item ${view === "Architecture" ? "active" : ""}`}
            onClick={() => select("Architecture")}
          >
            <Network size={18} />
            Architecture
          </button>
          <button
            className={`nav-item ${view === "Learning path" ? "active" : ""}`}
            onClick={() => select("Learning path")}
          >
            <BookOpen size={18} />
            Learning path
            <ArrowUpRight size={13} className="nav-arrow" />
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="lab-card">
            <span className="lab-icon">
              <FlaskConical size={19} />
            </span>
            <b>A market of your own.</b>
            <p>
              Build. Break. Understand.
              <br />
              That’s what the lab is for.
            </p>
            <button onClick={() => select("Learning path")}>
              Explore the roadmap <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="sidebar-footer">
            <span>
              <GitBranch size={15} /> tradelab
            </span>
            <span>v0.1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
