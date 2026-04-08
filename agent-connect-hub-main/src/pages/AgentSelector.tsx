import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/services/api";
import { useStore } from "@/store/useStore";
import type { Agent } from "@/types";
import { Users, ArrowRight, Loader2 } from "lucide-react";

export default function AgentSelector() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { setActiveAgent } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getAgents()
      .then(setAgents)
      .catch(() => setError("Failed to load agents. Is the backend running?"))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (agent: Agent) => {
    setActiveAgent(agent);
    navigate("/inbox");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Branch CS</h1>
          <p className="text-muted-foreground mt-2">Select your agent profile to begin</p>
        </div>

        {loading && (
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        )}

        {error && (
          <div className="glass-panel p-4 text-center text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {agents.map((agent) => (
            <button
              key={agent.external_id}
              onClick={() => handleSelect(agent)}
              className="agent-card"
            >
              <div className="agent-avatar w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center text-xl font-bold text-primary transition-all duration-300">
                {agent.name[0]}
              </div>
              <span className="font-medium">{agent.name}</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center animate-slide-up" style={{ animationDelay: "200ms" }}>
          <p className="text-sm text-muted-foreground mb-4">Are you a customer?</p>
          <button
            onClick={() => navigate("/customer")}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors inline-flex items-center justify-center gap-2"
          >
            Go to Customer Portal
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
