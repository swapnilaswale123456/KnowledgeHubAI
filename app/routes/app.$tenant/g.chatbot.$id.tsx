import { json, LoaderFunctionArgs } from "@remix-run/node";
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
import { useChatbot } from "~/context/ChatbotContext";
import type { MetaFunction } from "@remix-run/node";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  
  // Load chatbot details
  const chatbot = await ChatbotService.getChatbots(params.id!);
  if (!chatbot) {
    throw new Response("Chatbot not found", { status: 404 });
  }

  return json({ 
    chatbot,
    title: "Chatbot | KnowledgeHub AI"
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data?.title || "Chatbot | KnowledgeHub AI" }
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
  theme: 'light',
  fontSize: 'medium',
  messageAlignment: 'left',
  soundEnabled: true
};

export default function ChatbotRoute() {
  const { selectedChatbotId, setSelectedChatbotId } = useChatbot();
  const params = useParams();
  const { chatbot } = useLoaderData<typeof loader>();
  const [showGuide, setShowGuide] = useState(true);
  const [message, setMessage] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: chatbot.initialMessage || 'Hi! I am KnowledgeAI, Ask me about anything!',
      sender: 'bot',
      timestamp: new Date(),
      status: 'sent' as const
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [settings] = useState<ChatSettings>(DEFAULT_SETTINGS);
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
          chatbotId={params.id!}
          message={message}
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
