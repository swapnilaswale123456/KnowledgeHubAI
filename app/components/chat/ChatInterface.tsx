import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Maximize2, Minimize2, Bot, Send, MessageSquare } from "lucide-react";
import IconBot from "~/assets/img/bot-avatar.png";
import { Message, ChatSettings } from "~/types/chat";
import { cn } from "~/lib/utils";
import { MessageItem } from "./MessageItem";
import { TypingIndicator } from "./TypingIndicator";
import { ChatInput } from "./ChatInput";
import { useWebSocket } from "~/hooks/useWebSocket";
import { THEME_COLORS } from "~/utils/theme/constants";
import { ChatHistoryService } from "~/services/chat/ChatHistoryService";
import { format } from "date-fns";
import { WebSocketService } from "~/utils/services/websocket/WebSocketService";

interface Conversation {
  sessionId: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

interface ChatInterfaceProps {
  chatbotId: string;
  messages: Message[];
  settings: ChatSettings;
  isTyping: boolean;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

// Add default theme settings
const DEFAULT_THEME = {
  headerColor: THEME_COLORS.light.header,
  botMessageColor: THEME_COLORS.light.messages.bot.text,
  userMessageColor: THEME_COLORS.light.messages.user.text
};
// At the top of the file, add mock data for initial state
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    sessionId: "initial-session",
    lastMessage: "Welcome! How can I help you today?",
    timestamp: new Date(),
    messages: [{
      id: "welcome-msg",
      content: "Welcome! How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
      status: 'sent'
    }]
  }
];

