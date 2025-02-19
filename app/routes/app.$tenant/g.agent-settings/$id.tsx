import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "~/components/ui/tooltip";
import { Info, Bot, Zap, RefreshCcw } from "lucide-react";
import { ModelProviderService } from "~/services/api/ModelProviderService";
import { ChatbotService } from "~/utils/services/chatbots/chatbotService.server";

interface LoaderData {
  providers: string[];
  defaultProvider: string;
  defaultModel: string;
  chatbot: {
    id: string;
    name: string;
  };
  title: string;
}

export const loader: LoaderFunction = async ({ request, params }) => {
  const { id } = params;
  const chatbot = await ChatbotService.getChatbotDetails(id);
  const providers = await ModelProviderService.getProviders();
  
  return json<LoaderData>({
    providers,
    defaultProvider: "Groq",
    defaultModel: "llama3-70b-8192",
    chatbot: {
      id: id || "",
      name: chatbot?.name || "Agent"
    },
    title: "Agent Settings"
  });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data?.title || "Agent Settings" }
];

export default function AgentSettingsDetail() {
  const { providers, defaultProvider, defaultModel, chatbot } = useLoaderData<typeof loader>();

  return (
    <TooltipProvider>
      <div className="h-full flex-1 overflow-y-auto">
        <div className="container py-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">{chatbot.name} Settings</h1>
              <p className="text-muted-foreground">Configure your AI Agent Assistant settings</p>
            </div>
            <Button variant="outline" className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Provider & Model Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Model Selection</CardTitle>
                <CardDescription>Choose your AI model provider and type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Provider</label>
                  <Select defaultValue={defaultProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider: string) => (
                        <SelectItem key={provider} value={provider}>
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4" />
                            {provider}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Model</label>
                  <Select defaultValue={defaultModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="llama3-70b-8192">Llama3 70B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Model Details */}
            <Card>
              <CardHeader>
                <CardTitle>Model Details</CardTitle>
                <CardDescription>Current model specifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Context Window</label>
                    <p className="text-2xl font-bold">4,096</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Max Tokens</label>
                    <p className="text-2xl font-bold">4,096</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Supported Features</label>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">Text</span>
                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">Chat</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuration Settings */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Model Configuration</CardTitle>
                <CardDescription>Adjust the model's behavior parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Temperature */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Temperature</label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Controls randomness: Lower values make the model more focused and deterministic
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Slider defaultValue={[0.7]} max={1} step={0.1} />
                  </div>

                  {/* Top P */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Top P</label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Controls diversity via nucleus sampling
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Slider defaultValue={[1]} max={1} step={0.1} />
                  </div>

                  {/* Presence Penalty */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Presence Penalty</label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Adjusts likelihood of the model discussing new topics
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Slider defaultValue={[0]} max={2} step={0.1} />
                  </div>

                  {/* Frequency Penalty */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Frequency Penalty</label>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Adjusts likelihood of the model repeating information
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Slider defaultValue={[0]} max={2} step={0.1} />
                  </div>
                </div>

                {/* Stop Sequences */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Stop Sequences</label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Sequences where the model will stop generating further tokens
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Input placeholder="Enter stop sequences (comma-separated)" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline">Cancel</Button>
            <Button className="gap-2">
              <Zap className="h-4 w-4" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}