import { json, LoaderFunctionArgs, MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { useSearchParams, Link, useParams, Outlet, useLocation, useLoaderData, useNavigate } from "@remix-run/react";
import { useAppData } from "~/utils/data/useAppData";
import { DashboardLoaderData, loadDashboardData } from "~/utils/data/useDashboardData";
import { getTranslations } from "~/locale/i18next.server";
import { getAppDashboardStats } from "~/utils/services/appDashboardService";
import ProfileBanner from "~/components/app/ProfileBanner";
import { DashboardStats } from "~/components/ui/stats/DashboardStats";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { Stat } from "~/application/dtos/stats/Stat";
import { useTranslation } from "react-i18next";
import ServerError from "~/components/ui/errors/ServerError";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { promiseHash } from "~/utils/promises/promiseHash";
import { getTenant } from "~/utils/db/tenants.db.server";
import { Fragment, useState } from "react";
import { requireAuth } from "~/utils/loaders.middleware";
import { Card, CardContent } from "~/components/ui/card";
import { Plus, X, Trash2, Bot, Activity, Clock, MessageSquare, Database, MoreVertical, Settings } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";

export { serverTimingHeaders as headers };

type LoaderData = DashboardLoaderData & {
  title: string;
  stats: Stat[];
  chatbots: ChatbotDetails[];
  files: FileSource[];
  industries: { id: number; name: string }[];
  chatbotTypes: { id: number; name: string }[];
  skills: { id: number; name: string }[];
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.dashboard");
  let { t } = await time(getTranslations(request), "getTranslations");
  const tenantId = await time(getTenantIdFromUrl(params), "getTenantIdFromUrl");
  const tenant = await time(getTenant(tenantId), "getTenant");
  const chatbots = await ChatbotService.getChatbots(tenantId);

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
  const files = await db.dataSources.findMany({
    where: {
      tenantId,
      sourceTypeId: 2,
    },
    select: {
      sourceId: true,
      sourceDetails: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

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
    files: files.map(f => ({
      sourceId: f.sourceId,
      fileName: (f.sourceDetails as any)?.fileName ?? 'Untitled',
      fileType: (f.sourceDetails as any)?.fileType ?? 'application/octet-stream',
      createdAt: new Date(f.createdAt),
      isTrained: (f.sourceDetails as any)?.isTrained ?? true
    })),
    industries,
    chatbotTypes,
    skills,
  };

  return json(data, { headers: getServerTimingHeader() });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [{ title: data?.title }];

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const tenantId = await getTenantIdFromUrl(params);
  const fileUploadService = getFileUploadService();

  if (intent === "delete") {
    const sourceId = formData.get("sourceId") as string;
    const result = await fileUploadService.deleteDataSource(parseInt(sourceId));
    return json(result);
  }

  if (intent === "train") {
    const sourceId = formData.get("sourceId") as string;
    const file = formData.get("file") as File;
    if (!file) {
      return json({ success: false, message: "No file provided for training" });
    }
    const result = await fileUploadService.uploadFile(file, tenantId, request, true);
    return json(result);
  }

  const file = formData.get("file") as File;
  if (!file) {
    return json({ success: false, message: "No file uploaded" });
  }

  const result = await fileUploadService.uploadFile(file, tenantId, request);
  return json(result);
};

export default function DashboardRoute() {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const { chatbots, files, industries, chatbotTypes, skills } = useLoaderData<typeof loader>();
  const isChildRoute = location.pathname.includes('/create') || location.pathname.includes('/file');
  const { selectedChatbotId, setSelectedChatbotId } = useChatbot();
  const navigate = useNavigate();
  const [isWorkflowOpen, setIsWorkflowOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(5);
  const [config, setConfig] = useState({
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
  });

  const handleSelectChatbot = (chatbotId: string) => {
    setSelectedChatbotId(chatbotId);
  };

  const handleDelete = async (chatbotId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete chatbot:', chatbotId);
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

  const handleNext = () => {
    if (currentStep === steps.length) {
      handleSubmit();
    } else if (canProceed()) {
      setCurrentStep((prev) => Math.min(steps.length, prev + 1));
    }
  };

  const handleSubmit = async () => {
    try {
      // Add your API call here to create the chatbot
      console.log("Submitting config:", config);
      setIsWorkflowOpen(false);
      setCurrentStep(1);
      setConfig({
        industry: "",
        type: "",
        skills: [],
        scope: { purpose: "", audience: "", tone: "" },
        dataSource: "",
        trainingData: [],
      });
    } catch (error) {
      console.error("Error creating chatbot:", error);
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

  if (isChildRoute) {
    return <Outlet />;
  }

  return (
    <div className="flex-1">
      <div className="border-b bg-white">
        <div className="flex h-16 items-center px-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              AI Chatbots
            </h1>
            <p className="text-sm text-gray-500">
              Manage and monitor your chatbots
            </p>
          </div>
          <div className="flex gap-3 ml-auto">
            <Button
              variant="outline"
              asChild
              className="inline-flex items-center gap-x-2"
            >
              <Link to={`/app/${params.tenant}/g/data-sources`}>
                <Database className="w-4 h-4" />
                Data Sources
              </Link>
            </Button>
            <Button
              onClick={() => setIsWorkflowOpen(true)}
              className="inline-flex items-center gap-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Chatbot
            </Button>
          </div>
        </div>
      </div>

      {!isWorkflowOpen ? (
        <div className="p-8 bg-gray-50 min-h-screen">
          {/* Stats Section */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Assistants</p>
                    <h3 className="text-3xl font-bold text-blue-900 mt-2">{chatbots.length}</h3>
                  </div>
                  <div className="p-3 bg-blue-200 rounded-xl">
                    <Bot className="h-6 w-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-green-600">Active</p>
                    <h3 className="text-3xl font-bold text-green-900 mt-2">{chatbots.length}</h3>
                  </div>
                  <div className="p-3 bg-green-200 rounded-xl">
                    <Activity className="h-6 w-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Total Messages</p>
                    <h3 className="text-3xl font-bold text-purple-900 mt-2">0</h3>
                  </div>
                  <div className="p-3 bg-purple-200 rounded-xl">
                    <MessageSquare className="h-6 w-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Data Sources</p>
                    <h3 className="text-3xl font-bold text-orange-900 mt-2">{files.length}</h3>
                  </div>
                  <div className="p-3 bg-orange-200 rounded-xl">
                    <Database className="h-6 w-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chatbots Grid */}
          <div className="grid grid-cols-3 gap-6">
            {chatbots.map((chatbot) => (
              <Card key={chatbot.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Bot className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-lg">{chatbot.name}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => navigate(`/app/${params.tenant}/g/chatbot/${chatbot.id}`)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(chatbot.id)} className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                        Active
                      </Badge>
                      <span className="text-gray-500">Created {format(new Date(), 'MMM d, yyyy')}</span>
                    </div>

                    <div className="pt-4 border-t">
                      <Button 
                        className="w-full"
                        variant="outline"
                        onClick={() => navigate(`/app/${params.tenant}/g/chatbot/${chatbot.id}`)}
                      >
                        View Chatbot
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4">
          <div className="max-w-6xl mx-auto">
            <WorkflowSteps
              currentStep={currentStep}
              onClose={() => setIsWorkflowOpen(false)}
              onStepChange={handleStepChange}
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

              <div className="max-w-6xl mx-auto">
                {currentStep === 1 && (
                  <IndustrySelection
                    value={config.industry}
                    onChange={(value) => handleUpdateConfig("industry", value)}
                  />
                )}
                {currentStep === 2 && (
                  <ChatbotType
                    value={config.type}
                    onChange={(value) => handleUpdateConfig("type", value)}
                  />
                )}
                {currentStep === 3 && (
                  <SkillsSelection
                    selectedSkills={config.skills}
                    onChange={(skills) => handleUpdateConfig("skills", skills)}
                  />
                )}
                {currentStep === 4 && (
                  <ChatbotScope
                    scope={config.scope}
                    onChange={(field, value) => 
                      handleUpdateConfig("scope", { ...config.scope, [field]: value })
                    }
                  />
                )}
                {currentStep === 5 && (
                  <DataSourceSelection
                    value={config.dataSource}
                    onChange={(value) => handleUpdateConfig("dataSource", value)}
                  />
                )}
                {currentStep === 6 && (
                  <DataUpload
                    files={files}
                    onChange={(newFiles) => handleUpdateConfig("trainingData", newFiles)}
                    onChangeDataSource={() => setCurrentStep(5)}
                  />
                )}
                {currentStep === 7 && <FinalReview config={config} />}
              </div>
            </div>

            <div className="flex justify-center items-center max-w-2xl mx-auto">
            <div className="flex space-x-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (currentStep === 1) {
                    setIsWorkflowOpen(false);
                  } else {
                    setCurrentStep((prev) => Math.max(1, prev - 1));
                  }
                }}
              >
                {currentStep === 1 ? "Cancel" : "Back"}
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                {currentStep === steps.length ? "Create Chatbot" : "Next"}
              </Button>
            </div>
          </div>

          </div>
        </div>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}
