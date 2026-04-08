import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Inbox, MessageSquare, BookOpen, Zap, Wifi, WifiOff, LogOut } from "lucide-react";

export default function AppLayout() {
  useWebSocket();
  const { activeAgent, wsConnected, setActiveAgent } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    setActiveAgent(null);
    navigate("/");
  };

  useEffect(() => {
    if (!activeAgent) {
      navigate("/");
    }
  }, [activeAgent, navigate]);

  const links = [
    { to: "/inbox", icon: Inbox, label: "Inbox" },
    { to: "/workspace", icon: MessageSquare, label: "Workspace" },
    { to: "/knowledge", icon: BookOpen, label: "Canned Messages" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 md:w-64 flex flex-col border-r border-border bg-sidebar shrink-0 transition-all duration-300">
        <div className="p-6 border-b border-border text-center md:text-left">
          <h1 className="text-lg font-bold glow-text tracking-tight hidden md:block">Branch CS</h1>
          <h1 className="text-lg font-bold glow-text tracking-tight md:hidden">B</h1>
          <p className="text-xs text-muted-foreground mt-1 hidden md:block">Agent Dashboard</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "nav-link-active" : ""}`
              }
            >
              <link.icon className="w-5 h-5 shrink-0" />
              <span className="hidden md:block truncate">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {wsConnected ? (
              <Wifi className="w-3.5 h-3.5 text-primary" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-destructive animate-pulse-soft" />
            )}
            <span className="hidden md:inline">{wsConnected ? "Live" : "Reconnecting..."}</span>
          </div>
          {activeAgent && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 md:w-7 md:h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                  {activeAgent.name[0]}
                </div>
                <span className="text-sm font-medium hidden md:block">{activeAgent.name}</span>
              </div>
              <button title="Log out" onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors p-2 md:p-0">
                <LogOut className="w-5 h-5 md:w-4 md:h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
