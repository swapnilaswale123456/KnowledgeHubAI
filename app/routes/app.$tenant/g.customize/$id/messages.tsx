import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { ChatbotService } from "~/utils/services/chatbots/chatbotService.server";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ChatbotQueryService } from "~/services/chatbot/ChatbotQueryService";

interface ActionData {
  success: boolean;
  error?: string;
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const chatbot = await ChatbotService.getChatbotDetails(params.id!);
  return json({ chatbot });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const initialMessage = formData.get("initialMessage") as string;
  
  try {
    await ChatbotQueryService.updateChatbot(params.id!, {
      initialMessage: initialMessage
    });
    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: "Failed to save message" }, { status: 400 });
  }
};

export default function MessagesTab() {
  const { chatbot } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<ActionData>();
  const [message, setMessage] = useState(chatbot?.initialMessage || "");

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast("Welcome message saved", {
          description: "Your changes have been applied"
        });
      } else {
        toast("Failed to save message", {
          description: fetcher.data.error || "Please try again"
        });
      }
    }
  }, [fetcher.state, fetcher.data]);

  const handleSave = () => {
    fetcher.submit(
      { initialMessage: message },
      { method: "POST" }
    );
  };

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
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={fetcher.state !== "idle"}
            >
              {fetcher.state !== "idle" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
} 