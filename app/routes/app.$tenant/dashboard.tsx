import { json, LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { useSearchParams, Link, useParams, Outlet, useLocation, useLoaderData, useNavigate, useFetcher } from "@remix-run/react";
import { useAppData } from "~/utils/data/useAppData";
import { DashboardLoaderData, loadDashboardData } from "~/utils/data/useDashboardData";
import { getTranslations } from "~/locale/i18next.server";
import { getAppDashboardStats } from "~/utils/services/appDashboardService";
import ProfileBanner from "~/components/app/ProfileBanner";
import { DashboardStats } from "~/components/dashboard/DashboardStats";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { Stat } from "~/application/dtos/stats/Stat";
import { useTranslation } from "react-i18next";
import ServerError from "~/components/ui/errors/ServerError";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { promiseHash } from "~/utils/promises/promiseHash";
import { getTenant } from "~/utils/db/tenants.db.server";
import { Fragment, useState, useEffect } from "react";
import { requireAuth } from "~/utils/loaders.middleware";
import { Card, CardContent } from "~/components/ui/card";
import { Plus, X, Trash2, Bot, Activity, Clock, MessageSquare, Database, MoreVertical, Settings, Pause, Archive } from "lucide-react";
import { ChatbotService, ChatbotDetails } from "~/utils/services/chatbots/chatbotService.server";
import { useChatbot } from "~/context/ChatbotContext";
import { Button } from "~/components/ui/button";
import { IndustrySelection } from "~/components/chatbot/IndustrySelection";
import { ChatbotType } from "~/components/chatbot/ChatbotType";
import { SkillsSelection } from "~/components/chatbot/SkillsSelection";
import { ChatbotScope } from "~/components/chatbot/ChatbotScope";
import { DataUpload } from "~/components/chatbot/DataUpload";
import { FinalReview } from "~/components/chatbot/FinalReview";
import { WorkflowSteps, steps } from "~/components/chatbot/WorkflowSteps";
import { getFileUploadService } from "~/utils/services/api/fileUploadService.server";
import { db } from "~/utils/db.server";
import type { FileSource } from "~/components/core/files/FileList";
import { DataSourceSelection } from "~/components/chatbot/DataSourceSelection";
import { getIndustries, getChatbotTypesByIndustry, getSkillsByChatbotType } from "~/services/chatbot/InstructionService";

import { Badge } from "~/components/ui/badge";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "~/components/ui/dropdown-menu";
import { ChatbotSetupService } from "~/services/chatbot/ChatbotSetupService";
import { cn } from "~/lib/utils";
import { ChatbotStatusService } from "~/services/chatbot/ChatbotStatusService";
import { ChatbotStatus } from "@prisma/client";
import { ChatbotQueryService } from "~/services/chatbot/ChatbotQueryService";
import { DataSourceQueryService } from "~/services/data/DataSourceQueryService";
import { DashboardHeader } from "~/components/dashboard/DashboardHeader";
import { ChatbotCard } from "~/components/dashboard/ChatbotCard";
import { ChatbotWorkflow } from "~/components/dashboard/ChatbotWorkflow";

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
    await ChatbotStatusService.updateStatus(chatbotId, status);
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
  const { chatbots, files, industries, chatbotTypes, skills, dashboardStats } = useLoaderData<typeof loader>();
  const isChildRoute = location.pathname.includes('/create') || location.pathname.includes('/file');
  const { selectedChatbotId, setSelectedChatbotId } = useChatbot();
  const navigate = useNavigate();
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(5);
  const [config, setConfig] = useState<ChatbotConfig>({
    industry: "",
    type: "",
    skills: [],
    scope: {
      purpose: "",
      audience: "",
      tone: "",
    },
    dataSource: "",
    trainingData: [],
    files: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingChatbotId, setEditingChatbotId] = useState<string | null>(null);
  const [createdChatbotId, setCreatedChatbotId] = useState<string | null>(null);

  const fetcher = useFetcher<ActionData>();

  const handleSelectChatbot = (chatbotId: string) => {
    setSelectedChatbotId(chatbotId);
  };

  const handleDelete = async (chatbotId: string) => {
    const formData = new FormData();
    formData.append("intent", "delete-chatbot");
    formData.append("chatbotId", chatbotId);
    
    fetcher.submit(formData, { method: "POST" });
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
      
      if (editingChatbotId) {
        formData.append("intent", "update-chatbot");
        formData.append("chatbotId", editingChatbotId);
      } else {
        formData.append("intent", "create-chatbot");
      }
      
      formData.append("config", JSON.stringify(config));
      formData.append("currentStep", currentStep.toString());
      
      const response = await fetcher.submit(formData, { method: "POST" });
      console.log("Chatbot creation response:", response);
    } 
    else if (currentStep === steps.length) {      
      handleSubmit();
    } 
    else if (canProceed()) {
      setCurrentStep((prev) => Math.min(steps.length, prev + 1));
    }
  };

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setIsSubmitting(false);
      if (fetcher.data.chatbot?.id) {
        const newChatbotId = fetcher.data.chatbot.id;
        setCreatedChatbotId(newChatbotId);
        setEditingChatbotId(newChatbotId); // Also set as editing ID to ensure it's tracked
        
      }
      setCurrentStep((prev) => Math.min(steps.length, prev + 1));
    }
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.chatbot) {
      const chatbot = fetcher.data.chatbot;
      setConfig({
        industry: chatbot.industry ?? "",
        type: chatbot.type ?? "",
        skills: chatbot.skills ?? [],
        scope: chatbot.scope ?? { purpose: "", audience: "", tone: "" },
        dataSource: chatbot.dataSource ?? "",
        trainingData: chatbot.trainingData ?? [],
        files: chatbot.files ?? []
      });
      // If step 4 is completed, open at step 5
      const startStep = chatbot.lastCompletedStep === 4 ? 5 : chatbot.lastCompletedStep ?? 1;
      
      setCurrentStep(startStep);
      setIsWorkflowOpen(true);
    
    }
  }, [fetcher.state, fetcher.data]);

  const handleSubmit = async () => {
    try {
      if (!config.trainingData.length) return;
      
      const chatbotId = editingChatbotId || createdChatbotId;
      console.log("Submit with chatbotId:", chatbotId);
      console.log("editingChatbotId:", editingChatbotId);
      console.log("createdChatbotId:", createdChatbotId);
      
      if (!chatbotId) {
        console.error("No chatbot ID found");
        return;
      }
      
      const formData = new FormData();
      formData.append("intent", "train");
      formData.append("sourceId", String(config.trainingData[0].sourceId));
      formData.append("chatbotId", chatbotId);
      
      await fetcher.submit(formData, { method: "POST" });
      
      // Update status after training
      const statusFormData = new FormData();
      statusFormData.append("intent", "update-status");
      statusFormData.append("chatbotId", chatbotId);
      statusFormData.append("status", ChatbotStatus.ACTIVE);
      
      await fetcher.submit(statusFormData, { method: "POST" });
      
      // Reset all states
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
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  const handleStepChange = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step);
    }
  };

  const handleCreateChatbot = () => {
    navigate(`/app/${params.tenant}/dashboard`);
  };

  const handleStatusChange = async (chatbotId: string, status: ChatbotStatus) => {
    await ChatbotStatusService.updateStatus(chatbotId, status);
    // Optionally refresh the chatbots list
  };

  const handleEdit = async (chatbot: ChatbotDetails) => {
    
    setEditingChatbotId(chatbot.id); // Set editing ID
    const formData = new FormData();
    formData.append("intent", "get-chatbot");
    formData.append("chatbotId", chatbot.id);
    
    fetcher.submit(formData, { method: "POST" });
  };

  if (isChildRoute) {
    return <Outlet />;
  }

  return (
    <div className="flex-1">
      <DashboardHeader 
        onNewChatbot={() => setIsWorkflowOpen(true)}
        onDataSources={() => navigate(`/app/${params.tenant}/g/data-sources`)}
      />

      {!isWorkflowOpen ? (
        <div className="p-8 bg-gray-50 min-h-screen">
          <DashboardStats 
            totalChatbots={chatbots?.length ?? 0}
            activeChatbots={dashboardStats?.activeCount ?? 0}
            totalMessages={0}
            totalDataSources={dashboardStats?.totalDataSources ?? 0}
          />

          <div className="grid grid-cols-3 gap-6">
            {chatbots.map((chatbot) => (
              <ChatbotCard
                key={chatbot.id}
                chatbot={chatbot}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onNavigate={navigate}
                onEdit={handleEdit}
                tenantSlug={params.tenant ?? ''}
              />
            ))}
          </div>
        </div>
      ) : (
        <ChatbotWorkflow 
          currentStep={currentStep}
          config={config}
          onStepChange={handleStepChange}
          onClose={() => {
            setIsWorkflowOpen(false);
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
          }}
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
