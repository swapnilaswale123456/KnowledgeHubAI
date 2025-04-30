import { json, LoaderFunctionArgs, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams, useSubmit, useActionData } from "@remix-run/react";
import { requireAuth } from "~/utils/loaders.middleware";
import { useState, useEffect } from "react";
import RequestForm from "~/components/research/RequestForm";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
import ResearchResults from "~/components/research/ResearchResults";

// Client-side type for ResearchRequest
type ResearchRequest = {
  id: string;
  name: string;
  purpose?: string;
  description?: string;
  subreddits: string[];
  keywords: string[];
  duration?: 'day' | 'week' | 'month';
  schedule_type?: 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    lastRun: string;
    nextRun: string;
  };
  min_score?: number;
  min_comments?: number;
  time_filter?: string;
  sort?: string;
  limit?: number;
  comments_limit?: number;
  createdAt: string;
  results?: {
    postsAnalyzed: number;
    relevantPosts: number;
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
    downloadUrl?: string;
  };
};

// Type for the loader data
type LoaderData = {
  request: ResearchRequest;
  results: any[]; // You might want to type this more specifically
};

// Type for request status
type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// Type for ResearchRequestsService
type ResearchRequestsServiceType = {
  getInstance: () => {
    getRequestStatus: (id: string, tenantId: string) => Promise<{
      success: boolean;
      status: 'pending' | 'running' | 'completed' | 'failed';
      message?: string;
      requestInfo?: {
        requestId: string;
        tenantId: string;
        lastRunAt?: string;
        nextRunAt?: string;
        createdAt: string;
        updatedAt: string;
      };
      results?: any;
    }>;
    handleRefresh: (id: string, tenantId: string) => Promise<{
      success: boolean;
      message?: string;
      shouldUpdate: boolean;
      status?: string;
      requestInfo?: {
        requestId: string;
        tenantId: string;
        lastRunAt?: string;
        nextRunAt?: string;
        createdAt: string;
        updatedAt: string;
      };
      results?: any;
    }>;
    deleteRequest: (id: string) => Promise<boolean>;
    updateRequest: (id: string, data: Partial<{
      tenant_id: string;
      name: string;
      description: string;
      subreddits: string[];
      keywords: string[];
      schedule_type: 'daily' | 'weekly' | 'monthly';
      min_score: number;
      min_comments: number;
      time_filter: string;
      sort: string;
      limit: number;
      comments_limit: number;
    }>) => Promise<ResearchRequest | null>;
    executeRequest: (id: string, tenantId: string, forceRefresh?: boolean) => Promise<{ success: boolean; message?: string; data?: any }>;
    scheduleRequest: (requestId: string, scheduleType: string) => Promise<boolean>;
    cancelSchedule: (requestId: string) => Promise<boolean>;
    getRequestById: (id: string, tenantId: string) => Promise<ResearchRequest | null>;
    getRequestResults: (requestId: string, tenantId: string, fromDate?: string, toDate?: string) => Promise<any[]>;
  };
};

export { serverTimingHeaders as headers };

