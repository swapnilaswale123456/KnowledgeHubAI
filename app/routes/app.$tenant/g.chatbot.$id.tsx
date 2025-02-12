import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useParams } from "@remix-run/react";
import { useState, useEffect } from "react";
import { requireAuth } from "~/utils/loaders.middleware";
import { MessageSquare, Code, Upload, Settings } from "lucide-react";
import { cn } from "~/lib/utils";
import { ChatInterface } from "~/components/chat/ChatInterface";
import { QuickStartGuide } from "~/components/chat/QuickStartGuide";
import { Message, ChatSettings, ChatContext } from "~/types/chat";
import { WebSocketService } from '~/utils/services/websocket/WebSocketService';
import { ChatbotService } from "~/utils/services/chatbots/chatbotService.server";
import { useLoaderData } from "@remix-run/react";
import { useChatbot } from "~/contexts/ChatbotContext";
import type { MetaFunction } from "@remix-run/node";
import { THEME_COLORS } from "~/utils/theme/constants";
import { setSelectedChatbot, commitSession } from "~/utils/session.server";

type LoaderData = {
  chatbot: {
    id: string;
    name: string;
    theme: any;
    initialMessage?: string;
    // ... other chatbot properties
  };
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const chatbotId = params.id;
  
  if (!chatbotId) {
    return redirect(`/app/${params.tenant}/dashboard`);
  }

  // Get chatbot details
  const chatbot = await ChatbotService.getChatbotDetails(chatbotId);
  
  if (!chatbot) {
    throw new Response("Chatbot not found", { status: 404 });
  }

  // Parse theme if it's a string
  const theme = typeof chatbot.theme === 'string' 
    ? JSON.parse(chatbot.theme) 
    : chatbot.theme;

  const session = await setSelectedChatbot(request, chatbotId);
  
  return json(
    { 
      chatbot: {
        ...chatbot,
        theme
      }
    },
    {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    }
  );
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data?.chatbot?.name || "Chatbot | KnowledgeHub AI" }
];

interface QuickStartStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  action: string;
  icon: React.ReactNode;
  link: string;
}

const DEFAULT_SETTINGS: ChatSettings = {
  theme: {
    headerColor: THEME_COLORS.light.header,
    botMessageColor: THEME_COLORS.light.messages.bot.text,
    userMessageColor: THEME_COLORS.light.messages.user.text
  },
  fontSize: 'medium',
  messageAlignment: 'left',
  soundEnabled: true
};

export default function ChatbotRoute() {
  const { selectedChatbotId, setSelectedChatbotId } = useChatbot();
  const params = useParams();
  const { chatbot } = useLoaderData<LoaderData>();
  const [showGuide, setShowGuide] = useState(true);
  const [message, setMessage] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: chatbot.initialMessage || "Hello! How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
      status: "sent"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [settings] = useState<ChatSettings>({
    ...DEFAULT_SETTINGS,
    theme: chatbot.theme ? {
      headerColor: chatbot.theme.headerColor || THEME_COLORS.light.header,
      botMessageColor: chatbot.theme.botMessageColor || THEME_COLORS.light.messages.bot.text,
      userMessageColor: chatbot.theme.userMessageColor || THEME_COLORS.light.messages.user.text
    } : DEFAULT_SETTINGS.theme
  });
  const [chatContext, setChatContext] = useState<ChatContext>({
    conversationId: crypto.randomUUID(),
    previousMessages: [],
    userPreferences: {
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });
  const [steps] = useState<QuickStartStep[]>([
    {
      id: 1,
      title: "Train AI with your content",
      description: "Upload and train your AI chatbot with your content.",
      isCompleted: false,
      action: "Train AI",
      icon: <Upload className="h-4 w-4" />,
      link: `/app/${params.tenant}/g/data-sources/overview`
    },
    {
      id: 2,
      title: "Send the first message",
      description: "Test your AI chatbot with relevant questions.",
      isCompleted: false,
      action: "Send message",
      icon: <MessageSquare className="h-4 w-4" />,
      link: "#chat"
    },
    {
      id: 3,
      title: "Customize AI Chatbot",
      description: "Configure your chatbot's appearance and behavior.",
      isCompleted: false,
      action: "Customize",
      icon: <Settings className="h-4 w-4" />,
      link: `/app/${params.tenant}/g/customize/${params.id}`
    },
    {
      id: 4,
      title: "Embed & Integrate",
      description: "Add the chatbot to your website or platform.",
      isCompleted: false,
      action: "Get Code",
      icon: <Code className="h-4 w-4" />,
      link: `/app/${params.tenant}/settings/embed`
    }
  ]);
  const [ws, setWs] = useState<WebSocketService | null>(null);
  const [connected, setConnected] = useState(false);

  // Update selected chatbot when route changes
  useEffect(() => {
    if (params.id) {
      setSelectedChatbotId(params.id);
    }
  }, [params.id, setSelectedChatbotId]);

  useEffect(() => {
    if (!params.id) return;

    const wsService = new WebSocketService(params.id);
    
    wsService.addMessageHandler((data) => {
      if (data.type === 'typing') {
        setIsTyping(data.isTyping);
      } else if (data.type === 'message') {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          content: data.content,
          sender: 'bot',
          timestamp: new Date(),
          status: 'sent'
        }]);
      }
    });

    wsService.connect();
    setWs(wsService);

    return () => {
      wsService.disconnect();
    };
  }, [params.id]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      content: message,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending' as const
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setIsTyping(true);

    try {
      // Replace with your actual API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.content,
          conversationId: chatContext.conversationId,
          previousMessages: messages.slice(-5) // Send last 5 messages for context
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        content: data.message,
        sender: 'bot',
        timestamp: new Date(),
        status: 'sent' as const
      }]);
      
    } catch (error) {
      setMessages(prev => 
        prev.map(m => m.id === newMessage.id ? { ...m, status: 'error' } : m)
      );
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        content: `File uploaded: ${file.name}`,
        sender: 'user',
        timestamp: new Date(),
        status: 'sent' as const,
        type: 'file',
        fileUrl: data.url,
        fileName: file.name
      }]);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleVoiceRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Implement voice recording logic
    } catch (error) {
      console.error('Voice record error:', error);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
  };

  return (
    <div className="flex flex-1 h-full w-full p-6 bg-gray-100">
      <div className={cn(
        "flex bg-white rounded-lg border transition-all duration-200 overflow-hidden w-full h-full",
        isMaximized ? "w-full h-full" : "max-w-[1000px] max-h-[700px] mx-auto"
      )}>
        <ChatInterface 
          chatbotId={chatbot.id}
          currentMessage={message}
          isMaximized={isMaximized}
          messages={messages}
          settings={settings}
          isTyping={isTyping}
          onMessageChange={handleMessageChange}
          onSendMessage={handleSendMessage}
          onToggleMaximize={() => setIsMaximized(!isMaximized)}
          onFileUpload={handleFileUpload}
          onVoiceRecord={handleVoiceRecord}
          onEmojiSelect={handleEmojiSelect}
          setMessages={setMessages}
          showConversations={true}
        />

        {showGuide && (
          <QuickStartGuide 
            steps={steps}
            onClose={() => setShowGuide(false)}
          />
        )}
      </div>
    </div>
  );
}
