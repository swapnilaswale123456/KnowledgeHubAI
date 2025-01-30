import { json, LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { useParams, Outlet, useLocation, useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { DashboardLoaderData, loadDashboardData } from "~/utils/data/useDashboardData";
import { getTranslations } from "~/locale/i18next.server";
import { getAppDashboardStats } from "~/utils/services/appDashboardService";
import { DashboardStats } from "~/components/dashboard/DashboardStats";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { Stat } from "~/application/dtos/stats/Stat";
import { useTranslation } from "react-i18next";
import ServerError from "~/components/ui/errors/ServerError";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { promiseHash } from "~/utils/promises/promiseHash";
import { getTenant } from "~/utils/db/tenants.db.server";
import { useState, useEffect } from "react";
import { requireAuth } from "~/utils/loaders.middleware";
import { ChatbotDetails } from "~/utils/services/chatbots/chatbotService.server";
import { useChatbot } from "~/context/ChatbotContext";
import { steps } from "~/components/chatbot/WorkflowSteps";
import { getFileUploadService } from "~/utils/services/api/fileUploadService.server";
import type { FileSource } from "~/components/core/files/FileList";
import { getIndustries, getChatbotTypesByIndustry, getSkillsByChatbotType } from "~/services/chatbot/InstructionService";

import { ChatbotSetupService } from "~/services/chatbot/ChatbotSetupService";
import { ChatbotStatusService } from "~/services/chatbot/ChatbotStatusService";
import { ChatbotStatus } from "@prisma/client";
import { ChatbotQueryService } from "~/services/chatbot/ChatbotQueryService";
import { DataSourceQueryService } from "~/services/data/DataSourceQueryService";
import { DashboardHeader } from "~/components/dashboard/DashboardHeader";
import { ChatbotCard } from "~/components/dashboard/ChatbotCard";
import { ChatbotWorkflow } from "~/components/dashboard/ChatbotWorkflow";
import { useWorkflowState } from "~/hooks/useWorkflowState";
import { useChatbotActions } from "~/hooks/useChatbotActions";
import { DashboardContent } from "~/components/dashboard/DashboardContent";

export { serverTimingHeaders as headers };

type LoaderData = DashboardLoaderData & {
  title: string;
  stats: Stat[];
  chatbots: ChatbotDetails[];
  files: FileSource[];
  industries: { id: number; name: string }[];
  chatbotTypes: { id: number; name: string }[];
  skills: { id: number; name: string }[];
  dashboardStats: { totalDataSources: number; activeCount: number };
};

interface ActionData {
  success: boolean;
  chatbot?: any;
}

interface ChatbotConfig {
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

interface ChatbotFormData {
  intent: string;
  chatbotId?: string;
  config?: string;
  currentStep?: string;
  sourceId?: string;
  status?: ChatbotStatus;
}

// Add type for fetcher data
interface FetcherData {
  success?: boolean;
  chatbot?: ChatbotDetails;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.dashboard");
  let { t } = await time(getTranslations(request), "getTranslations");
  const tenantId = await time(getTenantIdFromUrl(params), "getTenantIdFromUrl");
  const tenant = await time(getTenant(tenantId), "getTenant");
  const chatbots = await ChatbotQueryService.getChatbots(tenantId);
  const dashboardStats = await ChatbotQueryService.getDashboardStats(tenantId);

  const { stats, dashboardData } = await time(
    promiseHash({
      stats: getAppDashboardStats({ 
        t, 
        tenant,
        gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
      }),
      dashboardData: loadDashboardData({ request, params }),
    }),
    "app.$tenant.dashboard.details"
  );

  // Get uploaded files
  const files = await DataSourceQueryService.getDataSources(tenantId); 
  // Get initial industry for default values
  const industries = await getIndustries();
  const firstIndustry = industries[0];
  
  // Get chatbot types for first industry
  const chatbotTypes = firstIndustry 
    ? await getChatbotTypesByIndustry(firstIndustry.id)
    : [];
  
  // Get skills for first chatbot type
  const firstChatbotType = chatbotTypes[0];
  const skills = firstChatbotType 
    ? await getSkillsByChatbotType(firstChatbotType.id)
    : [];

  const data: LoaderData = {
    title: `${t("app.sidebar.dashboard")} | ${process.env.APP_NAME}`,
    ...dashboardData,
    stats,
    chatbots,
    files,
    industries,
    chatbotTypes,
    skills,
    dashboardStats,
  };

  return json(data, { headers: getServerTimingHeader() });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [{ title: data?.title }];

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const tenantId = await getTenantIdFromUrl(params);
  const fileUploadService = getFileUploadService();
  const chatbotId = formData.get("chatbotId") as string;

  if (intent === "delete") {
    const sourceId = formData.get("sourceId") as string;
    const result = await fileUploadService.deleteDataSource(parseInt(sourceId));
    return json(result);
  }

  if (intent === "train") {
    const sourceId = formData.get("sourceId") as string;
    const file = formData.get("file") as File;
    const chatbotId = formData.get("chatbotId") as string;
    if (!file) {
      return json({ success: false, message: "No file provided for training" });
    }
    const result = await fileUploadService.uploadFile(file, tenantId, request, true, chatbotId);
    return json(result);
  }

  if (intent === "create-chatbot") {
    const config = JSON.parse(formData.get("config") as string);
    const currentStep = Number(formData.get("currentStep") || "1");
    
    const chatbot = await ChatbotSetupService.createChatbot(tenantId, config, currentStep);
    
    // Set the chatbotId in fileUploadService
    formData.append("chatbotId", chatbot.id);
    
    return json({ success: true, chatbot });
  }

  if (intent === "update-status") {
    const chatbotId = formData.get("chatbotId") as string;
    const status = formData.get("status") as ChatbotStatus;
    await ChatbotStatusService.activateChatbot(chatbotId);
    return json({ success: true });
  }

  if (intent === "get-chatbot") {
    const chatbotId = formData.get("chatbotId") as string;
    const chatbot = await ChatbotQueryService.getChatbot(chatbotId);
    return json({ chatbot });
  }

  if (intent === "update-chatbot") {
    const chatbotId = formData.get("chatbotId") as string;
    const config = JSON.parse(formData.get("config") as string);
    const currentStep = Number(formData.get("currentStep") || "1");
    
    if (!chatbotId) {
      return json({ success: false, message: "No chatbot ID provided" });
    }

    const chatbot = await ChatbotSetupService.updateChatbot(chatbotId, config);
    return json({ success: true, chatbot });
  }
  if (intent === "delete-chatbot") {
    const chatbotId = formData.get("chatbotId") as string;
    await ChatbotSetupService.deleteChatbot(chatbotId);
    
    // Return updated chatbots list
    const chatbots = await ChatbotQueryService.getChatbots(tenantId);
    return json({ success: true, chatbots });
  }
 
  const file = formData.get("file") as File;
  if (!file) {
    return json({ success: false, message: "No file uploaded" });
  }  
 
  const result = await fileUploadService.uploadFile(file, tenantId, request,false,chatbotId);
  return json(result);
};

export default function DashboardRoute() {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { chatbots, files, dashboardStats } = useLoaderData<typeof loader>();
  const isChildRoute = location.pathname.includes('/create') || location.pathname.includes('/file');
  
  const workflowState = useWorkflowState();
  const { fetcher, handleChatbotAction, handleTraining, handleStatusUpdate } = useChatbotActions();
  
  const {
    isWorkflowOpen,
    currentStep,
    config,
    editingChatbotId,
    createdChatbotId,
    isSubmitting,
    resetWorkflowState,
    setCurrentStep,
    setConfig,
    setIsWorkflowOpen,
    setEditingChatbotId,
    setIsSubmitting,
    setCreatedChatbotId
  } = workflowState;

  const handleSelectChatbot = (chatbotId: string) => {
    // Implementation of handleSelectChatbot
  };

  const handleDelete = async (chatbotId: string) => {
    if (!confirm("Are you sure you want to delete this chatbot? This action cannot be undone.")) {
      return;
    }

    const formData = new FormData();
    formData.append("intent", "delete-chatbot");
    formData.append("chatbotId", chatbotId);

    await fetcher.submit(formData, {
      method: "POST"
    });

    // Close workflow if open
    if (editingChatbotId === chatbotId) {
      resetWorkflowState();
    }
  };

  const handleUpdateConfig = (field: keyof typeof config, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return config.industry !== "";
      case 2:
        return config.type !== "";
      case 3:
        return config.skills.length > 0;
      case 4:
        return config.scope.purpose !== "" && 
               config.scope.audience !== "" && 
               config.scope.tone !== "";
      case 5:
        return config.dataSource !== "";
      case 6:
        return config.trainingData.length > 0;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (currentStep === 4 && canProceed()) {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append("intent", editingChatbotId ? "update-chatbot" : "create-chatbot");
      formData.append("config", JSON.stringify(config));
      formData.append("currentStep", currentStep.toString());
      
      if (editingChatbotId) {
        formData.append("chatbotId", editingChatbotId);
      }
      
      await fetcher.submit(formData, { method: "POST" });
    } else if (currentStep === steps.length) {      
      handleSubmit();
    } else if (canProceed()) {
      setCurrentStep((prev) => Math.min(steps.length, prev + 1));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!config.trainingData.length) return;
      
      const activeChatbotId = editingChatbotId || createdChatbotId;
      if (!activeChatbotId) {
        console.error("No chatbot ID found");
        return;
      }
      
      // Handle training
      await handleTraining(
        activeChatbotId, 
        String(config.trainingData[0].sourceId)
      );
      
      // Update status
      await handleStatusUpdate(activeChatbotId, ChatbotStatus.ACTIVE);
      
      // Reset workflow state
      resetWorkflowState();
      
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  const handleStepChange = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleStatusChange = async (chatbotId: string, status: ChatbotStatus) => {
    const formData = new FormData();
    formData.append("intent", "update-status");
    formData.append("chatbotId", chatbotId);
    formData.append("status", status); // Make sure to pass the actual enum value
    
    await fetcher.submit(formData, {
      method: "POST"
    });
  };

  const handleEdit = async (chatbot: ChatbotDetails) => {
    try {
      // Get full chatbot details first
      const formData = new FormData();
      formData.append("intent", "get-chatbot");
      formData.append("chatbotId", chatbot.id);
      
      // Set initial config from existing chatbot
      setConfig({
        industry: chatbot.industry ?? "",
        type: chatbot.type ?? "",
        skills: chatbot.skills ?? [],
        scope: chatbot.scope ?? { purpose: "", audience: "", tone: "" },
        dataSource: chatbot.dataSource ?? "",
        trainingData: chatbot.trainingData ?? [],
        files: chatbot.files ?? []
      });

      // Submit the request
      await fetcher.submit(formData, { method: "POST" });

    } catch (error) {
      console.error("Error in handleEdit:", error);
    }
  };

  // Update the effect to handle opening the workflow
  useEffect(() => {
    if (fetcher.state === "idle" && (fetcher.data as FetcherData)?.chatbot) {
      const chatbot = (fetcher.data as FetcherData).chatbot!;
      
      setConfig(prev => ({
        ...prev,
        industry: chatbot?.industry ?? prev.industry,
        type: chatbot?.type ?? prev.type,
        skills: chatbot?.skills ?? prev.skills,
        scope: chatbot?.scope ?? prev.scope,
        dataSource: chatbot?.dataSource ?? prev.dataSource,
        trainingData: chatbot?.trainingData ?? prev.trainingData,
        files: chatbot?.files ?? prev.files
      }));

      const startStep = chatbot?.lastCompletedStep === 4 ? 5 : chatbot?.lastCompletedStep ?? 1;
      setCurrentStep(startStep);

      // Open workflow after data is loaded
      setEditingChatbotId(chatbot.id);
      setIsWorkflowOpen(true);
    }
  }, [fetcher.state, fetcher.data]);

  // Add effect to handle chatbot creation response
  useEffect(() => {
    if (fetcher.state === "idle" && (fetcher.data as FetcherData)?.success) {
      setIsSubmitting(false);
      
      if ((fetcher.data as FetcherData)?.chatbot?.id) {
        const newChatbotId = (fetcher.data as FetcherData).chatbot!.id;
        setCreatedChatbotId(newChatbotId);
        setEditingChatbotId(newChatbotId);
        setCurrentStep((prev) => Math.min(steps.length, prev + 1));
      }
    } else if (fetcher.state === "idle" && !(fetcher.data as FetcherData)?.success) {
      setIsSubmitting(false);
    }
  }, [fetcher.state, fetcher.data]);

  if (isChildRoute) {
    return <Outlet />;
  }

    return (
    <div className="flex-1">
       {/* Only show header when workflow is not open */}
       {!isWorkflowOpen && (
        <DashboardHeader 
          onNewChatbot={() => workflowState.setIsWorkflowOpen(true)}
          onDataSources={() => navigate(`/app/${params.tenant}/g/data-sources`)}
        />
      )}

      {!isWorkflowOpen ? (
        <DashboardContent 
          chatbots={chatbots}
          dashboardStats={dashboardStats}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onEdit={handleEdit}
          tenantSlug={params.tenant ?? ''}
          navigate={navigate}
          isLoading={fetcher.state !== "idle"}
        />
      ) : (
        <ChatbotWorkflow 
          currentStep={currentStep}
          config={config}
          onStepChange={handleStepChange}
          onClose={resetWorkflowState}
          onUpdateConfig={handleUpdateConfig}
          onNext={handleNext}
          onSubmit={handleSubmit}
          existingFiles={files}
          isSubmitting={isSubmitting}
          editingChatbotId={editingChatbotId ?? ''}
        />
      )}
      </div>
    );
}

export function ErrorBoundary() {
  return <ServerError />;
}

const createFormData = (data: ChatbotFormData): FormData => {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value.toString());
    }
  });
  return formData;
};
