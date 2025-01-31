import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { ChatbotQueryService } from "~/services/chatbot/ChatbotQueryService";

interface LoaderData {
  chatbot: {
    id: string;
    theme: {
      headerColor?: string;
      botMessageColor?: string;
      userMessageColor?: string;
    };
  };
}

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const chatbot = await ChatbotQueryService.getChatbot(params.id!);
  return json({ chatbot });
};

export default function AppearanceTab() {
  const { chatbot } = useLoaderData<LoaderData>();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-6">Chat Interface Colors</h2>
        
        <div className="space-y-6">
          {/* Header Color */}
          <div className="grid gap-2">
            <Label htmlFor="headerColor">Header Color</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                id="headerColor"
                value={chatbot.theme?.headerColor || "#4F46E5"}
                className="w-12 h-10 p-1"
              />
              <Input 
                type="text" 
                value={chatbot.theme?.headerColor || "#4F46E5"}
                className="flex-1"
                placeholder="#4F46E5"
              />
            </div>
          </div>

          {/* Bot Message Color */}
          <div className="grid gap-2">
            <Label htmlFor="botMessageColor">Bot Message Color</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                id="botMessageColor"
                value={chatbot.theme?.botMessageColor || "#F3F4F6"}
                className="w-12 h-10 p-1"
              />
              <Input 
                type="text" 
                value={chatbot.theme?.botMessageColor || "#F3F4F6"}
                className="flex-1"
                placeholder="#F3F4F6"
              />
            </div>
          </div>

          {/* User Message Color */}
          <div className="grid gap-2">
            <Label htmlFor="userMessageColor">User Message Color</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                id="userMessageColor"
                value={chatbot.theme?.userMessageColor || "#EEF2FF"}
                className="w-12 h-10 p-1"
              />
              <Input 
                type="text" 
                value={chatbot.theme?.userMessageColor || "#EEF2FF"}
                className="flex-1"
                placeholder="#EEF2FF"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-8 border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-4">Preview</h3>
            <div 
              className="rounded-t-lg p-3"
              style={{ backgroundColor: chatbot.theme?.headerColor || "#4F46E5" }}
            >
              <p className="text-white">Chat Header</p>
            </div>
            <div className="p-4 space-y-4">
              <div 
                className="rounded-lg p-3 max-w-[80%]"
                style={{ backgroundColor: chatbot.theme?.botMessageColor || "#F3F4F6" }}
              >
                Hello! How can I help you today?
              </div>
              <div 
                className="rounded-lg p-3 max-w-[80%] ml-auto"
                style={{ backgroundColor: chatbot.theme?.userMessageColor || "#EEF2FF" }}
              >
                I have a question about your services.
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
