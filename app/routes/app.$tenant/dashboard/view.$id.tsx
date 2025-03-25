import { json, LoaderFunctionArgs, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams, useSubmit, useActionData } from "@remix-run/react";
import { requireAuth } from "~/utils/loaders.middleware";
import { useState, useEffect } from "react";
import RequestForm from "~/components/research/RequestForm";
import { ResearchRequestsService, ResearchRequest } from "~/services/research/researchRequests.server";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";

export { serverTimingHeaders as headers };

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireAuth({ request, params });
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.dashboard.view.action");
  
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
  } else if (action === "execute") {
    const success = await time(
      researchService.executeRequest(requestId),
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
  
  if (!params.id) {
    throw new Response("Request ID is required", { status: 400 });
  }

  console.log(`[view.$id.loader] Fetching research request with ID: ${params.id}`);

  const researchService = ResearchRequestsService.getInstance();
  
  try {
    const request = await time(
      researchService.getRequestById(params.id),
      "fetchResearchRequest"
    );
    
    if (!request) {
      console.log(`[view.$id.loader] Research request not found with ID: ${params.id}`);
      throw new Response("Research request not found", { status: 404 });
    }
    
    console.log(`[view.$id.loader] Successfully fetched research request with ID: ${params.id}`);
    return json({ request }, { headers: getServerTimingHeader() });
  } catch (error) {
    console.error(`[view.$id.loader] Error fetching research request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

export default function ViewRequest() {
  const { request } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigate = useNavigate();
  const params = useParams();
  const submit = useSubmit();
  const [isEditing, setIsEditing] = useState(false);
  const [executionStarted, setExecutionStarted] = useState(false);
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Type guards to check actionData properties
  const hasError = actionData && 'error' in actionData;
  const hasSuccess = actionData && 'success' in actionData && actionData.success === true;

  // Show notification when action data changes
  useEffect(() => {
    if (hasError) {
      setNotification({
        message: actionData.error,
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    } else if (hasSuccess) {
      setNotification({
        message: actionData.message,
        type: 'success'
      });
      setTimeout(() => setNotification(null), 5000);
    }
  }, [actionData, hasError, hasSuccess]);

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this research request?")) {
      const formData = new FormData();
      formData.append("_action", "delete");
      submit(formData, { method: "post" });
    }
  };

  const handleExecute = () => {
    const formData = new FormData();
    formData.append("_action", "execute");
    submit(formData, { method: "post" });
    setExecutionStarted(true);
  };

  const handleSchedule = () => {
    const formData = new FormData();
    formData.append("_action", "schedule");
    formData.append("schedule_type", scheduleType);
    submit(formData, { method: "post" });
    setShowScheduleOptions(false);
  };

  const handleRefresh = () => {
    // Force a refresh by navigating to the same page
    navigate(`/app/${params.tenant}/dashboard/view/${request.id}`, { replace: true });
  };

  if (isEditing) {
    return (
      <RequestForm
        mode="edit"
        initialData={{
          name: request.name,
          description: request.description,
          purpose: request.purpose,
          subreddits: request.subreddits,
          keywords: request.keywords,
          duration: request.duration,
          min_score: request.min_score,
          min_comments: request.min_comments,
          schedule_type: request.schedule_type,
          date_range: request.date_range
        }}
        onClose={() => setIsEditing(false)}
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
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  {request.name}
                </h1>
                <p className="text-gray-600 mt-1 text-sm">{request.purpose}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {new Date(request.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-xs border-2 border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => setShowScheduleOptions(!showScheduleOptions)}
                  className="px-3 py-1.5 text-xs border-2 border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
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

            {/* Analysis Duration */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Analysis Duration
              </h2>
              <div className="inline-flex items-center px-2 py-1 text-xs rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 capitalize">
                {request.duration}
              </div>
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

          {/* Execute Section */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Execute Request</h2>
                <p className="text-xs text-gray-600 mt-0.5">Run analysis to find potential contacts</p>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={handleRefresh}
                  className="px-3 py-1.5 text-xs border-2 border-gray-200 rounded-lg hover:bg-gray-50 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowScheduleOptions(!showScheduleOptions)}
                    className={`px-3 py-1.5 text-xs ${
                      request.schedule 
                        ? 'border-2 border-green-100 text-green-600 hover:bg-green-50' 
                        : 'border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50'
                    } rounded-lg flex items-center`}
                  >
                    <svg className={`w-4 h-4 mr-1 ${request.schedule ? 'text-green-500' : 'text-indigo-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {request.schedule ? 'Scheduled' : 'Schedule'}
                  </button>
                  {showScheduleOptions && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white p-3 ring-1 ring-black ring-opacity-5 z-10">
                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Schedule Type</label>
                        <select
                          value={scheduleType}
                          onChange={(e) => setScheduleType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-xs"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="flex justify-between">
                        {request.schedule && (
                          <button
                            onClick={() => {
                              const formData = new FormData();
                              formData.append("_action", "cancel_schedule");
                              submit(formData, { method: "post" });
                              setShowScheduleOptions(false);
                            }}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                          >
                            Cancel Schedule
                          </button>
                        )}
                        <button
                          onClick={handleSchedule}
                          className="px-2 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          {request.schedule ? 'Update Schedule' : 'Save Schedule'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleExecute}
                  disabled={request.status === 'in_progress' || executionStarted}
                  className="px-3 py-1.5 text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 flex items-center shadow-sm disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  {executionStarted ? 'Processing...' : 'Execute Request'}
                </button>
              </div>
            </div>

            {(request.status === 'completed' || request.status === 'in_progress' || request.schedule) && (
              <div className={`mt-3 p-3 ${
                request.status === 'completed' 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100' 
                  : request.status === 'in_progress'
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
                  : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'
              } rounded-lg border`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 ${
                      request.status === 'completed' ? 'bg-green-500' : 
                      request.status === 'in_progress' ? 'bg-blue-500' : 
                      'bg-indigo-500'
                    } rounded-full`}></span>
                    <span className={`text-xs font-semibold ${
                      request.status === 'completed' ? 'text-green-800' : 
                      request.status === 'in_progress' ? 'text-blue-800' : 
                      'text-indigo-800'
                    } capitalize`}>
                      {request.status === 'pending' && request.schedule ? 'Scheduled' : request.status}
                    </span>
                    <span className={`text-xs ${
                      request.status === 'completed' ? 'text-green-600' : 
                      request.status === 'in_progress' ? 'text-blue-600' : 
                      'text-indigo-600'
                    }`}>
                      {request.schedule 
                        ? `${request.schedule.frequency} (Next: ${new Date(request.schedule.nextRun).toLocaleString()})` 
                        : new Date(request.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {request.status === 'completed' && request.results && (
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