import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useStore } from "@/store/useStore";
import { BookOpen, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function KnowledgeBasePage() {
  const { cannedResponses, setCannedResponses, addCannedResponse } = useStore();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);

  const loadResponses = (pageNum: number = 1) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    api
      .getCannedResponses(pageNum)
      .then((res) => {
        const data = res.results || (Array.isArray(res) ? res : []);
        if (pageNum === 1) setCannedResponses(data);
        else setCannedResponses([...cannedResponses, ...data]);
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
    loadResponses(1);
  }, []);

  const handleCreate = async () => {
    if (!title.trim() || !body.trim()) return;
    setCreating(true);
    try {
      const res = await api.createCannedResponse(title, body);
      addCannedResponse(res);
      setTitle("");
      setBody("");
      toast.success("Canned response created");
    } catch {
      toast.error("Failed to create");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <BookOpen className="w-6 h-6 text-primary" />
        Canned Messages
      </h2>

      {/* Create form */}
      <div className="glass-panel p-5 mb-6">
        <h3 className="font-semibold text-sm mb-3">New Canned Response</h3>
        <input
          type="text"
          placeholder="Title (e.g. Greeting)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full mb-3 px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <textarea
          rows={3}
          placeholder="Response body..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full mb-3 px-3 py-2.5 rounded-lg bg-secondary border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !title.trim() || !body.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Create
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : cannedResponses.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-8">No canned responses yet</p>
      ) : (
        <div className="space-y-2">
          {cannedResponses.map((c) => (
            <div key={c.external_id} className="glass-panel p-4">
              <h4 className="font-medium text-sm mb-1">{c.title}</h4>
              <p className="text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
          {hasNextPage && (
            <button
              onClick={() => loadResponses(page + 1)}
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