// Import server-only code only in server-side functions
const getServerImports = async () => {
  const { ResearchRequestsService } = await import("~/services/research/researchRequests.server") as { ResearchRequestsService: ResearchRequestsServiceType };
  return { ResearchRequestsService };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireAuth({ request, params });
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.dashboard.view.action");
  const { ResearchRequestsService } = await getServerImports();
  const tenantId = await time(getTenantIdFromUrl(params), "getTenantIdFromUrl");
  const formData = await request.formData();
  const action = formData.get("_action") as string;
  const requestId = params.id;
  
  if (!requestId) {
    throw new Response("Request ID is required", { status: 400 });
  }

  const researchService = ResearchRequestsService.getInstance();
  
  if (action === "delete") {
    const success = await time(
      researchService.deleteRequest(requestId),
      "deleteResearchRequest"
    );
    
    if (success) {
      return redirect(`/app/${params.tenant}/dashboard`);
    } else {
      return json(
        { error: "Failed to delete research request" },
        { status: 500, headers: getServerTimingHeader() }
      );
    }
  }

  if (action === "update") {
    const updateData = {
      tenant_id: tenantId,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      subreddits: JSON.parse(formData.get("subreddits") as string) as string[],
      keywords: JSON.parse(formData.get("keywords") as string) as string[],
      schedule_type: formData.get("schedule_type") as "daily" | "weekly" | "monthly",
      min_score: parseInt(formData.get("min_score") as string) || 10,
      min_comments: parseInt(formData.get("min_comments") as string) || 5,
      time_filter: formData.get("time_filter") as string || "all",
      sort: formData.get("sort") as string || "relevance",
      limit: parseInt(formData.get("limit") as string) || 100,
      comments_limit: parseInt(formData.get("comments_limit") as string) || 50
    };

    console.log("Updating research request with data:", updateData);

    try {
      const result = await time(
        researchService.updateRequest(requestId, updateData),
        "updateResearchRequest"
      );

      if (!result) {
        return json(
          { error: "Failed to update research request" },
          { status: 500, headers: getServerTimingHeader() }
        );
      }

      return json({ 
        success: true,
        message: "Research request updated successfully",
        request: result
      }, { headers: getServerTimingHeader() });
    } catch (error) {
      console.error("Error updating research request:", error);
      return json(
        { error: error instanceof Error ? error.message : "Failed to update research request" },
        { status: 500, headers: getServerTimingHeader() }
      );
    }
  }

  if (action === "execute") {
    const success = await time(
      researchService.executeRequest(requestId, tenantId, true),
      "executeResearchRequest"
    );
    
    if (success) {
      return json(
        { success: true, message: "Research request execution started" },
        { headers: getServerTimingHeader() }
      );
    } else {
      return json(
        { error: "Failed to execute research request" },
        { status: 500, headers: getServerTimingHeader() }
      );
    }
  } else if (action === "schedule") {
    const scheduleType = formData.get("schedule_type") as string;
    const success = await time(
      researchService.scheduleRequest(requestId, scheduleType),
      "scheduleResearchRequest"
    );
    
    if (success) {
      return json(
        { success: true, message: "Research request scheduled" },
        { headers: getServerTimingHeader() }
      );
    } else {
      return json(
        { error: "Failed to schedule research request" },
        { status: 500, headers: getServerTimingHeader() }
      );
    }
  } else if (action === "cancel_schedule") {
    const success = await time(
      researchService.cancelSchedule(requestId),
      "cancelScheduleResearchRequest"
    );
    
    if (success) {
      return json(
        { success: true, message: "Research request schedule canceled" },
        { headers: getServerTimingHeader() }
      );
    } else {
      return json(
        { error: "Failed to cancel research request schedule" },
        { status: 500, headers: getServerTimingHeader() }
      );
    }
  }
  
  return json(
    { error: "Invalid action" },
    { status: 400, headers: getServerTimingHeader() }
  );
};