export function ChatInterface({ 
  chatbotId,
  messages: initialMessages,
  settings,
  isTyping,
  isMaximized,
  onToggleMaximize,
  setMessages: setParentMessages
}: ChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocketService | null>(null);

  // Initialize WebSocket once
  useEffect(() => {
    if (!wsRef.current) {
      wsRef.current = new WebSocketService(chatbotId);
      wsRef.current.addMessageHandler((msg: any) => {
        console.log('WebSocket message received:', msg);
        try {
          // Clean the message content if needed
          const content = msg.content.replace(/^```json\s*|\s*```$/g, '');
          const parsedMsg = JSON.parse(content);
          
          if (parsedMsg.type === 'history') {
            // Handle history message
            const data = parsedMsg.data;
            
            if (data?.conversations) {
              const appConversations = data.conversations
                .filter((conv: any) => conv && conv.session_id)
                .map((conv: any) => ChatHistoryService.convertToAppConversation(conv))
                .filter(Boolean);
              
              if (appConversations.length > 0) {
                setConversations(appConversations);
                setActiveConversation(appConversations[0].sessionId);
                setLocalMessages(appConversations[0].messages);
                setParentMessages(appConversations[0].messages);
              }
            }
          } else {
            // Handle normal message
            const data = parsedMsg.data;
            const messageContent = data?.content || data?.answer || data?.response || '';
            
            if (messageContent) {
              const newMessage: Message = {
                id: crypto.randomUUID(),
                content: messageContent,
                sender: 'bot',
                timestamp: new Date(),
                status: 'sent'
              };

              setLocalMessages(prev => [...prev, newMessage]);
              setParentMessages(prev => [...prev, newMessage]);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error, 'Raw message:', msg);
        }
      });
      wsRef.current.connect();
    }

    // Load chat history
    const loadChatHistory = async () => {
      try {
        const chatHistoryService = new ChatHistoryService();
        const response = await chatHistoryService.getHistory("user", 5);
        
        if (response?.data?.conversations) {
          const appConversations = response.data.conversations
            .filter(conv => conv && conv.session_id)
            .map(conv => ChatHistoryService.convertToAppConversation(conv))
            .filter(Boolean);

          if (appConversations.length > 0) {
            setConversations(appConversations);
            setActiveConversation(appConversations[0].sessionId);
            setLocalMessages(appConversations[0].messages);
            setParentMessages(appConversations[0].messages);
          }
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    loadChatHistory();

    return () => {
      if (wsRef.current) {
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [chatbotId, activeConversation, setParentMessages]);

  // Display messages
  const displayMessages = activeConversation 
    ? conversations.find(c => c.sessionId === activeConversation)?.messages || []
    : localMessages;

  const [message, setMessage] = useState("");
  const prevMessagesLengthRef = useRef(displayMessages.length);

  // Handle sending messages
  const handleSendMessage = () => {
    if (!message.trim() || !wsRef.current) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };

    // Update UI immediately
    setLocalMessages(prev => [...prev, userMessage]);
    setParentMessages(prev => [...prev, userMessage]);

    // Send via WebSocket
    const success = wsRef.current.sendMessage({
      type: 'message',
      content: message.trim(),
      chatbot_id: chatbotId,
      user_id: "1"
    });

    // Update message status
    const updateMessage = (prev: Message[]) => 
      prev.map(m => m.id === userMessage.id ? 
        { ...m, status: success ? 'sent' : 'error' } as Message : m
      );

    setLocalMessages(prev => updateMessage(prev));
    setParentMessages(prev => updateMessage(prev));
    setMessage('');
  };

  useEffect(() => {
    // Only scroll if new messages are added
    if (displayMessages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = displayMessages.length;
  }, [displayMessages]);

  const handleFileUpload = async (file: File) => {
    // Implement file upload logic
  };

  const handleVoiceRecord = async () => {
    // Implement voice record logic
  };
  const startNewConversation = () => {
    const newConversation: Conversation = {
      sessionId: crypto.randomUUID(),
      lastMessage: "",
      timestamp: new Date(),
      messages: []
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newConversation.sessionId);
  };
  // Get theme styles with defaults
  const getThemeStyles = () => {
    const { theme = DEFAULT_THEME } = settings;
    return {
      header: {
        backgroundColor: theme.headerColor || THEME_COLORS.light.header
      },
      botMessage: {
        backgroundColor: THEME_COLORS.light.messages.bot.background,
        color: theme.botMessageColor || THEME_COLORS.light.messages.bot.text
      },
      userMessage: {
        backgroundColor: THEME_COLORS.light.messages.user.background,
        color: theme.userMessageColor || THEME_COLORS.light.messages.user.text
      }
    };
  };

  const themeStyles = getThemeStyles();

  return (
    <div className={cn(
      "flex flex-col",
      "w-full h-[500px]",
      "bg-white rounded-2xl shadow-xl overflow-hidden",
      !isMaximized && "md:max-w-[800px]"
    )}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 text-white"
        style={themeStyles.header}
      >
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-white/10 rounded-full">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-medium leading-none">KnowledgeAI</h2>
            <p className="text-xs text-blue-100 mt-0.5">
              {isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        <button 
          onClick={onToggleMaximize}
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
        >
          {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-64 border-r bg-gray-50 flex flex-col">
          <div className="p-4 border-b">
            <button
              onClick={startNewConversation}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.sessionId}
                onClick={() => {
                  setActiveConversation(conv.sessionId);
                  setLocalMessages(conv.messages);
                  setParentMessages(conv.messages);
                }}
                className={cn(
                  "w-full p-4 text-left hover:bg-gray-100 border-b",
                  activeConversation === conv.sessionId && "bg-blue-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conv.lastMessage || "New Conversation"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(conv.timestamp), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
            {displayMessages.map((msg) => (
              <MessageItem 
                key={msg.id}
                message={msg}
                settings={settings}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-2 bg-gray-50">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-1.5 text-sm rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className={cn(
                  "p-2 rounded-full",
                  "transition-colors duration-200",
                  message.trim()
                    ? "text-white hover:opacity-90"
                    : "bg-gray-100 text-gray-400",
                )}
                style={message.trim() ? themeStyles.header : undefined}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 