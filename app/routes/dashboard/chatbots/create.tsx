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
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-4">Create Your Chatbot</h1>
        <Progress value={progress} className="h-2" />
        <div className="mt-2 flex justify-between">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`text-sm ${
                step.id === currentStep
                  ? "text-primary font-medium"
                  : "text-gray-500"
              }`}
            >
              Step {step.id}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {steps[currentStep - 1].title}
        </h2>
        <p className="text-gray-600 mb-6">
          {steps[currentStep - 1].description}
        </p>

        {/* Step Content Components */}
        {currentStep === 1 && <IndustrySelection />}
        {currentStep === 2 && <ChatbotType />}
        {currentStep === 3 && <SkillsSelection />}
        {currentStep === 4 && <ChatbotScope />}
        {currentStep === 5 && <DataUpload />}
        {currentStep === 6 && <FinalReview />}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
          className="px-4 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          {currentStep === steps.length ? "Create Chatbot" : "Next"}
        </button>
      </div>
    </div>
  );
} 