export const loader = async ({ request: req, params }: LoaderFunctionArgs) => {
  await requireAuth({ request: req, params });
  const { time, getServerTimingHeader } = await createMetrics({ request: req, params }, "app.$tenant.dashboard.view.loader");
  const { ResearchRequestsService } = await getServerImports();
  
  if (!params.id) {
    throw new Response("Request ID is required", { status: 400 });
  }

  const tenantId = await getTenantIdFromUrl(params);
  if (!tenantId) {
    throw new Response("Tenant ID is required", { status: 400 });
  }

  console.log(`[view.$id.loader] Fetching research request with ID: ${params.id} for tenant: ${tenantId}`);

  const researchService = ResearchRequestsService.getInstance();
  
  try {
    const [request, results] = await Promise.all([
      time(
        researchService.getRequestById(params.id, tenantId),
        "fetchResearchRequest"
      ),
      time(
        researchService.getRequestResults(params.id, tenantId),
        "fetchResearchResults"
      )
    ]);
    
    if (!request) {
      console.log(`[view.$id.loader] Research request not found with ID: ${params.id}`);
      throw new Response("Research request not found", { status: 404 });
    }
    
    console.log(`[view.$id.loader] Successfully fetched research request with ID: ${params.id}`);
    return json<LoaderData>({ request, results }, { headers: getServerTimingHeader() });
  } catch (error) {
    console.error(`[view.$id.loader] Error fetching research request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

export default function ViewRequest() {
  const { request, results } = useLoaderData<typeof loader>();
  const actionData = useActionData<{
    success?: boolean;
    message?: string;
    error?: string;
    request?: ResearchRequest;
  }>();
  const navigate = useNavigate();
  const params = useParams();
  const submit = useSubmit();
  const [isEditing, setIsEditing] = useState(false);
  const [executionStarted, setExecutionStarted] = useState(false);
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>(request.status);
  const [requestInfo, setRequestInfo] = useState<{
    lastRunAt?: string;
    nextRunAt?: string;
    updatedAt?: string;
  } | null>(null);
  const [currentRequest, setCurrentRequest] = useState<ResearchRequest>(request);
  const [researchResults, setResearchResults] = useState(results || []);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [fromDate, setFromDate] = useState<string>(new Date(request.createdAt).toISOString());
  const [toDate, setToDate] = useState<string>(new Date().toISOString());

  // Type guards to check actionData properties
  const hasError = actionData && 'error' in actionData;
  const hasSuccess = actionData && 'success' in actionData && actionData.success === true;

  // Show notification when action data changes
  useEffect(() => {
    if (hasError) {
      setNotification({
        message: actionData?.error || 'An error occurred',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    } else if (hasSuccess) {
      setNotification({
        message: actionData?.message || 'Operation successful',
        type: 'success'
      });
      setTimeout(() => setNotification(null), 5000);
      // Update the current request if it was updated
      if (actionData?.request) {
        setCurrentRequest(actionData.request);
      }
      // Close the edit form if it was open
      setIsEditing(false);
    }
  }, [actionData, hasError, hasSuccess]);

  // Auto-refresh for in-progress requests
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;

    if (requestStatus === 'in_progress') {
      refreshInterval = setInterval(async () => {
        try {
          const response = await fetch(`/app/${params.tenant}/dashboard/view/${request.id}/status`);
          if (!response.ok) throw new Error('Failed to fetch status');
          
          const data = await response.json();
          if (data.success) {
            // Map the server status to our client status type
            const mappedStatus: RequestStatus = data.status === 'running' ? 'in_progress' : data.status as RequestStatus;
            setRequestStatus(mappedStatus);
            if (data.requestInfo) {
              setRequestInfo(data.requestInfo);
            }
            if (mappedStatus !== 'in_progress') {
              if (refreshInterval) {
                clearInterval(refreshInterval);
              }
            }
          }
        } catch (error) {
          console.error('Error refreshing request status:', error);
        }
      }, 5000);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [requestStatus, request.id, params.tenant]);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this research request?')) {
      submit({ _action: 'delete' }, { method: 'post' });
    }
  };

  const handleExecute = () => {
    setExecutionStarted(true);
    submit({ _action: 'execute' }, { method: 'post' });
  };

  const handleSchedule = () => {
    submit({ _action: 'schedule', schedule_type: scheduleType }, { method: 'post' });
  };

  const handleCancelSchedule = () => {
    submit({ _action: 'cancel_schedule' }, { method: 'post' });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/app/${params.tenant}/dashboard/view/${request.id}/refresh`);
      if (!response.ok) throw new Error('Failed to refresh');
      
      const data = await response.json();
      if (data.success) {
        // Map the server status to our client status type
        const mappedStatus: RequestStatus = data.status === 'running' ? 'in_progress' : data.status as RequestStatus;
        setRequestStatus(mappedStatus);
        if (data.requestInfo) {
          setRequestInfo(data.requestInfo);
        }
        setLastRefreshTime(new Date());
      }
    } catch (error) {
      console.error('Error refreshing request:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDateRangeChange = async (fromDate: string, toDate: string) => {
    setIsLoadingResults(true);
    try {
      const response = await fetch(`/app/${params.tenant}/dashboard/view/${request.id}/results?fromDate=${fromDate}&toDate=${toDate}`);
      if (!response.ok) throw new Error('Failed to fetch results');
      
      const data = await response.json();
      setResearchResults(data.results);
      setNotification({
        message: 'Results filtered successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error filtering results:', error);
      setNotification({
        message: error instanceof Error ? error.message : 'Failed to filter results',
        type: 'error'
      });
    } finally {
      setIsLoadingResults(false);
    }
  };

  if (isEditing) {
    return (
      <RequestForm
        mode="edit"
        initialData={{
          id: currentRequest.id,
          name: currentRequest.name,
          description: currentRequest.description,
          purpose: currentRequest.purpose,
          subreddits: currentRequest.subreddits,
          keywords: currentRequest.keywords,
          min_score: currentRequest.min_score,
          min_comments: currentRequest.min_comments,
          schedule_type: currentRequest.schedule_type,
          time_filter: currentRequest.time_filter,
          sort: currentRequest.sort,
          limit: currentRequest.limit,
          comments_limit: currentRequest.comments_limit
        }}
        onClose={() => setIsEditing(false)}
        updateRequest={async (data) => {
          const formData = new FormData();
          formData.append("_action", "update");
          formData.append("name", data.name);
          formData.append("description", data.description);
          formData.append("subreddits", JSON.stringify(data.subreddits));
          formData.append("keywords", JSON.stringify(data.keywords));
          formData.append("schedule_type", data.schedule_type);
          formData.append("min_score", data.min_score.toString());
          formData.append("min_comments", data.min_comments.toString());
          formData.append("time_filter", data.time_filter);
          formData.append("sort", data.sort);
          formData.append("limit", data.limit.toString());
          formData.append("comments_limit", data.comments_limit.toString());
          
          await submit(formData, { method: "post" });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/app/${params.tenant}/dashboard`)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-sm font-semibold text-gray-900">View Research Request</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-orange-600 bg-clip-text text-transparent">
                  {currentRequest.name}
                </h1>
                <p className="text-gray-600 mt-1 text-sm">{currentRequest.purpose}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(currentRequest.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-xs border-2 border-orange-200 rounded-lg hover:bg-orange-50 flex items-center text-orange-600"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setShowScheduleOptions(!showScheduleOptions)}
                  className="px-3 py-1.5 text-xs border-2 border-orange-200 rounded-lg hover:bg-orange-50 flex items-center text-orange-600"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Schedule
                </button>
                <button 
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs border-2 border-red-100 rounded-lg text-red-600 hover:bg-red-50 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>

          {/* Execute Section */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Execute Request</h2>
                <p className="text-xs text-gray-600 mt-0.5">Run analysis to find potential contacts</p>
                {lastRefreshTime && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last refreshed: {lastRefreshTime.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`px-3 py-1.5 text-xs border-2 border-orange-200 rounded-lg hover:bg-orange-50 flex items-center text-orange-600 ${
                    refreshing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <svg className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowScheduleOptions(!showScheduleOptions)}
                    className={`px-3 py-1.5 text-xs ${
                      currentRequest.schedule 
                        ? 'border-2 border-green-100 text-green-600 hover:bg-green-50' 
                        : 'border-2 border-orange-200 text-orange-600 hover:bg-orange-50'
                    } rounded-lg flex items-center`}
                  >
                    <svg className={`w-4 h-4 mr-1 ${currentRequest.schedule ? 'text-green-500' : 'text-orange-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {currentRequest.schedule ? 'Scheduled' : 'Schedule'}
                  </button>
                  {showScheduleOptions && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white p-3 ring-1 ring-black ring-opacity-5 z-10">
                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Schedule Type</label>
                        <select
                          value={scheduleType}
                          onChange={(e) => setScheduleType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                          className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => setShowScheduleOptions(false)}
                          className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSchedule}
                          className="px-2 py-1 text-xs text-purple-600 hover:text-purple-800"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleExecute}
                  disabled={request.status === 'in_progress' || executionStarted}
                  className="px-3 py-1.5 text-xs text-white bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg hover:from-orange-700 hover:to-orange-800 flex items-center shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  {executionStarted ? 'Processing...' : 'Execute Request'}
                </button>
              </div>
            </div>

            {(requestStatus === 'completed' || requestStatus === 'in_progress' || request.schedule) && (
              <div className={`mt-3 p-3 ${
                requestStatus === 'completed' 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100' 
                  : requestStatus === 'in_progress'
                  ? 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-100'
                  : 'bg-gradient-to-r from-orange-50 to-orange-100 border-orange-100'
              } rounded-lg border`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 ${
                      requestStatus === 'completed' ? 'bg-green-500' : 
                      requestStatus === 'in_progress' ? 'bg-orange-500' : 
                      'bg-orange-500'
                    } rounded-full`}></span>
                    <span className={`text-xs font-semibold ${
                      requestStatus === 'completed' ? 'text-green-800' : 
                      requestStatus === 'in_progress' ? 'text-orange-800' : 
                      'text-orange-800'
                    } capitalize`}>
                      {requestStatus === 'pending' && request.schedule ? 'Scheduled' : requestStatus}
                    </span>
                    <span className={`text-xs ${
                      requestStatus === 'completed' ? 'text-green-600' : 
                      requestStatus === 'in_progress' ? 'text-orange-600' : 
                      'text-orange-600'
                    }`}>
                      {requestInfo?.lastRunAt && `Last run: ${new Date(requestInfo.lastRunAt).toLocaleString()}`}
                      {requestInfo?.nextRunAt && ` | Next run: ${new Date(requestInfo.nextRunAt).toLocaleString()}`}
                    </span>
                  </div>
                  {requestStatus === 'completed' && request.results && (
                    <button className="px-3 py-1.5 text-xs bg-white border-2 border-green-200 rounded-lg hover:bg-green-50 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Results
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Error message */}
            {hasError && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100 text-xs text-red-600">
                {actionData.error}
              </div>
            )}
            
            {/* Success message */}
            {hasSuccess && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100 text-xs text-green-600">
                {actionData.message}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Subreddits */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
                Target Subreddits
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {request.subreddits.map((subreddit, index) => (
                  <span key={index} className="px-2 py-1 text-xs rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                    r/{subreddit}
                  </span>
                ))}
              </div>
            </div>

            {/* Search Keywords */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Keywords
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {request.keywords.map((keyword, index) => (
                  <span key={index} className="px-2 py-1 text-xs rounded-lg bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Research Results Section */}
          {currentRequest.status === 'completed' && researchResults && researchResults.length > 0 && (
            <div className="mt-6">
              {isLoadingResults ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <ResearchResults
                  results={researchResults}
                  onDateRangeChange={handleDateRangeChange}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm flex items-center ${
          notification.type === 'success' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
        }`}>
          <span className={`w-2 h-2 mr-2 rounded-full ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          <p className={`text-sm ${
            notification.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>{notification.message}</p>
          <button 
            onClick={() => setNotification(null)}
            className={`ml-3 text-sm ${
              notification.type === 'success' ? 'text-green-600' : 'text-red-600'
            } hover:opacity-75`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
} 