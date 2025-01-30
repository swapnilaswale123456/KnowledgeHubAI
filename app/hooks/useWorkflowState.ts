import { useState } from 'react';
import { ChatbotStatus } from "@prisma/client";
import type { ChatbotConfig } from "~/types/chatbot";

export function useWorkflowState() {
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingChatbotId, setEditingChatbotId] = useState<string | null>(null);
  const [createdChatbotId, setCreatedChatbotId] = useState<string | null>(null);
  const [config, setConfig] = useState<ChatbotConfig>({
    industry: "",
    type: "",
    skills: [],
    scope: { purpose: "", audience: "", tone: "" },
    dataSource: "",
    trainingData: [],
    files: []
  });

  const resetWorkflowState = () => {
    setIsWorkflowOpen(false);
    setCurrentStep(1);
    setEditingChatbotId(null);
    setCreatedChatbotId(null);
    setConfig({
      industry: "",
      type: "",
      skills: [],
      scope: { purpose: "", audience: "", tone: "" },
      dataSource: "",
      trainingData: [],
      files: []
    });
  };

  return {
    isWorkflowOpen,
    setIsWorkflowOpen,
    currentStep,
    setCurrentStep,
    isSubmitting,
    setIsSubmitting,
    editingChatbotId,
    setEditingChatbotId,
    createdChatbotId,
    setCreatedChatbotId,
    config,
    setConfig,
    resetWorkflowState
  };
} 