import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
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
import { useState, useEffect } from "react";
import { HelpCircle, Undo2, Sun, Moon } from "lucide-react";
import { ChatInterface } from "~/components/chat/ChatInterface";
import type { Message, ChatSettings } from "~/types/chat";
import { toast } from "sonner";
import { THEME_COLORS } from "~/utils/theme/constants";

interface ThemeSettings {
  headerColor: string;
  botMessageColor: string;
  userMessageColor: string;
  enabled: {
    headerColor: boolean;
    botMessageColor: boolean;
    userMessageColor: boolean;
  };
}

interface LoaderData {
  chatbot: {
    id: string;
    theme: Partial<ThemeSettings>;
  };
  theme: ThemeSettings;
}

interface ActionData {
  success: boolean;
  error?: string;
}

// Default theme settings using THEME_COLORS
const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  headerColor: THEME_COLORS.light.header,
  botMessageColor: THEME_COLORS.light.messages.bot.text,
  userMessageColor: THEME_COLORS.light.messages.user.text,
  enabled: {
    headerColor: true,
    botMessageColor: true,
    userMessageColor: true
  }
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const chatbot = await ChatbotQueryService.getChatbot(params.id!);
  
  // Parse theme from chatbot or use default
  const savedTheme = typeof chatbot?.theme === 'string' 
    ? JSON.parse(chatbot.theme) 
    : chatbot?.theme;

  const theme = {
    ...DEFAULT_THEME_SETTINGS,
    ...savedTheme
  };

  return json({ chatbot, theme });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const theme = JSON.parse(formData.get("theme") as string);
  
  try {
    await ChatbotQueryService.updateChatbot(params.id!, {
      theme: {
        headerColor: theme.headerColor,
        botMessageColor: theme.botMessageColor,
        userMessageColor: theme.userMessageColor,
        enabled: theme.enabled
      }
    });
    return json({ success: true });
  } catch (error) {
    return json({ success: false, error: "Failed to save changes" }, { status: 400 });
  }
};

export default function AppearanceTab() {
  const { chatbot, theme } = useLoaderData<LoaderData>();
  const fetcher = useFetcher<ActionData>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Initialize with saved theme or defaults
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    ...DEFAULT_THEME_SETTINGS,
    ...theme
  });

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {      
        toast("Theme settings saved successfully", {
          description: "Your changes have been applied",
        });
      } else {
        toast("Failed to save changes", {
          description: fetcher.data.error || "Please try again"         
        });
      }
    }
  }, [fetcher.state, fetcher.data]);

  const handleColorChange = (key: keyof Omit<ThemeSettings, 'enabled'>, value: string) => {
    setThemeSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleToggleEnable = (key: keyof ThemeSettings['enabled']) => {
    setThemeSettings(prev => ({
      ...prev,
      enabled: {
        ...prev.enabled,
        [key]: !prev.enabled[key]
      }
    }));
  };

  const resetColors = () => {
    const currentTheme = isDarkMode ? THEME_COLORS.dark : THEME_COLORS.light;
    setThemeSettings({
      headerColor: currentTheme.header,
      botMessageColor: currentTheme.messages.bot.text,
      userMessageColor: currentTheme.messages.user.text,
      enabled: DEFAULT_THEME_SETTINGS.enabled
    });
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    const currentTheme = !isDarkMode ? THEME_COLORS.dark : THEME_COLORS.light;
    setThemeSettings(prev => ({
      headerColor: currentTheme.header,
      botMessageColor: currentTheme.messages.bot.text,
      userMessageColor: currentTheme.messages.user.text,
      enabled: prev.enabled
    }));
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

  // Get the final theme settings for preview
  const getPreviewSettings = (): ChatSettings => {
    const currentTheme = isDarkMode ? THEME_COLORS.dark : THEME_COLORS.light;
    return {
      theme: {
        headerColor: themeSettings.enabled.headerColor ? themeSettings.headerColor : currentTheme.header,
        botMessageColor: themeSettings.enabled.botMessageColor ? themeSettings.botMessageColor : currentTheme.messages.bot.text,
        userMessageColor: themeSettings.enabled.userMessageColor ? themeSettings.userMessageColor : currentTheme.messages.user.text
      },
      fontSize: 'medium',
      messageAlignment: 'left',
      soundEnabled: false
    };
  };

  // Generate settings JSON for saving
  const getSettingsJson = () => {
    const settings = {
      theme: {
        ...Object.fromEntries(
          Object.entries(themeSettings)
            .filter(([key]) => key !== 'enabled')
            .map(([key, value]) => [
              key,
              themeSettings.enabled[key as keyof ThemeSettings['enabled']] ? value : null
            ])
        ),
        enabled: themeSettings.enabled
      }
    };
    return settings;
  };

  const handleSaveChanges = () => {
    const settings = getSettingsJson();
    fetcher.submit(
      { theme: JSON.stringify(settings.theme) },
      { method: "POST" }
    );
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
                    <Switch 
                      checked={themeSettings.enabled.headerColor}
                      onCheckedChange={() => handleToggleEnable('headerColor')}
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Input 
                        type="color" 
                        id="headerColor"
                        value={themeSettings.headerColor}
                        onChange={(e) => handleColorChange('headerColor', e.target.value)}
                        disabled={!themeSettings.enabled.headerColor}
                        className="w-12 h-10 p-1 cursor-pointer border rounded-md focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <Input 
                      type="text" 
                      value={themeSettings.headerColor.toUpperCase()}
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
                    <Switch 
                      checked={themeSettings.enabled.botMessageColor}
                      onCheckedChange={() => handleToggleEnable('botMessageColor')}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      id="botMessageColor"
                      value={themeSettings.botMessageColor}
                      onChange={(e) => handleColorChange('botMessageColor', e.target.value)}
                      disabled={!themeSettings.enabled.botMessageColor}
                      className="w-12 h-10 p-1 cursor-pointer border rounded-md focus:ring-2 focus:ring-primary"
                    />
                    <Input 
                      type="text" 
                      value={themeSettings.botMessageColor.toUpperCase()}
                      onChange={(e) => handleColorChange('botMessageColor', e.target.value)}
                      className="flex-1 font-mono"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* User Message Color */}
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="userMessageColor">User Message Color</Label>
                    <Switch 
                      checked={themeSettings.enabled.userMessageColor}
                      onCheckedChange={() => handleToggleEnable('userMessageColor')}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      id="userMessageColor"
                      value={themeSettings.userMessageColor}
                      onChange={(e) => handleColorChange('userMessageColor', e.target.value)}
                      disabled={!themeSettings.enabled.userMessageColor}
                      className="w-12 h-10 p-1 cursor-pointer border rounded-md focus:ring-2 focus:ring-primary"
                    />
                    <Input 
                      type="text" 
                      value={themeSettings.userMessageColor.toUpperCase()}
                      onChange={(e) => handleColorChange('userMessageColor', e.target.value)}
                      className="flex-1 font-mono"
                      placeholder="#000000"
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
                    onClick={handleSaveChanges}
                    disabled={fetcher.state !== "idle"}
                >
                    {fetcher.state !== "idle" ? (
                        <>
                            <span className="animate-spin mr-2">⏳</span>
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
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
                settings={getPreviewSettings()}
                isTyping={false}
                isMaximized={false}
                onToggleMaximize={() => {}}
                setMessages={() => {}}
                showConversations={false}
              />
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
