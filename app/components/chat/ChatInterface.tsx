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
import { getUserSession } from "~/utils/session.server";

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
  userId: string;
  currentMessage: string;
  messages: Message[];
  settings: ChatSettings;
  isTyping: boolean;
  isMaximized: boolean;
  showConversations: boolean;
  onMessageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  onToggleMaximize: () => void;
  onFileUpload: (file: File) => void;
  onVoiceRecord: () => void;
  onEmojiSelect: (emoji: string) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isEmbedded?: boolean;
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
  streamMessageId?: string | null;
}

// Add mock quick responses
const QUICK_RESPONSES: QuickResponse[] = [
  { id: '1', text: 'What are your business hours?', category: 'general' },
  { id: '2', text: 'How can I track my order?', category: 'orders' },
  { id: '3', text: 'I need help with a refund', category: 'support' },
  { id: '4', text: 'What payment methods do you accept?', category: 'payments' }
];

// Declare the global window interface extension
declare global {
  interface Window {
    _recentWorkflowMessages?: Map<string, number>;
  }
}

export function ChatInterface({ 
  chatbotId,
  userId,
  currentMessage,
  messages: initialMessages,
  settings,
  isTyping,
  isMaximized,
  showConversations,
  onMessageChange,
  onSendMessage,
  onToggleMaximize,
  onFileUpload,
  onVoiceRecord,
  onEmojiSelect,
  setMessages: setParentMessages,
  isEmbedded
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
    conversations: [],
    streamMessageId: null
  });

  // Add loading ref at the top with other refs
  const isLoadingHistoryRef = useRef(false);

  // At the top with other refs
  const eventHandlersAttachedRef = useRef(false);

  // Add a new ref to track the last message time
  const lastMessageTimeRef = useRef<number>(Date.now());

  // Move handler outside useEffect to prevent recreation
  const messageHandler = useCallback((msg: any) => {
    console.log('Message handler called:', msg);
    handleWebSocketMessage(msg);
  }, []);

  // WebSocket setup with session management
  useEffect(() => {
    console.log('Setting up WebSocket connection');
    
    if (!wsRef.current) {
      wsRef.current = new WebSocketService(chatbotId, userId);
      wsRef.current.addMessageHandler(messageHandler);
      wsRef.current.connect();
    }

    // Add event listener for workflow input submissions
    const handleWorkflowInputSubmit = (event: CustomEvent) => {
      if (wsRef.current && wsRef.current.isConnected()) {
        const inputData = event.detail;
        console.log('Sending workflow input via WebSocket:', inputData);
        wsRef.current.sendMessage({
          type: inputData.type,
          content: JSON.stringify(inputData),
          chatbot_id: chatbotId,
          user_id: userId,
          session_id: sessionRef.current.sessionId || undefined
        });
      } else {
        console.error('Cannot send workflow input: WebSocket not connected');
      }
    };

    window.addEventListener('send-workflow-input', handleWorkflowInputSubmit as EventListener);

    return () => {
      window.removeEventListener('send-workflow-input', handleWorkflowInputSubmit as EventListener);
      if (wsRef.current) {
        wsRef.current.removeMessageHandler(messageHandler);
        wsRef.current.disconnect();
        wsRef.current = null;
      }
    };
  }, [chatbotId, userId, messageHandler]);

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
      conversations: [newConversation, ...sessionRef.current.conversations],
      streamMessageId: null
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

      // Handle session creation
      if (parsedMsg.type === 'session_created') {
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
            ],
            streamMessageId: null
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
      
      // Handle bot messages, including streaming
      if (parsedMsg.type === 'message' || parsedMsg.type === 'response' || parsedMsg.type === 'error' || parsedMsg.type === 'stream') {
        // Extract content from message
        const messageContent = parsedMsg.type === 'error' 
          ? (parsedMsg.data?.message || parsedMsg.data?.error || parsedMsg.message || parsedMsg.error || "Sorry, I encountered an error. Please try again.")
          : (parsedMsg.data?.content || parsedMsg.data?.answer || parsedMsg.data?.response || parsedMsg.content || parsedMsg.answer || parsedMsg.response || '');

        const sessionId = parsedMsg.session_id || sessionRef.current.sessionId;
        
        if (!sessionId) {
          console.warn('No session ID for message:', messageContent);
          return;
        }

        if (!messageContent) {
          console.warn('No content in message');
          return;
        }

        // Track this message arrival time
        lastMessageTimeRef.current = Date.now();
        
        // Handle the message
        const isStreamMessage = parsedMsg.type === 'stream';
        
        // For streaming, maintain a consistent message ID
        if (isStreamMessage && !sessionRef.current.streamMessageId) {
          // Starting a new stream
          sessionRef.current.streamMessageId = `stream-${Date.now()}`;
          console.log(`[STREAM] Starting new stream with ID: ${sessionRef.current.streamMessageId}`);
        }
        
        // Use the stream ID for streams, or generate a unique ID for regular messages
        const messageId = isStreamMessage 
          ? sessionRef.current.streamMessageId!
          : `msg-${Date.now()}`;
        
        console.log(`[CHAT] Processing ${parsedMsg.type} message with ID ${messageId}`);
        
        // Reset stream ID when we receive a non-stream message
        if (!isStreamMessage) {
          sessionRef.current.streamMessageId = null;
        }
        
        // Create bot message
        const botMessage: Message = {
          id: messageId,
          content: messageContent,
          sender: 'bot',
          timestamp: new Date(),
          status: parsedMsg.type === 'error' ? 'error' : 'sent'
        };

        // Force immediate UI update for faster rendering of bot messages
        // This helps ensure messages show up right away
        setIsProcessing(false);
        setIsTypingResponse(false);
        
        // Update conversations - create an immediate update function
        // to ensure rendering happens right away
        const updateConversations = () => {
          setConversations(prevConversations => {
            // Try to find the conversation for this session
            const conversation = prevConversations.find(c => c.sessionId === sessionId);
            
            if (!conversation) {
              // Create a new conversation
              const newConversation: Conversation = {
                sessionId,
                lastMessage: messageContent.replace(/<\/?[^>]+(>|$)/g, ""),
                timestamp: new Date(),
                messages: [botMessage]
              };

              // Update sessionRef to match
              sessionRef.current.conversations = [
                newConversation,
                ...sessionRef.current.conversations.filter(c => c.sessionId !== sessionId)
              ];

              return [newConversation, ...prevConversations];
            }
            
            // Handle existing conversation
            let updatedMessages: Message[];
            
            if (isStreamMessage) {
              // For streaming, try to find an existing message with the same ID
              const existingMessageIndex = conversation.messages.findIndex(m => 
                m.id === messageId && m.sender === 'bot'
              );
              
              if (existingMessageIndex >= 0) {
                // Update the existing message by appending content
                console.log(`[STREAM] Appending to message at index ${existingMessageIndex}`);
                updatedMessages = [...conversation.messages];
                updatedMessages[existingMessageIndex] = {
                  ...updatedMessages[existingMessageIndex],
                  content: updatedMessages[existingMessageIndex].content + messageContent
                };
              } else {
                // Create a new message for the first chunk
                console.log(`[STREAM] First chunk, creating new message`);
                updatedMessages = [...conversation.messages, botMessage];
              }
            } else {
              // For regular messages, always add a new message
              updatedMessages = [...conversation.messages, botMessage];
            }
            
            // Create updated conversation
            const updatedConversation: Conversation = {
              ...conversation,
              messages: updatedMessages,
              lastMessage: messageContent.replace(/<\/?[^>]+(>|$)/g, ""),
              timestamp: new Date()
            };
            
            // Update sessionRef to match the state
            const updatedConversations = prevConversations.map(c => 
              c.sessionId === sessionId ? updatedConversation : c
            );
            
            sessionRef.current.conversations = updatedConversations;
            
            return updatedConversations;
          });
        };
        
        // Update parent messages if this is the active conversation
        const updateParentMessages = () => {
          if (sessionId === activeConversation) {
            setParentMessages(prevMessages => {
              if (isStreamMessage) {
                // For streaming, try to find an existing message with the same ID
                const existingMessageIndex = prevMessages.findIndex(m => 
                  m.id === messageId && m.sender === 'bot'
                );
                
                if (existingMessageIndex >= 0) {
                  // Update the existing message
                  console.log(`[STREAM] Appending to parent message at index ${existingMessageIndex}`);
                  const updatedMessages = [...prevMessages];
                  updatedMessages[existingMessageIndex] = {
                    ...updatedMessages[existingMessageIndex],
                    content: updatedMessages[existingMessageIndex].content + messageContent
                  };
                  
                  // Ensure immediate scroll
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }, 10);
                  
                  return updatedMessages;
                }
              }
              
              // For non-streaming or first chunk, add a new message
              // Ensure immediate scroll
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 10);
              
              return [...prevMessages, botMessage];
            });
          }
        };
        
        // Perform updates in the correct order
        updateConversations();
        updateParentMessages();
        
        // Force multiple re-renders to ensure UI updates correctly
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          setIsTypingResponse(prev => prev);
        }, 50);
        
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
        
        setIsTypingResponse(false);
        setIsProcessing(false);
      }

      // Handle workflow input requests
      if (parsedMsg.type === 'workflow_input_required') {
        // IMMEDIATE UI UPDATES - Do this first to ensure responsiveness
        setIsProcessing(false);
        setIsTypingResponse(false);
        
        // Record message time for our continuous checker
        lastMessageTimeRef.current = Date.now();
        
        console.log('[WORKFLOW] Input required:', parsedMsg);
        
        // End any streaming session
        sessionRef.current.streamMessageId = null;
        
        // Extract workflow input details
        const executionId = parsedMsg.execution_id;
        const workflowId = parsedMsg.workflow;
        const blockId = parsedMsg.input_config?.block_id;
        const sessionId = parsedMsg.session_id || sessionRef.current.sessionId;
        const inputConfig = parsedMsg.input_config || {};
        
        // Generate a unique ID for this workflow input request
        const inputRequestId = `input-${executionId}-${blockId}-${Date.now()}`;
        
        // Deduplicate using the Map
        if (!window._recentWorkflowMessages) {
          window._recentWorkflowMessages = new Map();
        }
        
        // Clean up old entries
        const now = Date.now();
        window._recentWorkflowMessages.forEach((timestamp, key) => {
          if (now - timestamp > 5000) {
            window._recentWorkflowMessages!.delete(key);
          }
        });
        
        // Check for duplicates by execution and block ID
        const messageKey = `${executionId}-${blockId}`;
        if (window._recentWorkflowMessages.has(messageKey)) {
          console.log('[WORKFLOW] Ignoring duplicate input request:', messageKey);
          return;
        }
        
        // Mark as processed
        window._recentWorkflowMessages.set(messageKey, now);
        
        console.log(`[WORKFLOW] Processing input request: ${messageKey}`);
        
        // Create a special bot message for workflow input
        const botMessage: Message = {
          id: inputRequestId,
          content: parsedMsg.content || inputConfig.message || "Please provide input to continue",
          sender: 'bot',
          timestamp: new Date(),
          status: 'sent',
          metadata: {
            isWorkflowInputRequest: true,
            workflowInputConfig: {
              id: inputRequestId,
              executionId,
              workflowId,
              blockId: inputConfig.block_id,
              inputType: inputConfig.input_type || 'text',
              options: inputConfig.options || {},
              inputName: (inputConfig.input_name || 'input').trim().replace(/\.{3}$/, '')
            },
            inputSubmitted: false
          }
        };
        
        // AGGRESSIVE IMMEDIATE UPDATES
        // Create two separate functions so we can control execution order
        
        // 1. Update conversations state
        const updateConversations = () => {
          setConversations(prevConversations => {
            // Find the conversation
            const conversation = prevConversations.find(c => c.sessionId === sessionId);
            
            if (!conversation) {
              // Create a new conversation
              const newConversation: Conversation = {
                sessionId,
                lastMessage: botMessage.content.replace(/<\/?[^>]+(>|$)/g, ""),
                timestamp: new Date(),
                messages: [botMessage]
              };
              
              // Update ref to match state
              sessionRef.current.conversations = [
                newConversation, 
                ...sessionRef.current.conversations.filter(c => c.sessionId !== sessionId)
              ];
              
              return [newConversation, ...prevConversations];
            }
            
            // Check for duplicate input requests in existing conversation
            const hasDuplicateRequest = conversation.messages.some(msg => 
              msg.metadata?.isWorkflowInputRequest && 
              msg.metadata.workflowInputConfig?.executionId === executionId &&
              msg.metadata.workflowInputConfig?.blockId === blockId
            );
            
            if (hasDuplicateRequest) {
              console.log('[WORKFLOW] Input request already exists in conversation, not adding duplicate');
              return prevConversations;
            }
            
            // Add to existing conversation
            const updatedConversation: Conversation = {
              ...conversation,
              messages: [...conversation.messages, botMessage],
              lastMessage: botMessage.content.replace(/<\/?[^>]+(>|$)/g, ""),
              timestamp: new Date()
            };
            
            // Update ref to match state
            const updatedConversations = prevConversations.map(c => 
              c.sessionId === sessionId ? updatedConversation : c
            );
            sessionRef.current.conversations = updatedConversations;
            
            console.log('[WORKFLOW] Updated conversations with input request');
            return updatedConversations;
          });
        };
        
        // 2. Update parent messages state (if active conversation)
        const updateParentMessages = () => {
          if (sessionId === activeConversation) {
            setParentMessages(prevMessages => {
              // Check for duplicates
              const hasDuplicateRequest = prevMessages.some(msg => 
                msg.metadata?.isWorkflowInputRequest && 
                msg.metadata.workflowInputConfig?.executionId === executionId &&
                msg.metadata.workflowInputConfig?.blockId === blockId
              );
              
              if (hasDuplicateRequest) {
                console.log('[WORKFLOW] Input request already exists in parent messages, not adding duplicate');
                return prevMessages;
              }
              
              console.log('[WORKFLOW] Adding input request to parent messages');
              return [...prevMessages, botMessage];
            });
          }
        };
        
        // Execute state updates in sequence
        updateConversations();
        // Very small delay to allow React to process first update
        setTimeout(updateParentMessages, 0);
        
        // FORCE IMMEDIATE RENDERING through multiple techniques
        
        // 1. Immediate scroll attempt using zero timeout (microtask-like)
        setTimeout(() => {
          console.log('[WORKFLOW] Immediate scroll attempt');
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 0);
        
        // 2. Force React to flush updates with multiple state changes
        setTimeout(() => {
          setIsProcessing(prev => !prev);
          setIsProcessing(prev => !prev);
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 10);
        
        // 3. Multiple staggered forced renders
        for (let delay of [50, 100, 200, 300, 500]) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            // Tiny state change to force render
            if (delay % 200 === 0) {
              setIsTypingResponse(prev => prev);
            }
          }, delay);
        }
        
        // 4. Attempt direct DOM manipulation as a fallback
        setTimeout(() => {
          // Force layout recalculation
          if (document.body) {
            document.body.getBoundingClientRect();
          }
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        
        // Final cleanup
        setIsTypingResponse(false);
        setIsProcessing(false);
      }
      
      // Handle typing indicators
      if (parsedMsg.type === 'typing_start') {
        setIsTypingResponse(true);
      } 
      else if (parsedMsg.type === 'typing_end') {
        setIsTypingResponse(false);
      }
    } 
    catch (error) {
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
      conversations: [tempConversation, ...sessionRef.current.conversations],
      streamMessageId: null
    };

    setConversations(prev => [tempConversation, ...prev]);
    
    // Request new session from server
    wsRef.current.sendMessage({ 
      type: 'new_session_start', 
      content: '',
      chatbot_id: chatbotId,
      user_id: userId
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
        const response = await chatHistoryService.getHistory(userId, 100);
        
        if (response?.data?.conversations?.length > 0) {
          const appConversations = response.data.conversations
            .filter((conv: any) => conv && conv.session_id)
            .map((conv: any) => ChatHistoryService.convertToAppConversation(conv))
            .filter(Boolean);

          if (appConversations.length > 0) {
            sessionRef.current = {
              sessionId: appConversations[0].sessionId,
              conversations: appConversations,
              streamMessageId: null
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
        sessionRef.current = { sessionId: null, conversations: [], streamMessageId: null };
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

  // Add an effect to handle immediate message display
  useEffect(() => {
    // This effect helps ensure messages are displayed immediately
    const checkForNewMessages = () => {
      // If we had a recent message (within last 500ms), force scroll update
      if (Date.now() - lastMessageTimeRef.current < 500) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    // Check every 100ms for new messages
    const interval = setInterval(checkForNewMessages, 100);
    
    return () => clearInterval(interval);
  }, []);

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
        user_id: userId,
        session_id: currentSessionId
      });
    } else {
      // No active session, create new one
      console.log('No active session, creating new conversation');
      wsRef.current.sendMessage({
        type: 'new_session_start',
        content: message.trim(),
        chatbot_id: chatbotId,
        user_id: userId
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
        conversations: [newConversation, ...sessionRef.current.conversations],
        streamMessageId: null
      };

      setConversations(prev => [newConversation, ...prev]);
      setActiveConversation(tempSessionId);
      setParentMessages([userMessage]);
    }

    setMessage('');
  };

  // Then in the useEffect
  useEffect(() => {
    // Only attach handlers once
    if (eventHandlersAttachedRef.current) return;
    
    // Handle workflow input submissions
    const handleWorkflowInputSubmitted = (event: CustomEvent) => {
      const { input, executionId, blockId, stableMessageId } = event.detail;
      
      // First, update the original input request message to mark it as submitted
      setParentMessages(prev => prev.map(msg => {
        if (msg.metadata?.isWorkflowInputRequest && 
            msg.metadata?.workflowInputConfig?.executionId === executionId &&
            msg.metadata?.workflowInputConfig?.blockId === blockId &&
            msg.id === stableMessageId
          ) {
          console.log('Input submitted, requesting state update for message:', msg.id);
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              inputSubmitted: true
            }
          };
        }
        return msg;
      }));
      
      // Then add the user's response as a message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        content: input.trim(),
        sender: 'user',
        timestamp: new Date(),
        status: 'sent',
        metadata: {
          isWorkflowInputResponse: true,
          executionId: executionId
        }
      };
      
      // Update message state with the new user message
      setParentMessages(prev => [...prev, userMessage]);
      
      const currentSessionId = sessionRef.current.sessionId || activeConversation;
      if (currentSessionId) {
        setConversations(prev => {
          const updatedConversations = prev.map(conv => {
            if (conv.sessionId === currentSessionId) {
              return {
                ...conv,
                messages: [...conv.messages, userMessage],
                lastMessage: input.trim(),
                timestamp: new Date()
              };
            }
            return conv;
          });
          
          sessionRef.current.conversations = updatedConversations;
          return updatedConversations;
        });
      }
      
      // Workflow might continue and send more messages, so let's show we're processing
      setIsProcessing(true);
    };
    
    window.addEventListener('workflow-input-submitted', handleWorkflowInputSubmitted as EventListener);
    eventHandlersAttachedRef.current = true;
    
    return () => {
      window.removeEventListener('workflow-input-submitted', handleWorkflowInputSubmitted as EventListener);
      eventHandlersAttachedRef.current = false;
    };
  }, []);

  // Debug input requests
  useEffect(() => {
    const inputRequests = currentMessages.filter(
      msg => msg.metadata?.isWorkflowInputRequest && !msg.metadata?.inputSubmitted
    );
    
    
  }, [currentMessages]);

  return (
    <div className={cn(
      "flex flex-col",
      isEmbedded ? "h-full" : "min-h-[600px]",
      "w-full h-[500px]",
      "bg-white rounded-2xl shadow-xl overflow-hidden",
      !isMaximized && "md:max-w-[800px]"
    )}>
     
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
                  "w-full px-4 py-2 text-sm font-medium text-white bg-primary -600 rounded-lg",
                  isProcessing ? "opacity-50 cursor-not-allowed" : "hover:bg-primary -700"
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
              <div className="flex-1 overflow-y-auto px-0 py-0 space-y-2">
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