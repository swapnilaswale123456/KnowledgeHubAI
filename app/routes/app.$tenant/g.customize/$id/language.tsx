import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { ChatbotQueryService } from "~/services/chatbot/ChatbotQueryService";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const chatbot = await ChatbotQueryService.getChatbot(params.id!);
  return json({ 
    chatbot,
    languages: [
      { id: 1, name: "English", code: "en" },
      { id: 2, name: "Spanish", code: "es" },
      { id: 3, name: "French", code: "fr" },
      // Add more languages as needed
    ]
  });
};

export default function LanguageTab() {
  const { chatbot, languages } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-6">Language Settings</h2>
        
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="language">Primary Language</Label>
            <Select defaultValue={chatbot.languageId?.toString()}>
              <SelectTrigger>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.id} value={lang.id.toString()}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );
} 