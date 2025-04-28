import { json, LoaderFunctionArgs, ActionFunctionArgs, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams, Form } from "@remix-run/react";
import { requireAuth } from "~/utils/loaders.middleware";
import { getUserInfo } from "~/utils/session.server";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { useState } from "react";
import { ResearchRequestsService } from "~/services/research/researchRequests.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  
  const requestId = params.id;
  if (!requestId) {
    throw json("Request ID is required", { status: 400 });
  }

  const tenantId = await getTenantIdFromUrl(params);
  if (!tenantId) {
    throw json("Tenant ID is required", { status: 400 });
  }
  
  // Get the research request
  const researchService = ResearchRequestsService.getInstance();
  const researchRequest = await researchService.getRequestById(requestId, tenantId);
  
  if (!researchRequest) {
    throw json("Research request not found", { status: 404 });
  }
  
  return json({ request: researchRequest });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireAuth({ request, params });
  
  // Get the tenant ID and user ID
  const userInfo = await getUserInfo(request);
  const tenantId = await getTenantIdFromUrl(params);
  
  if (!userInfo.userId || !tenantId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const requestId = params.id;
  if (!requestId) {
    return json({ error: "Request ID is required" }, { status: 400 });
  }
  
  // Process form data for the request
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const subredditsJson = formData.get("subreddits") as string;
  const keywordsJson = formData.get("keywords") as string;
  const scheduleType = formData.get("schedule_type") as "daily" | "weekly" | "monthly";
  const minScore = parseInt(formData.get("min_score") as string) || 10;
  const minComments = parseInt(formData.get("min_comments") as string) || 5;
  const timeFilter = formData.get("time_filter") as string || "all";
  const sort = formData.get("sort") as string || "relevance";
  const limit = parseInt(formData.get("limit") as string) || 100;
  const commentsLimit = parseInt(formData.get("comments_limit") as string) || 50;
  
  const subreddits = JSON.parse(subredditsJson) as string[];
  const keywords = JSON.parse(keywordsJson) as string[];
  
  // Add validation logic if needed
  if (!name || !description || !subreddits.length || !keywords.length) {
    return json({ error: "All fields are required" }, { status: 400 });
  }
  
  // Create the request data
  const requestData = {
    tenant_id: tenantId,
    name,
    description,
    schedule_type: scheduleType,
    subreddits,
    keywords,
    min_score: minScore,
    min_comments: minComments,
    time_filter: timeFilter,
    sort: sort,
    limit: limit,
    comments_limit: commentsLimit
  };
  
  console.log("Updating research request:", requestData);
  
  // Update the request
  const researchService = ResearchRequestsService.getInstance();
  const result = await researchService.updateRequest(requestId, requestData);
  
  if (!result) {
    return json({ error: "Failed to update research request" }, { status: 500 });
  }
  
  // Redirect to the view page
  return redirect(`/app/${params.tenant}/dashboard/view/${requestId}`);
};

export default function EditRequest() {
  const { request: researchRequest } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const params = useParams();
  
  const [subreddits, setSubreddits] = useState<string[]>(
    researchRequest.subreddits || []
  );
  const [keywords, setKeywords] = useState<string[]>(
    researchRequest.keywords || []
  );
  const [newSubreddit, setNewSubreddit] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  const handleSubredditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSubreddit.trim()) {
      e.preventDefault();
      setSubreddits([...subreddits, newSubreddit.trim()]);
      setNewSubreddit("");
    }
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newKeyword.trim()) {
      e.preventDefault();
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeSubreddit = (index: number) => {
    setSubreddits(subreddits.filter((_, i) => i !== index));
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  // Get description from either description or purpose field
  const getDescription = () => {
    if (researchRequest.description) return researchRequest.description;
    if (researchRequest.purpose) return researchRequest.purpose;
    return '';
  };

  // Format date for input
  const formatDateString = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Bar */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/app/${params.tenant}/dashboard/view/${params.id}`)}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h1 className="text-sm font-semibold text-gray-900">Edit Research Request</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Form method="post" className="space-y-6">
          {/* Request Name */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Request Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              defaultValue={researchRequest.name}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
              required
            />
          </div>

          {/* Description */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              defaultValue={getDescription()}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
              required
            />
          </div>

          {/* Subreddits */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="subreddits" className="block text-sm font-medium text-gray-700">
              Subreddits
            </label>
            <div className="mt-1">
              <input
                type="text"
                value={newSubreddit}
                onChange={(e) => setNewSubreddit(e.target.value)}
                onKeyDown={handleSubredditKeyDown}
                placeholder="Add subreddit name (without r/). Press Enter to add it."
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {subreddits.map((subreddit, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-md text-sm font-medium bg-purple-50 text-purple-800"
                  >
                    r/{subreddit}
                    <button
                      type="button"
                      onClick={() => removeSubreddit(index)}
                      className="ml-1.5 text-purple-600 hover:text-purple-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="keywords" className="block text-sm font-medium text-gray-700">
              Keywords
            </label>
            <div className="mt-1">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={handleKeywordKeyDown}
                placeholder="Add search keywords. Press Enter to add each one."
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1.5 rounded-md text-sm font-medium bg-gray-50 text-gray-800"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(index)}
                      className="ml-1.5 text-gray-500 hover:text-gray-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule Type */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="schedule_type" className="block text-sm font-medium text-gray-700">
              Schedule Type
            </label>
            <select
              id="schedule_type"
              name="schedule_type"
              defaultValue={researchRequest.schedule_type || "daily"}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Time Filter */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="time_filter" className="block text-sm font-medium text-gray-700">
              Time Filter
            </label>
            <select
              id="time_filter"
              name="time_filter"
              defaultValue={researchRequest.time_filter || "all"}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
            >
              <option value="all">All Time</option>
              <option value="day">Past 24 Hours</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="year">Past Year</option>
            </select>
          </div>

          {/* Sort Method */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
              Sort Method
            </label>
            <select
              id="sort"
              name="sort"
              defaultValue={researchRequest.sort || "relevance"}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
            >
              <option value="relevance">Relevance</option>
              <option value="hot">Hot</option>
              <option value="top">Top</option>
              <option value="new">New</option>
              <option value="comments">Most Comments</option>
            </select>
          </div>

          {/* Min Score and Min Comments */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="block text-sm font-medium text-gray-700 mb-4">Filter Settings</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="min_score" className="block text-sm font-medium text-gray-700">
                  Minimum Score
                </label>
                <input
                  type="number"
                  name="min_score"
                  id="min_score"
                  defaultValue={researchRequest.min_score || 10}
                  min={0}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                />
              </div>
              <div>
                <label htmlFor="min_comments" className="block text-sm font-medium text-gray-700">
                  Minimum Comments
                </label>
                <input
                  type="number"
                  name="min_comments"
                  id="min_comments"
                  defaultValue={researchRequest.min_comments || 5}
                  min={0}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Post and Comment Limits */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="block text-sm font-medium text-gray-700 mb-4">Result Limits</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="limit" className="block text-sm font-medium text-gray-700">
                  Maximum Posts
                </label>
                <input
                  type="number"
                  name="limit"
                  id="limit"
                  defaultValue={researchRequest.limit || 100}
                  min={1}
                  max={100}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Maximum number of posts to analyze (1-100)
                </p>
              </div>
             
            </div>
          </div>

          {/* Hidden fields for form submission */}
          <input type="hidden" name="subreddits" value={JSON.stringify(subreddits)} />
          <input type="hidden" name="keywords" value={JSON.stringify(keywords)} />

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Update Request
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
} 