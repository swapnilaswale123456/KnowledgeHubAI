import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { ChatbotQueryService } from "~/services/chatbot/ChatbotQueryService";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const chatbot = await ChatbotQueryService.getChatbot(params.id!);
  return json({ chatbot });
};

export default function MessagesTab() {
  const { chatbot } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-6">Initial Messages</h2>
        
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="welcomeMessage">Welcome Message</Label>
            <Textarea 
              id="welcomeMessage"
              placeholder="Hello! How can I assist you today?"
              value={chatbot.initialMessage || ""}
              className="min-h-[100px]"
            />
          </div>
        </div>
      </Card>
    </div>
  );
} 