import type { FileSource } from "~/components/core/files/FileList";
import { ChatbotStatus } from "@prisma/client";

export interface ChatbotConfig {
  industry: string;
  type: string;
  skills: string[];
  scope: {
    purpose: string;
    audience: string;
    tone: string;
  };
  dataSource: string;
  trainingData: FileSource[];
  files: FileSource[];
}

export type WorkflowState = {
  config: ChatbotConfig;
  currentStep: number;
  isComplete: boolean;
};

export interface ChatbotDetails {
  id: string;
  name: string;
  uniqueUrl: string;
  updatedAt: Date | string;
  industry?: string;
  type?: string;
  skills?: string[];
  scope?: {
    purpose: string;
    audience: string;
    tone: string;
  };
  dataSource?: string;
  trainingData?: FileSource[];
  files?: FileSource[];
  lastCompletedStep?: number;
  status: ChatbotStatus;
  createdAt: Date | string;
}

export interface ChatbotFormData {
  intent: string;
  chatbotId?: string;
  config?: string;
  currentStep?: string;
  sourceId?: string;
  status?: string;
} 