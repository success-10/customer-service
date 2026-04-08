import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/store/useStore";
import type { WsEvent, Message } from "@/types";
import { api } from "@/services/api";

const WS_URL = "ws://127.0.0.1:8000/ws/agents/";
const RECONNECT_DELAY = 3000;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const {
    setWsConnected,
    prependMessage,
    updateMessage,
    removeMessage,
    activeAgent,
  } = useStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected");
      setWsConnected(true);
    };

    ws.onmessage = async (event) => {
      try {
        const data: WsEvent = JSON.parse(event.data);

        if (data.type === "message_new") {
          // Fetch full message details
          const messages = await api.getMessages("unassigned");
          const newMsg = messages.find(
            (m: Message) => m.external_id === data.message_id
          );
          if (newMsg) {
            prependMessage(newMsg);
          }
        } else if (data.type === "message_update") {
          if (
            data.status === "in_progress" &&
            data.assigned_to !== activeAgent?.external_id
          ) {
            removeMessage(data.message_id);
          } else {
            updateMessage(data.message_id, {
              status: data.status as Message["status"],
              assigned_to: data.assigned_to,
            });
          }
        }
      } catch (err) {
        console.error("[WS] Parse error:", err);
      }
    };

    ws.onclose = () => {
      console.log("[WS] Disconnected, reconnecting...");
      setWsConnected(false);
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
      ws.close();
    };
  }, [setWsConnected, prependMessage, updateMessage, removeMessage, activeAgent]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}
