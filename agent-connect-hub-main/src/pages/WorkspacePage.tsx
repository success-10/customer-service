import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { api } from "@/services/api";
import type { CannedResponse } from "@/types";
import {
  MessageSquare,
  Send,
  Shield,
  User,
  Phone,
  Mail,
  Zap,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function WorkspacePage() {
  const { selectedMessage, activeAgent, cannedResponses, setCannedResponses } = useStore();
  const [replyText, setReplyText] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [sending, setSending] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [previewCanned, setPreviewCanned] = useState<CannedResponse | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.getCannedResponses(1)
      .then((r) => setCannedResponses(r.results || (Array.isArray(r) ? r : [])))
      .catch(console.error);
  }, []);

  if (!selectedMessage) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Select a message from the Inbox</p>
        </div>
      </div>
    );
  }

  const msg = selectedMessage;

  const handleClaim = async () => {
    if (!activeAgent) return;
    setClaiming(true);
    try {
      const res = await api.claimMessage(msg.external_id, activeAgent.external_id);
      if (res.success) {
        setClaimed(true);
        toast.success("Ticket claimed successfully");
      }
    } catch (err: any) {
      if (err.response?.status === 409) {
        const data = err.response.data;
        toast.error(`Already claimed by ${data.data?.by || "another agent"}`);
      } else {
        toast.error("Failed to claim");
      }
    } finally {
      setClaiming(false);
    }
  };

  const handleReply = async () => {
    if (!activeAgent || !replyText.trim()) return;
    setSending(true);
    try {
      await api.replyMessage(msg.external_id, activeAgent.external_id, replyText);
      toast.success("Reply sent");
      setReplyText("");
    } catch {
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleCannedReply = async (canned: CannedResponse) => {
    if (!activeAgent) return;
    setSending(true);
    try {
      await api.useCanned(msg.external_id, activeAgent.external_id, canned.external_id);
      toast.success(`Sent canned: "${canned.title}"`);
    } catch {
      toast.error("Failed to send canned response");
    } finally {
      setSending(false);
      setPreviewCanned(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">
      <button
        onClick={() => navigate("/inbox")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Inbox
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Message & Reply panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Message Thread */}
          <div className="workspace-panel shadow-sm border border-border">
            <h3 className="font-semibold flex items-center gap-2 mb-4 pb-2 border-b border-border/50 text-sm">
              <MessageSquare className="w-4 h-4 text-primary" />
              Ticket Thread
            </h3>
            
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
              {/* Original Message */}
              <div className="flex flex-col mb-2">
                <div className="flex items-end gap-2 text-sm text-muted-foreground mb-1">
                  <span className="font-medium text-foreground">{msg.customer.name || "Customer"}</span>
                  <span className="text-xs">{new Date(msg.created_at).toLocaleString()}</span>
                </div>
                <div className="bg-secondary/50 rounded-lg rounded-tl-none p-3 text-sm">
                  {msg.body}
                </div>
              </div>

              {/* Replies */}
              {(msg.replies || []).map((reply) => (
                <div 
                  key={reply.external_id} 
                  className={`flex flex-col ${reply.is_customer ? "mb-2" : "mb-2 items-end"}`}
                >
                  <div className={`flex items-end gap-2 text-sm text-muted-foreground mb-1 ${reply.is_customer ? "" : "flex-row-reverse"}`}>
                    <span className="font-medium text-foreground">
                      {reply.is_customer ? (msg.customer.name || "Customer") : (reply.agent?.name || "Agent")}
                    </span>
                    <span className="text-xs">{new Date(reply.created_at).toLocaleString()}</span>
                  </div>
                  <div className={`rounded-lg p-3 text-sm max-w-[85%] ${
                    reply.is_customer 
                      ? "bg-secondary/50 rounded-tl-none" 
                      : "bg-primary/10 text-primary-foreground border border-primary/20 rounded-tr-none text-foreground"
                  }`}>
                    {reply.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Claim */}
          {msg.status === "unassigned" && !claimed && (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {claiming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {claiming ? "Claiming..." : "Claim This Ticket"}
            </button>
          )}

          {claimed && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle className="w-4 h-4" />
              Claimed — you can now reply
            </div>
          )}

          {/* Reply */}
          {(claimed || msg.status === "in_progress") && (
            <div className="workspace-panel">
              <h3 className="font-semibold mb-3 text-sm">Reply</h3>
              <textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your response..."
                className="w-full rounded-lg bg-secondary border border-border p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              <div className="flex items-center justify-between mt-3">
                <div className="flex gap-2 flex-wrap">
                  {cannedResponses.map((c) => (
                    <button
                      key={c.external_id}
                      onClick={() => setPreviewCanned(c)}
                      disabled={sending}
                      className="px-3 py-1.5 rounded-lg bg-accent/15 text-accent-foreground text-xs font-medium hover:bg-accent/25 transition-colors flex items-center gap-1 border border-accent/20"
                    >
                      <Zap className="w-3 h-3" />
                      {c.title}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleReply}
                  disabled={sending || !replyText.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Customer Info sidebar */}
        <div className="workspace-panel h-fit">
          <h3 className="font-semibold mb-4 text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Customer Info
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Name</span>
              <p className="font-medium">{msg.customer.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">User ID</span>
              <p className="font-mono text-xs">{msg.customer.user_id}</p>
            </div>
            {msg.customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{msg.customer.phone}</span>
              </div>
            )}
            {msg.customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{msg.customer.email}</span>
              </div>
            )}
            <div className="pt-2 border-t border-border">
              <span className="text-muted-foreground text-xs">Priority</span>
              <p className="font-semibold">{msg.priority}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Status</span>
              <p className="capitalize text-primary font-medium">{msg.status.replace("_", " ")}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Canned Response Preview Modal */}
      {previewCanned && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-lg border border-border p-6 animate-zoom-in">
            <h3 className="font-semibold text-lg mb-2">Send Canned Response?</h3>
            <p className="text-xs text-muted-foreground mb-4">Title: {previewCanned.title}</p>
            <div className="bg-secondary/50 p-3 rounded-lg text-sm mb-6 max-h-40 overflow-y-auto">
              {previewCanned.body}
            </div>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setPreviewCanned(null)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleCannedReply(previewCanned)}
                disabled={sending}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex gap-2 items-center"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Confirm Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
