import { LoaderFunctionArgs, MetaFunction, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { 
  Bot, Code, FileJson, Settings, Workflow, Wrench, MessageSquare,
  Shield, AlertTriangle, MessageCircle, Plus, Pencil, Sparkles, Loader2, Save, Wand2
} from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Switch } from "~/components/ui/switch";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "react-hot-toast";

interface ComplianceConfig {
  industry: string;
  compliance_rules: Record<string, string>;
}

interface NegativeHandlingConfig {
  industry: string;
  negative_prompt_handling: Record<string, string>;
}

interface ResponseConfig {
  default_tone: string;
  error_handling: string;
  personalization: string;
}

interface ChatbotConfig {
  industry: string;
  chatbot_type: string;
  description: string;
  skills: string[];
  workflows: string[];
  sample_prompts: {
    intent: string;
    prompt: string;
    response_guidance: string;
    required_tools?: string[];
  }[];
}

// Add type for compliance data structure
interface ComplianceData {
  [industry: string]: {
    [rule: string]: string;
  };
}

interface WorkflowStep {
  step: number;
  description: string;
}

interface Workflow {
  workflow: string;
  steps: WorkflowStep[];
}

interface SkillPrompt {
  intent: string;
  prompt: string;
}

interface Skill {
  skill: string;
  description: string;
  sample_prompts: SkillPrompt[];
}

// First, add this interface for chatbot types
interface ChatbotTypeOption {
  id: string;
  name: string;
  icon: string;
  description: string;
  examples: string[];
}

