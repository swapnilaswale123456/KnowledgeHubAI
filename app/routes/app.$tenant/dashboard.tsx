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
import { useTypedLoaderData } from "remix-typedjson";
import { getUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { requireAuth } from "~/utils/loaders.middleware";
import { Card } from "~/components/ui/card";
export { serverTimingHeaders as headers };

type LoaderData = DashboardLoaderData & {
  title: string;
  stats: Stat[];
  tenantRelationships: TenantRelationshipWithDetails[];
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.dashboard");
  let { t } = await time(getTranslations(request), "getTranslations");
  const tenantId = await time(getTenantIdFromUrl(params), "getTenantIdFromUrl");
  const tenant = await time(getTenant(tenantId), "getTenant");

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
  };
  return json(data, { headers: getServerTimingHeader() });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [{ title: data?.title }];

export default function DashboardRoute() {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const isChildRoute = location.pathname.includes('/create') || location.pathname.includes('/file');

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {isChildRoute ? (
        <Outlet />
      ) : (
        <Card className="flex flex-col items-center justify-center p-8 h-96">
          <div className="text-center space-y-5">
            <div className="flex justify-center">
              <svg 
                className="h-16 w-16 text-gray-400"
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-medium text-gray-900">No AI Chatbot</h3>
              <p className="text-gray-500">Get started by creating a new AI Chatbot</p>
            </div>
            <Link
              to="./create"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-gray-800 h-10 px-4 py-2"
            >
              New AI Chatbot
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}
