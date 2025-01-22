import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useSearchParams, Link, useParams, Outlet, useLocation } from "@remix-run/react";
import { useAppData } from "~/utils/data/useAppData";
import { DashboardLoaderData, loadDashboardData } from "~/utils/data/useDashboardData";
import { getTranslations } from "~/locale/i18next.server";
import { getAppDashboardStats } from "~/utils/services/appDashboardService";
import ProfileBanner from "~/components/app/ProfileBanner";
import { DashboardStats } from "~/components/ui/stats/DashboardStats";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { Stat } from "~/application/dtos/stats/Stat";
import InputSelect from "~/components/ui/input/InputSelect";
import PeriodHelper, { defaultPeriodFilter, PeriodFilters } from "~/utils/helpers/PeriodHelper";
import { useTranslation } from "react-i18next";
import ServerError from "~/components/ui/errors/ServerError";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { promiseHash } from "~/utils/promises/promiseHash";
import { getTenant } from "~/utils/db/tenants.db.server";
import { Fragment } from "react";
import { getTenantRelationshipsFrom, TenantRelationshipWithDetails } from "~/utils/db/tenants/tenantRelationships.db.server";
import LinkedAccountsTable from "~/components/core/linkedAccounts/LinkedAccountsTable";
import { useLoaderData } from "@remix-run/react";
import { getUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { requireAuth } from "~/utils/loaders.middleware";
import { Card, CardHeader, CardContent, CardFooter } from "~/components/ui/card";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { ChatbotService, ChatbotDetails } from "~/utils/services/chatbots/chatbotService.server";
import { useChatbot } from "~/context/ChatbotContext";
export { serverTimingHeaders as headers };

type LoaderData = DashboardLoaderData & {
  title: string;
  stats: Stat[];
  tenantRelationships: TenantRelationshipWithDetails[];
  chatbots: ChatbotDetails[];
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
      stats: getAppDashboardStats({ t, tenant, gte: PeriodHelper.getGreaterThanOrEqualsFromRequest({ request }) }),
      dashboardData: loadDashboardData({ request, params }),
    }),
    "app.$tenant.dashboard.details"
  );

  const tenantRelationships = await getTenantRelationshipsFrom(tenantId);
  const data: LoaderData = {
    title: `${t("app.sidebar.dashboard")} | ${process.env.APP_NAME}`,
    ...dashboardData,
    stats,
    tenantRelationships,
    chatbots
  };
  return json(data, { headers: getServerTimingHeader() });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [{ title: data?.title }];

export default function DashboardRoute() {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const { chatbots } = useLoaderData<typeof loader>();
  const isChildRoute = location.pathname.includes('/create') || location.pathname.includes('/file');
  const { selectedChatbotId, setSelectedChatbotId } = useChatbot();

  const handleSelectChatbot = (chatbotId: string) => {
    setSelectedChatbotId(chatbotId);
  };

  const handleDelete = async (chatbotId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete chatbot:', chatbotId);
  };

  if (isChildRoute) {
    return <Outlet />;
  }

  if (chatbots.length === 0) {
    return (
      <div className="flex-1 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <section className="flex items-center justify-center h-96">
            <div className="text-center">
              <svg
                className="w-16 h-16 text-gray-400 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              <h3 className="mt-4 text-xl font-bold text-gray-800">No AI Chatbot</h3>
              <p className="mt-2 text-gray-500">Start by creating your first chatbot.</p>
              <Link
                to="./create"
                className="inline-block mt-4 px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
              >
                Create Chatbot
              </Link>
            </div>
          </section>
        </div>
      </div>
    );
  } else {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        {/* Header Section */}
        <header className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">Your Chatbots</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Manage your AI chatbots and their data sources.
            </p>
          </div>
          <Link
            to="./create"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow-md hover:bg-blue-700"
            title="Create AI Chatbot"
          >
            <svg
              className="w-5 h-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            New Chatbot
          </Link>
        </header>

        <main className="space-y-10">
          {/* Chatbot Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {chatbots.map((chatbot) => (
              <Link
                key={chatbot.id}
                to={`/app/${params.tenant}/g/chatbot/${chatbot.id}`}
                className="group relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col h-full">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {chatbot.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex-grow">
                    {chatbot.status}
                  </p>
                  <div className="mt-4 flex items-center text-xs text-gray-400">
                    <span>Created {format(new Date(chatbot.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    );
  }
}

export function ErrorBoundary() {
  return <ServerError />;
}
