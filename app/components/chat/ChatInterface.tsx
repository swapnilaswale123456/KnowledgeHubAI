import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Maximize2, Minimize2, Bot, Send } from "lucide-react";
import IconBot from "~/assets/img/bot-avatar.png";
import { Message, ChatSettings } from "~/types/chat";
import { cn } from "~/lib/utils";
import { MessageItem } from "./MessageItem";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { useWebSocket } from "~/hooks/useWebSocket";

interface ChatInterfaceProps {
  chatbotId: string;
  messages: Message[];
  settings: ChatSettings;
  isTyping: boolean;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function ChatInterface({ 
  chatbotId,
  messages,
  settings,
  isTyping,
  isMaximized,
  onToggleMaximize,
  setMessages
}: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, sendMessage } = useWebSocket(chatbotId, setMessages);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);

    const success = sendMessage({
      type: 'message',
      content: message.trim(),
      chatbot_id: chatbotId
    });

    if (!success) {
      setMessages(prev => 
        prev.map(m => 
          m.id === userMessage.id 
            ? { ...m, status: 'error' } 
            : m
        )
      );
    } else {
      setMessages(prev => 
        prev.map(m => 
          m.id === userMessage.id 
            ? { ...m, status: 'sent' } 
            : m
        )
      );
    }

    setMessage('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (file: File) => {
    // Implement file upload logic
  };

  const handleVoiceRecord = async () => {
    // Implement voice record logic
  };

  return (
    <div className={cn(
      "flex-1 flex flex-col",
      "w-full md:max-w-[400px] h-[600px]",
      "bg-white rounded-lg shadow-lg overflow-hidden",
      isMaximized && "md:max-w-[800px] h-screen"
    )}>
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/10 rounded-full">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-medium">KnowledgeAI</h2>
            <p className="text-xs text-blue-100">
              {isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        <button 
          onClick={onToggleMaximize}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth">
        {messages.map((msg) => (
          <MessageItem 
            key={msg.id}
            message={msg}
            settings={settings}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-4 bg-gray-50">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim()}
            className={cn(
              "p-3 rounded-full",
              "transition-colors duration-200",
              message.trim()
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-100 text-gray-400"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 