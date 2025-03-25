import { json, LoaderFunctionArgs } from "@remix-run/node";
import { requireAuth } from "~/utils/loaders.middleware";
import { ResearchRequestsService } from "~/services/research/researchRequests.server";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";

export { serverTimingHeaders as headers };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.dashboard.view.results");
  
  if (!params.id) {
    throw new Response("Request ID is required", { status: 400 });
  }

  const tenantId = await getTenantIdFromUrl(params);
  if (!tenantId) {
    throw new Response("Tenant ID is required", { status: 400 });
  }

  const url = new URL(request.url);
  const fromDate = url.searchParams.get("from_date");
  const toDate = url.searchParams.get("to_date");

  console.log(`[view.$id.results.loader] Fetching research results for request ${params.id}`);
  console.log(`Date range: ${fromDate || 'none'} to ${toDate || 'none'}`);

  const researchService = ResearchRequestsService.getInstance();
  
  try {
    const results = await time(
      researchService.getRequestResults(params.id, tenantId, fromDate || undefined, toDate || undefined),
      "fetchResearchResults"
    );
    
    console.log(`[view.$id.results.loader] Successfully fetched ${results.length} results`);
    return json({ results }, { headers: getServerTimingHeader() });
  } catch (error) {
    console.error(`[view.$id.results.loader] Error fetching research results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}; 