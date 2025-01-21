import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Maximize2, Minimize2, Mic, Send, Paperclip, Smile, MoreVertical } from "lucide-react";
import IconBot from "~/assets/img/bot-avatar.png";
import { Message, ChatSettings } from "~/types/chat";
import { cn } from "~/lib/utils";
import { EmojiPicker } from "~/components/chat/EmojiPicker";
import { MessageItem } from "~/components/chat/MessageItem";
import { TypingIndicator } from "~/components/chat/TypingIndicator";

interface ChatInterfaceProps {
  message: string;
  isMaximized: boolean;
  messages: Message[];
  settings: ChatSettings;
  isTyping: boolean;
  onMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  onToggleMaximize: () => void;
  onFileUpload: (file: File) => void;
  onVoiceRecord: () => void;
  onEmojiSelect: (emoji: any) => void;
}

export function ChatInterface({ 
  message, 
  isMaximized,
  messages,
  settings,
  isTyping,
  onMessageChange,
  onSendMessage,
  onToggleMaximize,
  onFileUpload,
  onVoiceRecord,
  onEmojiSelect
}: ChatInterfaceProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

          <div className="border-t bg-white p-4">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={message}
                  onChange={onMessageChange}
                  placeholder="Type your message..."
                  className="flex-1 border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => e.target.files && onFileUpload(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.txt"
                />
                <button 
                  className="p-2 hover:bg-gray-100 rounded-md"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button 
                  className="p-2 hover:bg-gray-100 rounded-md"
                  onClick={onVoiceRecord}
                >
                  <Mic className="h-4 w-4" />
                </button>
                <button 
                  className="p-2 hover:bg-gray-100 rounded-md relative"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-4 w-4" />
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-2">
                      <EmojiPicker onSelect={onEmojiSelect} />
                    </div>
                  )}
                </button>
                <button 
                  onClick={onSendMessage}
                  className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 