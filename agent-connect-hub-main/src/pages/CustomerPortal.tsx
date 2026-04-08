import { useState } from "react";
import { api } from "@/services/api";
import { Send, Loader2, ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function CustomerPortal() {
  const [userId, setUserId] = useState("cust_" + Math.floor(Math.random() * 1000));
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSend = async () => {
    if (!body.trim() || !userId.trim()) return;
    setSending(true);
    try {
      await api.simulateCustomerMessage(userId, body, name, email);
      toast.success("Message sent successfully!");
      setSubmitted(true);
      setBody("");
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 border-b border-border bg-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold tracking-tight">Branch Support</span>
        </div>
        <button 
          onClick={() => navigate("/")}
          className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Agent Login
        </button>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg mb-8 text-center animate-fade-in">
          <h1 className="text-3xl font-bold mb-2">How can we help?</h1>
          <p className="text-muted-foreground">Submit a ticket and our agents will respond shortly.</p>
        </div>

        <div className="w-full max-w-lg bg-card border border-border shadow-sm rounded-xl p-6 animate-slide-up">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ticket Submitted!</h3>
              <p className="text-muted-foreground mb-6">Our support team has received your message and will review it shortly.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block">Customer ID *</label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block">Message *</label>
                <textarea
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Please describe your issue in detail..."
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  required
                />
              </div>
              <button
                onClick={handleSend}
                disabled={sending || !body.trim() || !userId.trim()}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? "Sending..." : "Submit Ticket"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
