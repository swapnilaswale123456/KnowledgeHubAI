import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ChatbotService } from "~/utils/services/chatbots/chatbotService.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const { uniqueUrl } = params;
  
  const chatbot = await ChatbotService.getChatbotByUrl(uniqueUrl!);
  if (!chatbot) {
    throw new Response("Chatbot not found", { status: 404 });
  }

  return json({ chatbot });
}

export default function ChatInterface() {
  const { chatbot } = useLoaderData<typeof loader>();
  
  return (
    <div className="flex flex-col h-screen" style={chatbot.theme}>
      <div className="flex-1 p-4 overflow-y-auto">
        {/* Chat messages will go here */}
      </div>
      <div className="p-4 border-t">
        <input 
          type="text"
          className="w-full p-2 border rounded"
          placeholder="Type your message..."
        />
      </div>
    </div>
  );
} 