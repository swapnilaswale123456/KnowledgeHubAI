import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ResearchRequestsService } from "~/services/research/researchRequests.server";
import { requireAuth } from "~/utils/loaders.middleware";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";

export { serverTimingHeaders as headers };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.dashboard.diagnostics");

  console.log("[diagnostics.loader] Starting API diagnostics check");
  const researchService = ResearchRequestsService.getInstance();
  
  // Run API health check
  const apiHealth = await time(
    researchService.checkApiHealth(),
    "checkApiHealth"
  );
  
  // Get API environment details
  const apiDetails = {
    apiEndpoint: process.env.PYTHON_API_ENDPOINT || "http://localhost:5000",
    apiKeyConfigured: !!process.env.PYTHON_API_KEY,
    nodeEnv: process.env.NODE_ENV || "development"
  };
  
  console.log(`[diagnostics.loader] API health check completed: ${apiHealth.isAvailable ? "Available" : "Unavailable"}`);
  
  return json(
    {
      apiHealth,
      apiDetails,
      timestamp: new Date().toISOString()
    },
    { headers: getServerTimingHeader() }
  );
};

export default function DiagnosticsRoute() {
  const { apiHealth, apiDetails, timestamp } = useLoaderData<typeof loader>();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">API Diagnostics</h1>
      
      <div className="mb-8 p-4 rounded-lg border bg-white">
        <h2 className="text-lg font-semibold mb-3">API Health Status</h2>
        <div className="flex items-center mb-4">
          <div className={`w-4 h-4 rounded-full mr-2 ${apiHealth.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={`font-medium ${apiHealth.isAvailable ? 'text-green-700' : 'text-red-700'}`}>
            {apiHealth.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Status Message</h3>
            <p className="text-sm bg-gray-50 p-2 rounded">{apiHealth.message}</p>
          </div>
          {apiHealth.statusCode && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Status Code</h3>
              <p className="text-sm bg-gray-50 p-2 rounded">{apiHealth.statusCode}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-8 p-4 rounded-lg border bg-white">
        <h2 className="text-lg font-semibold mb-3">API Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">API Endpoint</h3>
            <p className="text-sm bg-gray-50 p-2 rounded font-mono break-all">{apiDetails.apiEndpoint}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">API Key Configured</h3>
            <p className="text-sm bg-gray-50 p-2 rounded">{apiDetails.apiKeyConfigured ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Node Environment</h3>
            <p className="text-sm bg-gray-50 p-2 rounded">{apiDetails.nodeEnv}</p>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        Diagnostic run completed at: {new Date(timestamp).toLocaleString()}
      </div>
    </div>
  );
} 