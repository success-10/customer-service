import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useStore } from "@/store/useStore";
import { Inbox, AlertTriangle, Clock, Search, RefreshCw, Loader2 } from "lucide-react";

function getPriorityInfo(priority: number) {
  if (priority >= 15) return { label: "Critical", className: "bg-priority-critical/15 text-priority-critical" };
  if (priority >= 10) return { label: "High", className: "bg-priority-high/15 text-priority-high" };
  if (priority >= 5) return { label: "Medium", className: "bg-priority-medium/15 text-priority-medium" };
  return { label: "Low", className: "bg-priority-low/15 text-priority-low" };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function InboxPage() {
  const { messages, setMessages, setSelectedMessage } = useStore();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"unassigned" | "all">("unassigned");
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const navigate = useNavigate();

  const fetchMessages = (pageNum: number = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    api
      .getMessages(filter === "all" ? undefined : filter, pageNum)
      .then((res) => {
        const data = res.results || (Array.isArray(res) ? res : []);
        if (pageNum === 1) {
          setMessages(data);
        } else {
          setMessages([...messages, ...data]);
        }
        setHasNextPage(!!res.next);
        setPage(pageNum);
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  };

  useEffect(() => {
    fetchMessages(1);
  }, [filter]);

  const filtered = messages
    .filter(
      (m) =>
        m.body.toLowerCase().includes(search.toLowerCase()) ||
        (m.customer.name || "Unknown").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => b.priority - a.priority);

  const handleSelect = (msg: typeof filtered[0]) => {
    setSelectedMessage(msg);
    navigate("/workspace");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="w-6 h-6 text-primary" />
            Inbox
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} message{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => fetchMessages(1)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages or customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="flex bg-secondary rounded-lg p-0.5">
          {(["unassigned", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Message List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No messages found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg) => {
            const pInfo = getPriorityInfo(msg.priority);
            return (
              <button
                key={msg.external_id}
                onClick={() => handleSelect(msg)}
                className="inbox-row w-full text-left animate-slide-up"
              >
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold text-secondary-foreground shrink-0">
                  {(msg.customer.name || "U")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm truncate">{msg.customer.name || "Unknown"}</span>
                    <span className={`priority-badge ${pInfo.className}`}>{pInfo.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{msg.body}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="w-3 h-3" />
                  {timeAgo(msg.created_at)}
                </div>
                {msg.priority >= 15 && (
                  <AlertTriangle className="w-4 h-4 text-priority-critical shrink-0 animate-pulse-soft" />
                )}
              </button>
            );
          })}
          {hasNextPage && (
            <button
              onClick={() => fetchMessages(page + 1)}
              disabled={loadingMore}
              className="w-full py-3 mt-4 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center gap-2"
            >
              {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
