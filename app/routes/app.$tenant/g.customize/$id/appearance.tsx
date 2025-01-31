import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger,
  TooltipProvider 
} from "~/components/ui/tooltip";
import { ChatbotQueryService } from "~/services/chatbot/ChatbotQueryService";
import { useState } from "react";
import { HelpCircle, Undo2, Sun, Moon } from "lucide-react";
import { ChatInterface } from "~/components/chat/ChatInterface";
import type { Message, ChatSettings } from "~/types/chat";

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

const defaultThemes = {
  light: {
    headerColor: "#4F46E5",
    botMessageColor: "#F3F4F6",
    userMessageColor: "#EEF2FF"
  },
  dark: {
    headerColor: "#1F2937",
    botMessageColor: "#374151",
    userMessageColor: "#4B5563"
  }
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const chatbot = await ChatbotQueryService.getChatbot(params.id!);
  return json({ chatbot });
};

export default function AppearanceTab() {
  const { chatbot } = useLoaderData<LoaderData>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [colors, setColors] = useState({
    headerColor: chatbot.theme?.headerColor || defaultThemes.light.headerColor,
    botMessageColor: chatbot.theme?.botMessageColor || defaultThemes.light.botMessageColor,
    userMessageColor: chatbot.theme?.userMessageColor || defaultThemes.light.userMessageColor
  });

  const handleColorChange = (key: string, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const resetColors = () => {
    const theme = isDarkMode ? defaultThemes.dark : defaultThemes.light;
    setColors(theme);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    const theme = !isDarkMode ? defaultThemes.dark : defaultThemes.light;
    setColors(theme);
  };

  // Sample messages for preview
  const previewMessages: Message[] = [
    {
      id: '1',
      content: "Hello! How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
      status: 'sent'
    },
    {
      id: '2',
      content: "I have a question about your services.",
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    }
  ];

  // Preview settings
  const previewSettings: ChatSettings = {
    theme: {
      headerColor: colors.headerColor,
      botMessageColor: colors.botMessageColor,
      userMessageColor: colors.userMessageColor
    },
    fontSize: 'medium'
  };

  return (
    <TooltipProvider>
      <div className="p-6">
        <div className="grid grid-cols-[1.2fr,380px] gap-6">
          {/* Left Column - Settings */}
          <div className="space-y-6">
            {/* Theme Controls */}
            <div className="flex justify-between items-center">
            <h1 className="text-base font-semibold">Chat Appearance</h1>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetColors}
                  className="flex items-center gap-2 text-xs"
                >
                  <Undo2 className="h-3 w-3" />
                  Reset to Default
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="flex items-center gap-2 text-xs"
                >
                  {isDarkMode ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                  {isDarkMode ? "Light Mode" : "Dark Mode"}
                </Button>
              </div>
            </div>

            {/* Header Section */}
            <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Header Settings</h2>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Customize the header appearance of your chat widget</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="headerColor">Header Color</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Input 
                        type="color" 
                        id="headerColor"
                        value={colors.headerColor}
                        onChange={(e) => handleColorChange('headerColor', e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer border rounded-md focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <Input 
                      type="text" 
                      value={colors.headerColor.toUpperCase()}
                      onChange={(e) => handleColorChange('headerColor', e.target.value)}
                      className="flex-1 font-mono"
                      placeholder="#4F46E5"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Messages Section */}
            <Card className="p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">Message Colors</h2>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Customize the appearance of bot and user messages</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-6">
                {/* Bot Message Color */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="botMessageColor">Bot Message Color</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      id="botMessageColor"
                      value={colors.botMessageColor}
                      onChange={(e) => handleColorChange('botMessageColor', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer border rounded-md focus:ring-2 focus:ring-primary"
                    />
                    <Input 
                      type="text" 
                      value={colors.botMessageColor.toUpperCase()}
                      onChange={(e) => handleColorChange('botMessageColor', e.target.value)}
                      className="flex-1 font-mono"
                      placeholder="#F3F4F6"
                    />
                  </div>
                </div>

                {/* User Message Color */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="userMessageColor">User Message Color</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      id="userMessageColor"
                      value={colors.userMessageColor}
                      onChange={(e) => handleColorChange('userMessageColor', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer border rounded-md focus:ring-2 focus:ring-primary"
                    />
                    <Input 
                      type="text" 
                      value={colors.userMessageColor.toUpperCase()}
                      onChange={(e) => handleColorChange('userMessageColor', e.target.value)}
                      className="flex-1 font-mono"
                      placeholder="#EEF2FF"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Save Changes Button - Moved to bottom */}
            <div className="pt-4 flex justify-center">
                <Button 
                    variant="default" 
                    size="sm"
                    className="text-xs"
                >
                    Save Changes
                </Button>
            </div>

          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4 sticky top-6">
            <h2 className="text-base font-semibold text-center">Preview</h2>
            <div className="scale-90 origin-top">
              <ChatInterface 
                chatbotId={chatbot.id}
                messages={previewMessages}
                settings={previewSettings}
                isTyping={false}
                isMaximized={false}
                onToggleMaximize={() => {}}
                setMessages={() => {}}
              />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
