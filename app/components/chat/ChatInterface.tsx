import { useState, useRef, useEffect, useCallback } from "react";
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

interface QuickResponse {
  id: string;
  text: string;
  category: string;
}

interface Conversation {
  sessionId: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
  tags?: string[];
}

interface ChatInterfaceProps {
  chatbotId: string;
  messages: Message[];
  settings: ChatSettings;
  isTyping: boolean;
  isMaximized: boolean;
  showConversations: boolean;
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

// Add type for session state
interface SessionState {
  sessionId: string | null;
  conversations: Conversation[];
}

// Add mock quick responses
const QUICK_RESPONSES: QuickResponse[] = [
  { id: '1', text: 'What are your business hours?', category: 'general' },
  { id: '2', text: 'How can I track my order?', category: 'orders' },
  { id: '3', text: 'I need help with a refund', category: 'support' },
  { id: '4', text: 'What payment methods do you accept?', category: 'payments' }
];

export function ChatInterface({ 
  chatbotId,
  messages: initialMessages,
  settings,
  isTyping,
  isMaximized,
  showConversations,
  onToggleMaximize,
  setMessages: setParentMessages
}: ChatInterfaceProps) {
  // Core states
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [isTypingResponse, setIsTypingResponse] = useState(false);
  const [showQuickResponses, setShowQuickResponses] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocketService | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update ref type
  const sessionRef = useRef<SessionState>({
    sessionId: null,
    conversations: []
  });

  // Add loading ref at the top with other refs
  const isLoadingHistoryRef = useRef(false);

  // Move handler outside useEffect to prevent recreation
  const messageHandler = useCallback((msg: any) => {
    console.log('Message handler called:', msg);
    handleWebSocketMessage(msg);
  }, []);

  // WebSocket setup with session management
  useEffect(() => {
    console.log('Setting up WebSocket connection');
    
    if (!wsRef.current) {
      wsRef.current = new WebSocketService(chatbotId);
      wsRef.current.addMessageHandler(messageHandler);
      wsRef.current.connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.removeMessageHandler(messageHandler);
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [chatbotId, messageHandler]);

  // Handle conversation selection with improved state management
  const handleConversationSelect = (sessionId: string, messages: Message[]) => {
    setIsLoadingMessages(true);
    
    try {
      sessionRef.current = {
        sessionId,
        conversations: sessionRef.current.conversations.map(conv => {
          if (conv.sessionId === sessionId) {
            return {
              ...conv,
              messages: messages
            };
          }
          return conv;
        })
      };

      setActiveConversation(sessionId);
      setParentMessages(messages);

      if (wsRef.current) {
        wsRef.current.updateSessionId(sessionId);
        wsRef.current.connect();
      } else {
        wsRef.current = new WebSocketService(chatbotId, sessionId);
        wsRef.current.addMessageHandler(handleWebSocketMessage);
        wsRef.current.connect();
      }

      setIsProcessing(false);
    } catch (error) {
      console.error('Error selecting conversation:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Handle new session creation
  const handleNewSession = (sessionId: string) => {
    console.log('New session created:', sessionId);
    
    // Update WebSocket connection
    if (wsRef.current) {
      wsRef.current.updateSessionId(sessionId);      
    }

    const newConversation: Conversation = {
      sessionId,
      lastMessage: "New conversation",
      timestamp: new Date(),
      messages: []
    };

    // Update session ref and state atomically
    sessionRef.current = {
      sessionId,
      conversations: [newConversation, ...sessionRef.current.conversations]
    };

    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(sessionId);
    setParentMessages([]);
  };

  // Handle WebSocket connection state
  useEffect(() => {
    if (!wsRef.current) return;

    const handleConnect = () => {
      console.log('WebSocket connected');
      // Restore session on reconnect if we have one
      if (sessionRef.current.sessionId) {
        wsRef.current?.updateSessionId(sessionRef.current.sessionId);
      }
    };

    const handleDisconnect = () => {
      console.log('WebSocket disconnected');
    };

    wsRef.current.addConnectionStateHandler(handleConnect);
    wsRef.current.addConnectionStateHandler(handleDisconnect);

    return () => {
      wsRef.current?.removeConnectionStateHandler(handleConnect);
      wsRef.current?.removeConnectionStateHandler(handleDisconnect);
    };
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = async (msg: any) => {
    try {
      console.log('WebSocket message received:', msg);
            
      const parsedMsg = msg;
      
      if (parsedMsg.type === 'session_created') {
        // Replace temporary session with real one
        const realSessionId = parsedMsg.session_id;
        const tempSession = sessionRef.current.conversations[0]; // Most recent temp session

        if (tempSession && tempSession.sessionId.startsWith('temp-')) {
          const updatedConversation = {
            ...tempSession,
            sessionId: realSessionId
          };

          // Update ref
          sessionRef.current = {
            sessionId: realSessionId,
            conversations: [
              updatedConversation,
              ...sessionRef.current.conversations.slice(1)
            ]
          };

          // Update state
          setConversations(prev => [
            updatedConversation,
            ...prev.slice(1)
          ]);
          setActiveConversation(realSessionId);
        } else {
          // No temp session, create new one
          handleNewSession(realSessionId);
        }
        
        setIsProcessing(false);
        return;
      } 
      
      if (parsedMsg.type === 'message' || parsedMsg.type === 'response') {
        const messageContent = 
          parsedMsg.data?.content || 
          parsedMsg.data?.answer || 
          parsedMsg.data?.response || 
          parsedMsg.content || 
          parsedMsg.answer || 
          parsedMsg.response || '';
        
        const sessionId = parsedMsg.session_id || sessionRef.current.sessionId;
        
        if (!sessionId) {
          console.warn('No session ID for message:', messageContent);
          return;
        }

        if (messageContent) {
          const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const botMessage: Message = {
            id: uniqueId,
            content: messageContent,
            sender: 'bot',
            timestamp: new Date(),
            status: 'sent'
          };

          // Update conversations with session persistence
          setConversations(prev => {
            // First check if conversation exists in ref
            const existingConv = sessionRef.current.conversations.find(c => c.sessionId === sessionId);
            
            if (!existingConv) {
              const newConv: Conversation = {
                sessionId,
                lastMessage: messageContent?.replace(/<\/?[^>]+(>|$)/g, ""),
                timestamp: new Date(),
                messages: [botMessage]
              };
              
              // Update ref
              sessionRef.current.conversations = [newConv, ...sessionRef.current.conversations];
              return sessionRef.current.conversations;
            }

            // Update existing conversation in ref
            const updatedConversations = sessionRef.current.conversations.map(conv => {
              if (conv.sessionId === sessionId) {
                const messageExists = conv.messages.some(m => m.content === messageContent);
                if (messageExists) return conv;

                const updated = {
                  ...conv,
                  messages: [...conv.messages, botMessage],
                  lastMessage: messageContent?.replace(/<\/?[^>]+(>|$)/g, ""),
                  timestamp: new Date()
                };
                return updated;
              }
              return conv;
            });

            // Update ref and return new state
            sessionRef.current.conversations = updatedConversations;
            return updatedConversations;
          });

          // Update parent messages
          if (sessionId === activeConversation) {
            setParentMessages(prev => {
              const messageExists = prev.some(m => m.content === messageContent);
              if (messageExists) return prev;
              return [...prev, botMessage];
            });
            
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }

          setIsProcessing(false);
        }
      }

      if (parsedMsg.type === 'typing_start') {
        setIsTypingResponse(true);
      } else if (parsedMsg.type === 'typing_end') {
        setIsTypingResponse(false);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      setIsProcessing(false);
    }
  };

  // Start new conversation
  const startNewConversation = () => {
    if (!wsRef.current) return;
    
    // Clear current states first
    setActiveConversation(null);
    setParentMessages([]);
    setIsProcessing(true);

    // Create temporary session
    const tempSessionId = `temp-${Date.now()}`;
    const tempConversation: Conversation = {
      sessionId: tempSessionId,
      lastMessage: "Starting new conversation...",
      timestamp: new Date(),
      messages: [{
        id: "welcome-msg",
        content: "Welcome! How can I help you today?",
        sender: 'bot',
        timestamp: new Date(),
        status: 'sent'
      }]
    };

    // Update ref and state
    sessionRef.current = {
      sessionId: tempSessionId,
      conversations: [tempConversation, ...sessionRef.current.conversations]
    };

    setConversations(prev => [tempConversation, ...prev]);
    
    // Request new session from server
    wsRef.current.sendMessage({ 
      type: 'new_session', 
      content: '',
      chatbot_id: chatbotId,
      user_id: "user"
    });
  };

  // Get current conversation messages
  const currentMessages = activeConversation 
    ? sessionRef.current.conversations.find(c => c.sessionId === activeConversation)?.messages || []
    : [];

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

  // Update the loadChatHistory useEffect
  useEffect(() => {
    const loadChatHistory = async () => {
      // Prevent duplicate calls
      if (isLoadingHistoryRef.current) return;
      isLoadingHistoryRef.current = true;

      setIsLoading(true);
      setIsLoadingHistory(true);
      try {
        const chatHistoryService = new ChatHistoryService();
        const response = await chatHistoryService.getHistory("user", 8);
        
        if (response?.data?.conversations?.length > 0) {
          const appConversations = response.data.conversations
            .filter((conv: any) => conv && conv.session_id)
            .map((conv: any) => ChatHistoryService.convertToAppConversation(conv))
            .filter(Boolean);

          if (appConversations.length > 0) {
            sessionRef.current = {
              sessionId: appConversations[0].sessionId,
              conversations: appConversations
            };

            setConversations(appConversations);
            setActiveConversation(appConversations[0].sessionId);
            setParentMessages(appConversations[0].messages);

            if (wsRef.current && appConversations[0].sessionId) {
              wsRef.current.updateSessionId(appConversations[0].sessionId);
            }
          }
        } else {
          console.log('No chat history found, starting new conversation');
          startNewConversation();
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        sessionRef.current = { sessionId: null, conversations: [] };
      } finally {
        setIsLoading(false);
        setIsLoadingHistory(false);
        isLoadingHistoryRef.current = false;
      }
    };

    loadChatHistory();
  }, []);

  // Add scroll effect for new messages
  useEffect(() => {
    if (currentMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages]);

  // Add this before the return statement
  const handleSendMessage = () => {
    if (!message.trim() || !wsRef.current || isProcessing) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: message.trim(),
      sender: 'user',
      timestamp: new Date(),
      status: 'sending'
    };

    // Set processing state
    setIsProcessing(true);

    // Get current session ID
    const currentSessionId = sessionRef.current.sessionId || activeConversation;

    // Update conversation with user message
    if (currentSessionId) {
      // Update both ref and state
      setConversations(prev => {
        const updatedConversations = prev.map(conv => {
          if (conv.sessionId === currentSessionId) {
            const plainTextMessage = message.replace(/<\/?[^>]+(>|$)/g, "");
            const updatedConv = {
              ...conv,
              messages: [...conv.messages, userMessage],
              lastMessage: plainTextMessage,
              timestamp: new Date()
            };
            
            // Update conversation in ref
            sessionRef.current.conversations = sessionRef.current.conversations.map(c => 
              c.sessionId === currentSessionId ? updatedConv : c
            );
            
            return updatedConv;
          }
          return conv;
        });

        return updatedConversations;
      });

      // Update parent messages if this is active conversation
      if (currentSessionId === activeConversation) {
        setParentMessages(prev => [...prev, userMessage]);
      }

      // Send message with current session
      wsRef.current.sendMessage({
        type: 'message',
        content: message.trim(),
        chatbot_id: chatbotId,
        user_id: "user",
        session_id: currentSessionId
      });
    } else {
      // No active session, create new one
      console.log('No active session, creating new conversation');
      wsRef.current.sendMessage({
        type: 'new_session',
        content: message.trim(),
        chatbot_id: chatbotId,
        user_id: "user"
      });

      // Create temporary conversation
      const tempSessionId = `temp-${Date.now()}`;
      const newConversation: Conversation = {
        sessionId: tempSessionId,
        lastMessage: message.trim(),
        timestamp: new Date(),
        messages: [userMessage]
      };

      // Update ref and state
      sessionRef.current = {
        sessionId: tempSessionId,
        conversations: [newConversation, ...sessionRef.current.conversations]
      };

      setConversations(prev => [newConversation, ...prev]);
      setActiveConversation(tempSessionId);
      setParentMessages([userMessage]);
    }

    setMessage('');
  };

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
        {showConversations && (
          <div className="w-64 border-r bg-gray-50 flex flex-col">
            <div className="p-4 border-b">
              <button
                onClick={startNewConversation}
                disabled={isProcessing}
                className={cn(
                  "w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg",
                  isProcessing ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
                )}
              >
                {isProcessing ? "Creating..." : "New Chat"}
              </button>
            </div>

            {/* Simplified conversation list without folders */}
            <div className="flex-1 overflow-y-auto">
              {sessionRef.current.conversations.map(conv => (
                <button
                  key={conv.sessionId}
                  onClick={() => handleConversationSelect(conv.sessionId, conv.messages)}
                  className={cn(
                    "w-full p-4 text-left hover:bg-gray-100 border-b",
                    activeConversation === conv.sessionId && "bg-blue-50",
                    isLoadingMessages && "opacity-50 cursor-not-allowed"
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
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
                {currentMessages.map((msg) => (
                  <MessageItem 
                    key={msg.id}
                    message={msg}
                    settings={settings}
                  />
                ))}
                {isProcessing && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="animate-pulse">Analyzing...</div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area with Quick Responses Toggle */}
              <div className="border-t p-2 bg-gray-50">
                {isTypingResponse && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>AI is typing...</span>
                  </div>
                )}
                <ChatInput
                  message={message}
                  setMessage={setMessage}
                  onSend={handleSendMessage}
                  disabled={isProcessing || isLoadingMessages || !wsRef.current?.isConnected}
                  onFileUpload={(file) => console.log('File upload:', file)}
                  onVoiceRecord={() => console.log('Voice record')}
                  onEmojiSelect={(emoji) => setMessage(prev => prev + emoji)}
                  onQuickResponsesToggle={() => setShowQuickResponses(prev => !prev)}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 