import { useEffect, useRef, useState } from "react";
import { WebSocketService } from "~/utils/services/websocket/WebSocketService";
import { Message } from "~/types/chat";

export function useWebSocket(chatbotId: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocketService | null>(null);
  const messageHandlerRef = useRef<((data: any) => void) | null>(null);

  useEffect(() => {
    let wsService: WebSocketService | null = null;

    const handleMessage = (data: any) => {
      console.log('Received message:', data);
      
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          data = { type: 'message', content: data };
        }
      }

      if (data.type === 'message' || data.response) {
        const newMessage: Message = {
          id: crypto.randomUUID(),
          content: data.content || data.response || data.message || data,
          sender: 'bot',
          timestamp: new Date(),
          status: 'sent'
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    const initializeWebSocket = () => {
      if (!chatbotId) return;

      if (wsRef.current) {
        if (messageHandlerRef.current) {
          wsRef.current.removeMessageHandler(messageHandlerRef.current);
        }
        wsRef.current.disconnect();
        wsRef.current = null;
      }

      wsService = new WebSocketService(chatbotId);
      messageHandlerRef.current = handleMessage;
      
      wsService.addMessageHandler(handleMessage);
      wsService.addConnectionStateHandler(setIsConnected);
      wsService.connect();
      wsRef.current = wsService;
    };

    initializeWebSocket();

    return () => {
      if (wsService && messageHandlerRef.current) {
        wsService.removeMessageHandler(messageHandlerRef.current);
        wsService.disconnect();
        wsRef.current = null;
        messageHandlerRef.current = null;
      }
    };
  }, [chatbotId, setMessages]);

  const sendMessage = (content: string) => {
    if (!content.trim() || !wsRef.current || !isConnected) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      wsRef.current.sendMessage({
        type: 'message',
        content: content.trim()
      });
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  };

  return {
    isConnected,
    sendMessage
  };
} 