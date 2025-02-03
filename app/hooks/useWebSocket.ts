import { useEffect, useRef, useState, useCallback } from "react";
import { WebSocketService } from "~/utils/services/websocket/WebSocketService";
import { Message } from "~/types/chat";

export function useWebSocket(chatbotId: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocketService | null>(null);
  const messageHandlerRef = useRef<((data: any) => void) | null>(null);

  const handleMessage = useCallback((data: any) => {
    console.log('Received WebSocket data in hook:', data);
    
    const newMessage: Message = {
      id: crypto.randomUUID(),
      content: data.content || data.answer || data.response || data,
      sender: 'bot',
      timestamp: new Date(),
      status: 'sent',
      isFormatted: data.type === 'html' || (typeof data.content === 'string' && data.content.includes('<')),
    };

    console.log('Created new message:', newMessage);
    setMessages(prev => [...prev, newMessage]);
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

  const sendMessage = useCallback((message: string | { type: string; content: string; chatbot_id?: string; user_id?: string }) => {
    if (!wsRef.current || !isConnected) {
      console.warn('Cannot send message: WebSocket not connected');
      return false;
    }

    try {
      // If message is a string, convert it to the expected format
      const messagePayload = typeof message === 'string' 
        ? {
            type: 'message',
            content: message.trim(),
            chatbot_id: chatbotId,
            user_id: "1"
          }
        : message;

      if (!messagePayload.content || (typeof messagePayload.content === 'string' && !messagePayload.content.trim())) {
        console.warn('Cannot send empty message');
        return false;
      }

      return wsRef.current.sendMessage(messagePayload);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to send message'));
      return false;
    }
  }, [isConnected, chatbotId]);

  return {
    isConnected,
    sendMessage,
    error
  };
} 