import { WorkflowSteps, steps } from "~/components/chatbot/WorkflowSteps";
import { IndustrySelection } from "~/components/chatbot/IndustrySelection";
import { ChatbotType } from "~/components/chatbot/ChatbotType";
import { SkillsSelection } from "~/components/chatbot/SkillsSelection";
import { ChatbotScope } from "~/components/chatbot/ChatbotScope";
import { DataSourceSelection } from "~/components/chatbot/DataSourceSelection";
import { DataUpload } from "~/components/chatbot/DataUpload";
import { FinalReview } from "~/components/chatbot/FinalReview";
import { Button } from "~/components/ui/button";
import { FileSource } from "../core/files/FileList";

interface ChatbotWorkflowProps {
  currentStep: number;
  config: any;
  onStepChange: (step: number) => void;
  onClose: () => void;
  onUpdateConfig: (field: "type" | "files" | "skills" | "industry" | "dataSource" | "scope" | "trainingData", value: any) => void;
  onNext: () => void;
  onSubmit: () => void;
  existingFiles: FileSource[];
  isSubmitting: boolean;
  editingChatbotId?: string;
}

export function ChatbotWorkflow({ 
  currentStep, 
  config, 
  onStepChange, 
  onClose,
  onUpdateConfig,
  onNext,
  onSubmit,
  existingFiles,
  isSubmitting,
  editingChatbotId
}: ChatbotWorkflowProps) {
  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto">
        <WorkflowSteps
          currentStep={currentStep}
          onClose={onClose}
          onStepChange={onStepChange}
        />

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold mb-1">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-sm text-gray-600">
              {steps[currentStep - 1].description}
            </p>
          </div>

          <div className={currentStep === 5 || currentStep === 6 ? "max-w-6xl mx-auto" : "max-w-2xl mx-auto"}>
            {currentStep === 1 && (
              <IndustrySelection
                value={config.industry}
                onChange={(value) => onUpdateConfig("industry", value)}
              />
            )}
            {currentStep === 2 && (
              <ChatbotType
                value={config.type}
                onChange={(value) => onUpdateConfig("type", value)}
              />
            )}
            {currentStep === 3 && (
              <SkillsSelection
                selectedSkills={config.skills}
                onChange={(skills) => onUpdateConfig("skills", skills)}
              />
            )}
            {currentStep === 4 && (
              <ChatbotScope
                scope={config.scope}
                onChange={(field, value) => 
                  onUpdateConfig("scope", { ...config.scope, [field]: value })
                }
              />
            )}
            {currentStep === 5 && (
              <DataSourceSelection
                value={config.dataSource}
                onChange={(value) => onUpdateConfig("dataSource", value)}
              />
            )}
            {currentStep === 6 && (
              <DataUpload
                files={config.files}
                onChange={(newFiles) => onUpdateConfig("trainingData", newFiles)}
                onChangeDataSource={() => onStepChange(5)}
                existingFiles={existingFiles}
                chatbotId={editingChatbotId}
              />
            )}
            {currentStep === 7 && <FinalReview config={config} />}
          </div>
        </div>

        <div className="flex justify-center items-center max-w-2xl mx-auto">
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                if (currentStep === 1) {
                  onClose();
                } else {
                  onStepChange(currentStep - 1);
                }
              }}
            >
              {currentStep === 1 ? "Cancel" : "Back"}
            </Button>
            <Button
              onClick={currentStep === steps.length ? onSubmit : onNext}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <span className="animate-spin mr-2">⏳</span>
                  Creating Chatbot...
                </div>
              ) : (
                currentStep === steps.length ? "Create Chatbot" : "Next"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 