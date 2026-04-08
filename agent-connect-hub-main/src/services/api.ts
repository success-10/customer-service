import axios from "axios";
import type { Agent, Message, CannedResponse, ApiResponse, PaginatedResponse } from "@/types";

const BASE_URL = "http://127.0.0.1:8000";

const client = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

export const api = {
  // Agents
  getAgents: () => client.get<PaginatedResponse<Agent>>("/api/agents/").then((r) => r.data.results || (Array.isArray(r.data) ? r.data : [])),

  // Messages
  getMessages: (status?: string, page: number = 1) =>
    client
      .get<PaginatedResponse<Message>>("/api/messages/", { params: { ...(status ? { status } : {}), page } })
      .then((r) => r.data),

  claimMessage: (messageId: string, agentId: string) =>
    client
      .post<ApiResponse<{ message_external_id: string; claimed_by: string }>>(
        `/api/messages/${messageId}/claim/`,
        { agent_id: agentId }
      )
      .then((r) => r.data),

  replyMessage: (messageId: string, agentId: string, text: string) =>
    client
      .post<ApiResponse<unknown>>(`/api/messages/${messageId}/reply/`, {
        agent_id: agentId,
        text,
      })
      .then((r) => r.data),

  useCanned: (messageId: string, agentId: string, cannedId: string) =>
    client
      .post<ApiResponse<unknown>>(`/api/messages/${messageId}/use_canned/`, {
        agent_id: agentId,
        canned_id: cannedId,
      })
      .then((r) => r.data),

  // Canned Responses
  getCannedResponses: (page: number = 1) =>
    client.get<PaginatedResponse<CannedResponse>>("/api/canned/", { params: { page } }).then((r) => r.data),

  createCannedResponse: (title: string, body: string) =>
    client.post<CannedResponse>("/api/canned/", { title, body }).then((r) => r.data),

  // Customer Simulation
  simulateCustomerMessage: (userId: string, body: string, name?: string, email?: string) =>
    client.post("/api/messages/", { user_id: userId, body, name, email }).then((r) => r.data),
    
  simulateCustomerReply: (messageId: string, text: string) =>
    client.post<ApiResponse<unknown>>(`/api/messages/${messageId}/customer_reply/`, { text }).then((r) => r.data),
};
