import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Bot, ArrowRight, CheckCircle2 } from "lucide-react";
import { Progress } from "~/components/ui/progress";

const WORKFLOW_STEPS = [
  { id: 1, title: "Select Skills", description: "Choose from recommended AI capabilities" },
  { id: 2, title: "Generate Workflow", description: "Auto-generate your workflow" },
  { id: 3, title: "Connect APIs", description: "Quick API setup" },
  { id: 4, title: "Launch", description: "Go live with your chatbot" }
];

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return json({
    workflowId: params.id,
    totalSteps: 4,
    chatbotType: "ecommerce" // This would come from your database based on chatbotId
  });
};

export default function Steps() {
  const { chatbotType, totalSteps } = useLoaderData<typeof loader>();
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
        <div className="flex items-center justify-between text-xs text-gray-600 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="font-medium">Setup Progress</span>
            <span className="text-gray-400">•</span>
            <span>Step 0 of {totalSteps}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-200"></div>
            <div className="w-2 h-2 rounded-full bg-gray-200"></div>
            <div className="w-2 h-2 rounded-full bg-gray-200"></div>
          </div>
        </div>
        <Progress value={0} max={100} className="h-1.5" />
      </div>

      {/* Main Content */}
      <Card className="flex-1 p-4 overflow-hidden flex flex-col">
        {/* Welcome Section */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4">
            <Bot className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Configure Your {getChatbotTypeLabel(chatbotType)}</h1>
          <p className="text-gray-600 mb-6 text-sm">
            Quick 4-step setup to get your AI assistant up and running
          </p>

          {/* Primary Action */}
          <Button 
            size="lg" 
            className="gap-2 mb-8"
            onClick={handleStart}
          >
            Start Configuration
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Steps Preview - More Compact */}
          <div className="w-full bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-2">
              {WORKFLOW_STEPS.map((step) => (
                <div key={step.id} className="flex items-center gap-2 p-2">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                    {step.id}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-medium">{step.title}</div>
                    <div className="text-[10px] text-gray-500">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Benefits */}
          <div className="mt-6 grid grid-cols-2 gap-3 text-left">
            {[
              "AI-powered skill recommendations",
              "Automated workflow generation",
              "Pre-configured API templates",
              "5-minute setup process"
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>You can save and resume your configuration at any time</p>
        </div>
      </Card>
    </div>
  );
} 