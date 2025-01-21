import { json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { useParams, useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { requireAuth } from "~/utils/loaders.middleware";
import { MessageSquare, Code, Upload, Settings } from "lucide-react";
import { cn } from "~/lib/utils";
import { ChatInterface } from "~/components/chat/ChatInterface";
import { QuickStartGuide } from "~/components/chat/QuickStartGuide";
import { Message, ChatSettings, ChatContext } from "~/types/chat";
import { ChatbotService } from "~/utils/services/chatbots/chatbotService.server";
import { useChatbot } from "~/context/ChatbotContext";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireAuth({ request, params });
  
  const chatbotId = params.id;
  if (!chatbotId) {
    return redirect(`/app/${params.tenant}/dashboard`);
  }

  const chatbot = await ChatbotService.getChatbotDetails(chatbotId);
  if (!chatbot) {
    throw new Response("Chatbot not found", { status: 404 });
  }

  return json({ chatbot });
}

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

export default function ChatbotDetailRoute() {
  const params = useParams();
  const { chatbot } = useLoaderData<typeof loader>();
  const { selectedChatbot, setSelectedChatbot } = useChatbot();
  const [showGuide, setShowGuide] = useState(true);
  const [message, setMessage] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hi! I am KnowledgeAI, Ask me about anything!',
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
      link: `/app/${params.tenant}/dashboard/file`
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
      link: `/app/${params.tenant}/settings`
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

  // Set selected chatbot if accessing the page directly
  useEffect(() => {
    if (!selectedChatbot || selectedChatbot.id !== chatbot.id) {
      setSelectedChatbot(chatbot);
    }
  }, [chatbot, selectedChatbot, setSelectedChatbot]);

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
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{chatbot.name}</h1>
      </div>
      <div className="flex flex-1 h-full w-full p-6 bg-gray-100">
        <div className={cn(
          "flex bg-white rounded-lg border transition-all duration-200 overflow-hidden w-full h-full",
          isMaximized 
            ? "w-full h-full"
            : "max-w-[1000px] max-h-[700px] mx-auto"
        )}>
          <ChatInterface 
            message={message}
            isMaximized={isMaximized}
            messages={messages}
            settings={settings}
            isTyping={isTyping}
            onMessageChange={(e) => setMessage(e.target.value)}
            onSendMessage={handleSendMessage}
            onToggleMaximize={() => setIsMaximized(!isMaximized)}
            onFileUpload={handleFileUpload}
            onVoiceRecord={handleVoiceRecord}
            onEmojiSelect={handleEmojiSelect}
          />

          {showGuide && (
            <QuickStartGuide 
              steps={steps}
              onClose={() => setShowGuide(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
