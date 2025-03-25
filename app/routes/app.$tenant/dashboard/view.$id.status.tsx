import { json, LoaderFunctionArgs } from "@remix-run/node";
import { requireAuth } from "~/utils/loaders.middleware";
import { ResearchRequestsService } from "~/services/research/researchRequests.server";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";

export { serverTimingHeaders as headers };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.dashboard.view.status.loader");
  
  if (!params.id) {
    throw new Response("Request ID is required", { status: 400 });
  }

  const tenantId = await getTenantIdFromUrl(params);
  if (!tenantId) {
    throw new Response("Tenant ID is required", { status: 400 });
  }

  console.log(`[view.$id.status.loader] Checking status for research request with ID: ${params.id} for tenant: ${tenantId}`);

  const researchService = ResearchRequestsService.getInstance();
  
  try {
    const refreshResult = await time(
      researchService.handleRefresh(params.id, tenantId),
      "checkResearchRequestStatus"
    );
    
    console.log(`[view.$id.status.loader] Status check result:`, refreshResult);
    
    return json(refreshResult, { headers: getServerTimingHeader() });
  } catch (error) {
    console.error(`[view.$id.status.loader] Error checking request status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to check request status',
        shouldUpdate: false 
      }, 
      { 
        status: 500,
        headers: getServerTimingHeader()
      }
    );
  }
}; 