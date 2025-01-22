import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Maximize2, Minimize2 } from "lucide-react";
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

    const newMessage: Message = {
      id: crypto.randomUUID(),
      content: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };

    const success = sendMessage(message);
    setMessages(prev => [...prev, { ...newMessage, status: success ? 'sent' : 'error' }]);
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
    <div className="flex-1 flex flex-col">
      <Card className="flex-1 rounded-none border-0 shadow-none">
        <CardHeader className="border-b bg-blue-500 py-3">
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <img src={IconBot} alt="Bot" className="w-6 h-6" />
              <span className="text-sm font-normal">KnowledgeAI</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onToggleMaximize}
                className="p-2 hover:bg-blue-600 rounded-md text-white"
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 flex flex-col h-[calc(100%-4rem)]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
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

          <ChatInput
            message={message}
            onMessageChange={(e) => setMessage(e.target.value)}
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            onVoiceRecord={handleVoiceRecord}
            onEmojiSelect={(emoji) => setMessage(prev => prev + emoji)}
          />
        </CardContent>
      </Card>
    </div>
  );
} 