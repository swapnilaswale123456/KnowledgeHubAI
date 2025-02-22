import { json, LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ChatInterface } from "~/components/chat/ChatInterface";
import { ChatbotQueryService } from "~/services/chatbot/ChatbotQueryService";

interface LoaderData {
  chatbot: {
    id: string;
    name: string;
    theme: any;
  };
}

export const loader: LoaderFunction = async ({ params }) => {
  const { uniqueUrl } = params;
  const chatbot = await ChatbotQueryService.getChatbotByUniqueUrl(uniqueUrl!);
  
  if (!chatbot) {
    throw new Response("Chatbot not found", { status: 404 });
  }

  return json({
    chatbot: {
      id: chatbot.id,
      name: chatbot.name,
      theme: chatbot.theme
    }
  });
};

export default function EmbeddedChat() {
  const { chatbot } = useLoaderData<LoaderData>();
  
  return (
    <div className="h-screen">
      <ChatInterface 
        chatbotId={chatbot.id}
        theme={chatbot.theme}
        embedded={true}
      />
    </div>
  );
} 