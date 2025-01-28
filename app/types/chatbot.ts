export type ChatbotConfig = {
  industry: string;
  type: string;
  skills: string[];
  scope: {
    purpose: string;
    audience: string;
    tone: string;
  };
  trainingData: File[];
};

export type WorkflowState = {
  config: ChatbotConfig;
  currentStep: number;
  isComplete: boolean;
}; 