import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Bot, ArrowRight } from "lucide-react";
import { Progress } from "~/components/ui/progress";

const WORKFLOW_STEPS = [
  { id: 1, title: "Select Skills", description: "Define your chatbot's capabilities" },
  { id: 2, title: "Generate Workflow", description: "AI-powered workflow creation" },
  { id: 3, title: "Connect APIs", description: "Set up integrations" },
  { id: 4, title: "Review & Launch", description: "Final configuration and deployment" }
];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return json({
    workflowId: params.id,
    currentStep: 1,
    totalSteps: WORKFLOW_STEPS.length,
    chatbotType: "ecommerce" // This would come from your database based on chatbotId
  });
};

export default function Steps() {
  const { chatbotType } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("../skill-selection");
  };

  const getChatbotTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      ecommerce: "E-commerce Assistant",
      customer_support: "Customer Support Agent",
      hr: "HR Assistant",
      it_helpdesk: "IT Helpdesk"
    };
    return types[type] || "AI Assistant";
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col p-4">
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1.5">
          <span>Getting Started</span>
          <span>0% Complete</span>
        </div>
        <Progress value={0} className="h-1.5" />
      </div>

      {/* Main Content */}
      <Card className="flex-1 p-4 overflow-hidden flex flex-col">
        {/* Welcome Section */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto text-center px-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-6">
            <Bot className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Configure Your {getChatbotTypeLabel(chatbotType)}</h1>
          <p className="text-gray-600 mb-8 text-sm">
            Let's set up your chatbot's capabilities and workflow. Follow our step-by-step wizard to create the perfect solution.
          </p>

          {/* Steps Preview */}
          <div className="w-full bg-gray-50 rounded-lg p-4 mb-8">
            <h3 className="text-sm font-medium mb-3">Setup Process</h3>
            <div className="grid gap-2">
              {WORKFLOW_STEPS.map((step) => (
                <div key={step.id} className="flex items-start gap-3 text-left">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                    {step.id}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{step.title}</div>
                    <div className="text-xs text-gray-500">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            size="lg" 
            className="gap-2"
            onClick={handleStart}
          >
            Start Configuration
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>You can save and resume your configuration at any time</p>
        </div>
      </Card>
    </div>
  );
} 