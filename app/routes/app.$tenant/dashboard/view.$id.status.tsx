import { json, LoaderFunctionArgs } from "@remix-run/node";
import { requireAuth } from "~/utils/loaders.middleware";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";

export { serverTimingHeaders as headers };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.dashboard.view.status");
  const { ResearchRequestsService } = await import("~/services/research/researchRequests.server");
  
  if (!params.id) {
    throw new Response("Request ID is required", { status: 400 });
  }

  const tenantId = await getTenantIdFromUrl(params);
  if (!tenantId) {
    throw new Response("Tenant ID is required", { status: 400 });
  }

  const researchService = ResearchRequestsService.getInstance();
  const response = await time(
    researchService.getRequestStatus(params.id, tenantId),
    "getRequestStatus"
  );

  return json(response, { headers: getServerTimingHeader() });
}; 