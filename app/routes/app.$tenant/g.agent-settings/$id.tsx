import { json, LoaderFunction, MetaFunction } from "@remix-run/node";
import { useLoaderData, useNavigation } from "@remix-run/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "~/components/ui/tooltip";
import { Info, Bot, Zap, RefreshCcw, Loader2 } from "lucide-react";
import { ModelProviderService } from "~/services/api/ModelProviderService";
import { ChatbotService } from "~/utils/services/chatbots/chatbotService.server";
import { useState, useEffect } from "react";

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

interface ModelBasicInfo {
  model_id: string;
  id: number;
  name: string;
}

interface ModelDetailedInfo {
  context_window: number;
  max_tokens: number;
  supported_features: string[];
  description?: string;
  configurations?: Array<{
    temperature: number;
    top_p: number;
    presence_penalty: number;
    frequency_penalty: number;
    stop_sequences: string[];
  }>;
}

// Add interface for configuration state
interface ModelConfig {
  temperature: number;
  topP: number;
  presencePenalty: number;
  frequencyPenalty: number;
  stopSequences: string;
}

// Add default configuration constant
const DEFAULT_CONFIG: ModelConfig = {
  temperature: 0.7,
  topP: 1.0,
  presencePenalty: 0.0,
  frequencyPenalty: 0.0,
  stopSequences: ''
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const { id } = params;
  const chatbot = await ChatbotService.getChatbotDetails(id || "");
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
  const [selectedProvider, setSelectedProvider] = useState(defaultProvider);
  const [models, setModels] = useState<ModelBasicInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(defaultModel);
  const [modelDetails, setModelDetails] = useState<ModelDetailedInfo | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Add state for configuration
  const [config, setConfig] = useState<ModelConfig>({
    temperature: 0,
    topP: 0,
    presencePenalty: 0,
    frequencyPenalty: 0,
    stopSequences: ''
  });

  // Add handlers for configuration changes
  const handleConfigChange = (key: keyof ModelConfig, value: number | string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // Fetch models when provider changes
  const handleProviderChange = async (provider: string) => {
    setSelectedProvider(provider);
    setIsLoadingModels(true);
    try {
      const providerModels = await ModelProviderService.getProviderModels(provider);
      setModels(providerModels);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Load initial models
  useEffect(() => {
    handleProviderChange(defaultProvider);
  }, [defaultProvider]);

  // Add handler for model selection
  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId);
    setIsLoadingDetails(true);
    try {
      const details = await ModelProviderService.getModelDetails(selectedProvider, modelId);
      setModelDetails(details);
      
      // Set configuration values from model details
      if (details.configurations && details.configurations[0]) {
        const defaultConfig = details.configurations[0];
        setConfig({
          temperature: defaultConfig.temperature || 0,
          topP: defaultConfig.top_p || 0,
          presencePenalty: defaultConfig.presence_penalty || 0,
          frequencyPenalty: defaultConfig.frequency_penalty || 0,
          stopSequences: defaultConfig.stop_sequences?.join(', ') || ''
        });
      } else {
        // If no configurations, reset to defaults
        setConfig(DEFAULT_CONFIG);
      }
    } catch (error) {
      console.error('Error loading model details:', error);
      setConfig(DEFAULT_CONFIG);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Update the reset handler
  const handleReset = async () => {
    // Reset configuration values to defaults
    setConfig(DEFAULT_CONFIG);
    
    // Reset provider and model selection
    setSelectedProvider(defaultProvider);
    setSelectedModel(defaultModel);
    
    // Reset loading states
    setIsLoadingModels(false);
    setIsLoadingDetails(false);
    
    try {
      // Fetch models for default provider
      setIsLoadingModels(true);
      const providerModels = await ModelProviderService.getProviderModels(defaultProvider);
      setModels(providerModels);
      setIsLoadingModels(false);

      // Fetch details for default model
      setIsLoadingDetails(true);
      const details = await ModelProviderService.getModelDetails(defaultProvider, defaultModel);
      setModelDetails(details);
      
      // Set configuration from model details or use defaults
      if (details.configurations && details.configurations[0]) {
        const defaultModelConfig = details.configurations[0];
        setConfig({
          temperature: defaultModelConfig.temperature || DEFAULT_CONFIG.temperature,
          topP: defaultModelConfig.top_p || DEFAULT_CONFIG.topP,
          presencePenalty: defaultModelConfig.presence_penalty || DEFAULT_CONFIG.presencePenalty,
          frequencyPenalty: defaultModelConfig.frequency_penalty || DEFAULT_CONFIG.frequencyPenalty,
          stopSequences: defaultModelConfig.stop_sequences?.join(', ') || DEFAULT_CONFIG.stopSequences
        });
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      setConfig(DEFAULT_CONFIG);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Add loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded-md w-1/3"></div>
      <div className="h-4 bg-muted rounded-md w-1/4"></div>
    </div>
  );

  // Add loading state for configuration section
  const ConfigurationLoadingSkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Temperature Skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="h-4 bg-muted rounded w-24"></div>
            <div className="h-4 bg-muted rounded w-8"></div>
          </div>
          <div className="h-2 bg-muted rounded"></div>
        </div>

        {/* Top P Skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="h-4 bg-muted rounded w-24"></div>
            <div className="h-4 bg-muted rounded w-8"></div>
          </div>
          <div className="h-2 bg-muted rounded"></div>
        </div>

        {/* Presence Penalty Skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="h-4 bg-muted rounded w-32"></div>
            <div className="h-4 bg-muted rounded w-8"></div>
          </div>
          <div className="h-2 bg-muted rounded"></div>
        </div>

        {/* Frequency Penalty Skeleton */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="h-4 bg-muted rounded w-32"></div>
            <div className="h-4 bg-muted rounded w-8"></div>
          </div>
          <div className="h-2 bg-muted rounded"></div>
        </div>
      </div>

      {/* Stop Sequences Skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="h-4 bg-muted rounded w-28"></div>
        </div>
        <div className="h-10 bg-muted rounded"></div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="h-full flex-1 overflow-y-auto">
        {navigation.state === "loading" ? (
          <div className="container py-6 space-y-6">
            <LoadingSkeleton />
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <LoadingSkeleton />
                </CardHeader>
                <CardContent className="space-y-4">
                  <LoadingSkeleton />
                  <LoadingSkeleton />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <LoadingSkeleton />
                </CardHeader>
                <CardContent>
                  <LoadingSkeleton />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="container py-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl font-bold">{chatbot.name} Settings</h1>
                <p className="text-muted-foreground">Configure your AI Agent Assistant settings</p>
              </div>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={handleReset}
                disabled={isLoadingDetails || isLoadingModels || isSubmitting}
              >
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
                    <Select 
                      value={selectedProvider}
                      onValueChange={handleProviderChange}
                    >
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
                    <Select 
                      value={selectedModel} 
                      onValueChange={handleModelChange}
                      disabled={isLoadingModels}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingModels ? "Loading models..." : "Select model"} />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((model) => (
                          <SelectItem key={model.id} value={model.model_id}>
                            <div className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              {model.name}
                            </div>
                          </SelectItem>
                        ))}
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
                  {isLoadingDetails ? (
                    <div className="flex items-center justify-center h-24">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : modelDetails ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Context Window</label>
                          <p className="text-2xl font-bold">{modelDetails.context_window.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-sm font-medium">Max Tokens</label>
                          <p className="text-2xl font-bold">{modelDetails.max_tokens.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Supported Features</label>
                        <div className="flex gap-2">
                          {modelDetails.supported_features.map((feature) => (
                            <span key={feature} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      {modelDetails.description && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Description</label>
                          <p className="text-sm text-muted-foreground">{modelDetails.description}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      Select a model to view details
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Configuration Settings */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Model Configuration</CardTitle>
                  <CardDescription>Adjust the model's behavior parameters</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDetails ? (
                    <ConfigurationLoadingSkeleton />
                  ) : (
                    <div className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Temperature */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Temperature</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{config.temperature}</span>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Controls randomness: Lower values make the model more focused and deterministic
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                          <Slider 
                            value={[config.temperature]} 
                            onValueChange={([value]) => handleConfigChange('temperature', value)} 
                            min={0.0}
                            max={2.0}
                            step={0.1} 
                          />
                        </div>

                        {/* Top P */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Top P</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{config.topP}</span>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Controls diversity via nucleus sampling
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                          <Slider 
                            value={[config.topP]} 
                            onValueChange={([value]) => handleConfigChange('topP', value)} 
                            min={0.0}
                            max={1.0}
                            step={0.05}
                          />
                        </div>

                        {/* Presence Penalty */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Presence Penalty</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{config.presencePenalty}</span>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Adjusts likelihood of the model discussing new topics
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                          <Slider 
                            value={[config.presencePenalty]} 
                            onValueChange={([value]) => handleConfigChange('presencePenalty', value)} 
                            min={-2.0}
                            max={2.0}
                            step={0.1} 
                          />
                        </div>

                        {/* Frequency Penalty */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Frequency Penalty</label>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{config.frequencyPenalty}</span>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  Adjusts likelihood of the model repeating information
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                          <Slider 
                            value={[config.frequencyPenalty]} 
                            onValueChange={([value]) => handleConfigChange('frequencyPenalty', value)} 
                            min={-2.0}
                            max={2.0}
                            step={0.1} 
                          />
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
                        <Input 
                          placeholder="Enter stop sequences (comma-separated)" 
                          value={config.stopSequences}
                          onChange={(e) => handleConfigChange('stopSequences', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Update Save Button with loading state */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
              <Button className="gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

       
      </div>
    </TooltipProvider>
  );
}

// Add error boundary
export function ErrorBoundary() {
  return (
    <div className="container py-6">
      <div className="rounded-lg border border-destructive/50 p-6 space-y-2">
        <h2 className="text-lg font-semibold text-destructive">Error Loading Settings</h2>
        <p className="text-muted-foreground">
          There was a problem loading the agent settings. Please try again later.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    </div>
  );
}