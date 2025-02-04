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
  const prevMessagesLengthRef = useRef(messages.length);
 // Initialize with mock data
 const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
 const [activeConversation, setActiveConversation] = useState<string | null>(null);
 const [setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (!message.trim() || !activeConversation) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };
    setConversations(prev => prev.map(conv => {
      if (conv.sessionId === activeConversation) {
        return {
          ...conv,
          messages: [...conv.messages, userMessage],
          lastMessage: message.trim(),
          timestamp: new Date()
        };
      }
      return conv;
    }));
    setMessages(prev => [...prev, userMessage]);

    const success = sendMessage({
      type: 'message',
      content: message.trim(),
      chatbot_id: chatbotId,
      user_id: "1"      
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
    //setIsTyping(true);
  };
  // Load initial conversations
  useEffect(() => {
    const chatHistoryService = new ChatHistoryService();
    
    const fetchConversations = async () => {
      console.log('Starting to fetch conversations...');
      try {
        const response = await chatHistoryService.getHistory("user", 5);
        console.log('API Response:', response);
        
        if (!response?.conversations) {
          console.error('Invalid response format:', response);
          setConversations(MOCK_CONVERSATIONS);
          setActiveConversation(MOCK_CONVERSATIONS[0].sessionId);
          return;
        }

        const appConversations = response.conversations
          .filter(conv => conv && conv.session_id)
          .map(conv => {
            try {
              return ChatHistoryService.convertToAppConversation(conv);
            } catch (error) {
              console.error('Error converting conversation:', error, conv);
              return null;
            }
          })
          .filter(Boolean);

        console.log('Converted conversations:', appConversations);
        
        if (appConversations.length > 0) {
          setConversations(appConversations as Conversation[]);
          setActiveConversation(appConversations[0]?.sessionId || null);
        } else {
          setConversations(MOCK_CONVERSATIONS);
          setActiveConversation(MOCK_CONVERSATIONS[0].sessionId);
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setConversations(MOCK_CONVERSATIONS);
        setActiveConversation(MOCK_CONVERSATIONS[0].sessionId);
      }
    };

    fetchConversations();
  }, [chatbotId]);
  // Get active messages from current conversation
  const activeMessages = conversations.find(c => c.sessionId === activeConversation)?.messages || [];

  useEffect(() => {
    // Only scroll if new messages are added
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

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
                onClick={() => setActiveConversation(conv.sessionId)}
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
                      {new Date(conv.timestamp).toLocaleString()}
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
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "rounded-lg p-3 max-w-[80%]",
                  msg.sender === 'user' && "ml-auto"
                )}
                style={msg.sender === 'user' ? themeStyles.userMessage : themeStyles.botMessage}
              >
                {msg.content}
              </div>
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