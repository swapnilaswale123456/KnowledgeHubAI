import { useEffect, useRef, useState, useCallback } from "react";
import { WebSocketService } from "~/utils/services/websocket/WebSocketService";
import { Message } from "~/types/chat";

export function useWebSocket(chatbotId: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocketService | null>(null);
  const messageHandlerRef = useRef<((data: any) => void) | null>(null);

  const handleMessage = useCallback((data: any) => {
    try {
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
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error processing message'));
    }
  }, [setMessages]);

  useEffect(() => {
    let wsService: WebSocketService | null = null;

    const initializeWebSocket = () => {
      if (!chatbotId) return;

      try {
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
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize WebSocket'));
      }
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
  }, [chatbotId, handleMessage]);

  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || !wsRef.current || !isConnected) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      return wsRef.current.sendMessage({
        type: 'message',
        content: content.trim()
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      return false;
    }
  }, [isConnected]);

  return {
    isConnected,
    sendMessage,
    error
  };
} 