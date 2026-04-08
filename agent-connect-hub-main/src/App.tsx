import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AgentSelector from "./pages/AgentSelector";
import InboxPage from "./pages/InboxPage";
import WorkspacePage from "./pages/WorkspacePage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import CustomerPortal from "./pages/CustomerPortal";
import AppLayout from "./components/layout/AppLayout";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AgentSelector />} />
        <Route path="/customer" element={<CustomerPortal />} />
        <Route element={<AppLayout />}>
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/workspace" element={<WorkspacePage />} />
          <Route path="/knowledge" element={<KnowledgeBasePage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
