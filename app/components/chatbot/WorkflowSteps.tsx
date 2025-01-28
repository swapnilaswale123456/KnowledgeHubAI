import { Progress } from "~/components/ui/progress";
import { Button } from "~/components/ui/button";
import { X } from "lucide-react";

export const steps = [
  { id: 1, title: "Industry Selection", description: "Choose your business domain" },
  { id: 2, title: "Chatbot Type", description: "Select the type of chatbot" },
  { id: 3, title: "Skills Selection", description: "Define chatbot capabilities" },
  { id: 4, title: "Chatbot Scope", description: "Set operational boundaries" },
  { id: 5, title: "Data Source", description: "Choose your data source type" },
  { id: 6, title: "Data Upload", description: "Add training data" },
  { id: 7, title: "Review & Train", description: "Finalize and start training" },
];

interface WorkflowStepsProps {
  currentStep: number;
  onClose: () => void;
  onStepChange: (step: number) => void;
}

export function WorkflowSteps({ currentStep, onClose, onStepChange }: WorkflowStepsProps) {
  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-lg font-semibold">Create Your Chatbot</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Progress value={progress} className="h-1.5 mb-3" />
      
      <div className="grid grid-cols-7 gap-1">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => onStepChange(step.id)}
            className={`text-center p-1.5 rounded transition-colors ${
              step.id === currentStep
                ? "bg-primary/10 text-primary"
                : step.id < currentStep
                ? "text-gray-600 hover:bg-gray-100"
                : "text-gray-400 cursor-not-allowed"
            }`}
            disabled={step.id > currentStep}
          >
            <div className="flex items-center justify-center mb-0.5">
              <span className={`
                w-5 h-5 rounded-full flex items-center justify-center text-xs
                ${step.id === currentStep
                  ? "bg-primary text-white"
                  : step.id < currentStep
                  ? "bg-gray-200 text-gray-600"
                  : "bg-gray-100 text-gray-400"
                }
              `}>
                {step.id}
              </span>
            </div>
            <span className="text-[10px] font-medium block leading-tight">
              {step.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
} 