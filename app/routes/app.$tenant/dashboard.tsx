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

  const handleDelete = async (chatbotId: string) => {
    // TODO: Implement delete functionality
    console.log('Delete chatbot:', chatbotId);
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {isChildRoute ? (
        <Outlet />
      ) : (
        <div className="flex flex-col space-y-8 bg-gray-50">
          {/* Header Section */}
          <header className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800">Your AI Chatbots</h2>
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

          {/* Main Content */}
          <main className="space-y-10">
            {/* Chatbot Cards */}
            {chatbots.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {chatbots.map((chatbot) => (
                  <div
                    key={chatbot.id}
                    className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                  >
                    {/* Card Header */}
                    <div className="p-4 flex justify-between items-center border-b border-gray-200">
                      <Link
                        to={`/app/${params.tenant}/chatbot/${chatbot.id}`}
                        className="text-lg font-bold text-blue-600 hover:underline"
                      >
                        {chatbot.name}
                      </Link>
                      <button
                        onClick={() => handleDelete(chatbot.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Delete Chatbot"
                      >
                        <svg
                          className="w-5 h-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M9 11h6M12 14v-3" />
                        </svg>
                      </button>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                          <strong>Status:</strong> {chatbot.status}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Created:</strong>{" "}
                          {new Date(chatbot.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">0</div>
                          <p className="text-sm text-gray-500">Messages</p>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">0</div>
                          <p className="text-sm text-gray-500">Conversations</p>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-gray-900">0</div>
                          <p className="text-sm text-gray-500">Resolutions</p>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 border-t border-gray-200 flex justify-around items-center">
                      <Link
                        to={`/chatbot/${chatbot.id}/customize`}
                        title="Customize"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <svg
                          className="w-6 h-6"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </Link>
                      <Link
                        to={`/chatbot/${chatbot.id}/data-source`}
                        title="Data Source"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <svg
                          className="w-6 h-6"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </Link>
                      <Link
                        to={`/chatbot/${chatbot.id}/inbox`}
                        title="Inbox"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <svg
                          className="w-6 h-6"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </Link>
                      <Link
                        to={`/chatbot/${chatbot.id}/settings`}
                        title="Settings"
                        className="text-gray-500 hover:text-blue-600"
                      >
                        <svg
                          className="w-6 h-6"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}
