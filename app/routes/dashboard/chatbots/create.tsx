import { useState } from "react";
import { Progress } from "~/components/ui/progress";

const steps = [
  { id: 1, title: "Industry Selection", description: "Choose your business domain" },
  { id: 2, title: "Chatbot Type", description: "Select the type of chatbot" },
  { id: 3, title: "Skills Selection", description: "Define chatbot capabilities" },
  { id: 4, title: "Chatbot Scope", description: "Set operational boundaries" },
  { id: 5, title: "Data Upload", description: "Add training data" },
  { id: 6, title: "Review & Train", description: "Finalize and start training" },
];

export default function CreateChatbotWorkflow() {
  const [currentStep, setCurrentStep] = useState(1);
  const progress = (currentStep / steps.length) * 100;

  return (
    <div>
      <h1>Create Chatbot Workflow</h1>
    </div>
  );
} 