// Add this component for reusability
function AiTextArea({ 
  value, 
  rows = 2,
  placeholder,
  className = "",
  onGenerate
}: { 
  value: string, 
  rows?: number,
  placeholder?: string,
  className?: string,
  onGenerate?: () => void 
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate?.();
      toast.success("Generated content successfully!");
    } catch (error) {
      toast.error("Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="relative">
      <textarea
        className={`w-full p-2 border rounded-md text-sm pr-10 ${className}`}
        defaultValue={value}
        rows={rows}
        placeholder={placeholder}
      />
      <Button
        size="sm"
        variant="ghost"
        className="absolute right-2 top-2 text-blue-600 hover:text-blue-800"
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
export const meta: MetaFunction<typeof loader> = ({ data }) => [
    { title: data?.title || "Prompt Management | KnowledgeHub AI" }
  ];

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  return json({
    title: "Prompt Management | KnowledgeHub AI",
    config: {
      industry: "healthcare",
      chatbot_type: "customer_support_bot",
      description: "Handles patient queries, appointment scheduling, and FAQs.",
      skills: ["nlp", "sentiment_analysis"],
      workflows: ["appointment_scheduling"],
      sample_prompts: [
        {
          intent: "appointment_booking",
          prompt: "Ask the user for their preferred doctor, date, and time.",
          response_guidance: "Maintain a polite and professional tone.",
          required_tools: ["calendar_api"]
        }
      ]
    },
    compliance: {
      healthcare: {
        privacy: "Mask personal health data in responses",
        hipaa: "Ensure HIPAA compliance in all interactions",
        data_retention: "Follow medical record retention policies"
      },
      finance: {
        privacy: "Mask personal financial data in responses",
        AML_KYC: "Ensure proper risk disclosure",
        regulatory: "Follow financial regulations"
      }
    } as ComplianceData,
    negative_handling: {
      healthcare: {
        self_diagnosis: "Redirect to medical professionals",
        urgent_queries: "Recommend emergency services",
        medical_advice: "Provide disclaimers"
      }
    } as ComplianceData,
    response_settings: {
      tones: ["professional", "friendly", "formal", "casual"],
      error_handling: [
        "Escalate to human support",
        "Provide alternative resource",
        "Ask for clarification"
      ]
    },
    workflows_data: {
      ecommerce_recommendation: {
        workflow: "ecommerce_recommendation",
        steps: [
          {
            step: 1,
            description: "Ask the user about their budget, product category, and key preferences."
          },
          {
            step: 2,
            description: "Retrieve product recommendations from the database."
          },
          {
            step: 3,
            description: "Display top recommended products with descriptions and links."
          }
        ]
      }
    },
    skills_data: {
      sentiment_analysis: {
        skill: "sentiment_analysis",
        description: "Analyzes user sentiment to detect positive, neutral, or negative emotions.",
        sample_prompts: [
          {
            intent: "emotion_detection",
            prompt: "Detect the sentiment of the user's message and classify it as positive, neutral, or negative."
          },
          {
            intent: "urgency_detection",
            prompt: "If sentiment is highly negative and contains keywords like 'urgent' or 'help', escalate immediately."
          }
        ]
      }
    }
  });
};

export default function PromptManagementIndex() {
  const { config, compliance, negative_handling, response_settings, workflows_data, skills_data } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState("config");
  const [jsonView, setJsonView] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleIndustryChange = (value: string) => {
    console.log('Industry changed:', value);
    // Add your industry change logic here
  };

  // Update industries data with proper typing
  const industries = [
    { 
      id: "healthcare", 
      name: "Healthcare",
      icon: "🏥",
      description: "AI-powered healthcare solutions",
      examples: ["Patient Support", "Medical Records", "Appointment Scheduling"]
    },
    { 
      id: "finance", 
      name: "Finance",
      icon: "💰",
      description: "AI-powered financial solutions",
      examples: ["Account Management", "Transaction Analysis", "Risk Assessment"]
    },
    { 
      id: "ecommerce", 
      name: "E-commerce",
      icon: "🛍️",
      description: "AI-powered shopping solutions",
      examples: ["Product Recommendations", "Cart Recovery", "Customer Support"]
    }
  ] as const;

  const chatbotTypes: ChatbotTypeOption[] = [
    {
      id: "customer_support_bot",
      name: "Customer Support",
      icon: "🎯",
      description: "AI-powered customer service automation",
      examples: ["FAQ Handling", "Issue Resolution", "Support Tickets"]
    },
    {
      id: "sales_bot",
      name: "Sales Bot",
      icon: "💼",
      description: "Automated sales and lead generation",
      examples: ["Lead Qualification", "Product Recommendations", "Sales Follow-up"]
    },
    {
      id: "appointment_bot",
      name: "Appointment Bot",
      icon: "📅",
      description: "Scheduling and booking automation",
      examples: ["Calendar Management", "Reminders", "Booking Confirmation"]
    }
  ];

  const handleChatbotTypeChange = (value: string) => {
    console.log('Chatbot type changed:', value);
    // Add your chatbot type change logic here
  };

  const handleGenerateAll = async () => {
    setIsGenerating(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Generated new configurations successfully!");
    } catch (error) {
      toast.error("Failed to generate configurations");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Changes saved successfully!");
    } catch (error) {
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text font-semibold">Configure your chatbot behavior</h1>
                    
            </div>
          <Button
            variant="outline"
            onClick={() => setJsonView(!jsonView)}
            className="flex items-center gap-2"
          >
            <FileJson className="h-4 w-4" />
            {jsonView ? "Form View" : "JSON View"}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="border-b px-6">
          <TabsList>
            <TabsTrigger value="config">
              <Settings className="h-4 w-4 mr-2" />
              Basic Config
            </TabsTrigger>
            <TabsTrigger value="compliance">
              <Shield className="h-4 w-4 mr-2" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="negative">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Negative Handling
            </TabsTrigger>
            <TabsTrigger value="response">
              <MessageCircle className="h-4 w-4 mr-2" />
              Response Settings
            </TabsTrigger>
            <TabsTrigger value="workflows">
              <Workflow className="h-4 w-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="skills">
              <Wrench className="h-4 w-4 mr-2" />
              Skills
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-6">
          {jsonView ? (
            <Card className="p-6">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto">
                {JSON.stringify(
                  activeTab === "config" ? config :
                  activeTab === "compliance" ? compliance :
                  activeTab === "negative" ? negative_handling :
                  activeTab === "response" ? response_settings :
                  activeTab === "workflows" ? workflows_data :
                  skills_data,
                  null, 2
                )}
              </pre>
            </Card>
          ) : (
            <>
              <TabsContent value="config">
                <Card className="p-6">
                  <div className="grid gap-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Industry</label>
                        <Select value={config.industry} onValueChange={handleIndustryChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {industries.map((industry) => (
                              <SelectItem key={industry.id} value={industry.id}>
                                <div className="flex items-center gap-2">
                                  <span>{industry.icon}</span>
                                  <span>{industry.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Chatbot Type</label>
                        <Select value={config.chatbot_type} onValueChange={handleChatbotTypeChange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {chatbotTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                <div className="flex items-center gap-2">
                                  <span>{type.icon}</span>
                                  <span>{type.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Description</label>
                      <AiTextArea 
                        value={config.description}
                        rows={3}
                        onGenerate={() => console.log('Generate description')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Skills</label>
                        <div className="border rounded-md p-4 space-y-2">
                          {config.skills.map((skill) => (
                            <div key={skill} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              <span className="text-sm">{skill}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Workflows</label>
                        <div className="border rounded-md p-4 space-y-2">
                          {config.workflows.map((workflow) => (
                            <div key={workflow} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              <span className="text-sm">{workflow}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="compliance">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Compliance Rules</h3>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Rule
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {Object.entries(compliance[config.industry] || {}).map(([key, value]) => (
                        <div key={key} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-blue-500" />
                              <h4 className="font-medium">{key}</h4>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                          <AiTextArea 
                            value={value}
                            onGenerate={() => console.log('Generate compliance rule for:', key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="negative">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Negative Prompt Handling</h3>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Handler
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {Object.entries(negative_handling[config.industry] || {}).map(([key, value]) => (
                        <div key={key} className="border rounded-lg p-4 bg-red-50">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <h4 className="font-medium">{key}</h4>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                          <AiTextArea 
                            value={value}
                            className="bg-white"
                            onGenerate={() => console.log('Generate negative handling for:', key)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="response">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Default Tone</label>
                      <Select defaultValue="professional">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {response_settings.tones.map((tone) => (
                            <SelectItem key={tone} value={tone}>
                              {tone.charAt(0).toUpperCase() + tone.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Error Handling</label>
                      <div className="space-y-2">
                        {response_settings.error_handling.map((handler) => (
                          <div key={handler} className="flex items-center gap-2">
                            <input type="checkbox" />
                            <span className="text-sm">{handler}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Personalization</label>
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Enable User History</span>
                          <Switch />
                        </div>
                        <AiTextArea 
                          value={response_settings.personalization}
                          onGenerate={() => console.log('Generate personalization')}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="workflows">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Workflow Steps</h3>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Workflow
                      </Button>
                    </div>
                    
                    {Object.entries(workflows_data).map(([key, workflow]) => (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium flex items-center gap-2">
                            <Workflow className="h-4 w-4 text-blue-500" />
                            {workflow.workflow}
                          </h4>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          {workflow.steps.map((step) => (
                            <div key={step.step} className="flex gap-4 items-start">
                              <div className="bg-blue-100 rounded-full w-6 h-6 flex items-center justify-center text-sm text-blue-700">
                                {step.step}
                              </div>
                              <div className="flex-1">
                                <AiTextArea 
                                  value={step.description}
                                  onGenerate={() => console.log('Generate workflow step:', step.step)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="skills">
                <Card className="p-6">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">AI Skills</h3>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Skill
                      </Button>
                    </div>
                    
                    {Object.entries(skills_data).map(([key, skill]) => (
                      <div key={key} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-medium flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-purple-500" />
                              {skill.skill}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">{skill.description}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-4">
                          <h5 className="text-sm font-medium text-gray-600">Sample Prompts</h5>
                          {skill.sample_prompts.map((prompt, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <div className="text-sm font-medium mb-2">{prompt.intent}</div>
                              <AiTextArea 
                                value={prompt.prompt}
                                onGenerate={() => console.log('Generate prompt for:', prompt.intent)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>

      <div className="border-t bg-gray-50/80 p-4 sticky bottom-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Last saved: 2 minutes ago</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleGenerateAll}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {isGenerating ? "Generating..." : "Generate All"}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <Toaster position="top-right" />
    </div>
  );
} 