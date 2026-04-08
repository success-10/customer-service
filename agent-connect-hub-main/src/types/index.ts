export interface Agent {
  external_id: string;
  name: string;
}

export interface Customer {
  external_id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
}

export interface MessageReply {
  external_id: string;
  agent: Agent | null;
  is_customer: boolean;
  text: string;
  created_at: string;
}

export interface Message {
  external_id: string;
  customer: Customer;
  body: string;
  status: "unassigned" | "in_progress" | "closed";
  priority: number;
  assigned_to: Agent | null;
  replies: MessageReply[];
  created_at: string;
}

export interface CannedResponse {
  external_id: string;
  title: string;
  body: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface WsNewMessage {
  type: "message_new";
  message_id: string;
  status: string;
  body: string;
}

export interface WsMessageUpdate {
  type: "message_update";
  message_id: string;
  status: string;
  assigned_to: string;
}

export type WsEvent = WsNewMessage | WsMessageUpdate;
