import { redirect, json, ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useNavigate, useParams, useLoaderData, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { requireAuth } from "~/utils/loaders.middleware";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { ResearchRequestsService, CreateResearchRequestData } from "~/services/research/researchRequests.server";
import { ResearchSuggestions } from "~/services/ai/researchSuggestions.server";
import { getUserInfo } from "~/utils/session.server";
import { DefaultFeatures } from "~/application/dtos/shared/DefaultFeatures";
import { getPlanFeaturesUsage } from "~/utils/services/.server/subscriptionService";
import { SubscriptionFeatureLimitType } from "~/application/enums/subscriptions/SubscriptionFeatureLimitType";
import CheckResearchRequestLimit from "~/components/core/settings/subscription/CheckResearchRequestLimit";

type LoaderData = {
  description: string;
  suggestions: ResearchSuggestions;
  researchRequestFeature: any;
  currentRequestsCount: number;
};

type SuggestionsResponse = {
  suggestions: ResearchSuggestions;
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  try {
    await requireAuth({ request, params });
    
    // Get the tenant ID and user ID
    const userInfo = await getUserInfo(request);
    const tenantId = await getTenantIdFromUrl(params);
    
    if (!userInfo.userId || !tenantId) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check subscription plan limits
    const planFeatures = await getPlanFeaturesUsage(tenantId);
    const researchRequestFeature = planFeatures.find(f => f.name === DefaultFeatures.ResearchRequests);
    console.log(`[CreateResearchRequestForm] Research request feature:`, researchRequestFeature);
    
    // Process form data for the request
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const subredditsJson = formData.get("subreddits") as string;
    const keywordsJson = formData.get("keywords") as string;
    const scheduleType = formData.get("schedule_type") as "daily" | "weekly" | "monthly";
    const minScore = parseInt(formData.get("min_score") as string) || 20;
    const minComments = parseInt(formData.get("min_comments") as string) || 5;
    const timeFilter = formData.get("time_filter") as string || "day";
    const sort = formData.get("sort") as string || "new";
    const limit = parseInt(formData.get("limit") as string) || 5;
    const commentsLimit = parseInt(formData.get("comments_limit") as string) || 5;
    
    try {
      const subreddits = JSON.parse(subredditsJson) as string[];
      const keywords = JSON.parse(keywordsJson) as string[];
      
      // Add validation logic if needed
      if (!name || !description || !subreddits.length || !keywords.length) {
        return json({ error: "All fields are required" }, { status: 400 });
      }
      
      // Create the request data
      const requestData: CreateResearchRequestData = {
        tenant_id: tenantId,
        created_by: userInfo.userId,
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
      
      console.log("Creating research request:", requestData);
      
      // Create the request
      const researchService = ResearchRequestsService.getInstance();
      const newRequest = await researchService.createRequest(requestData);
      
      if (!newRequest?.id) {
        return json({ error: "Failed to create research request" }, { status: 500 });
      }
      
      return redirect(`/app/${params.tenant}/dashboard/view/${newRequest.id}`);
    } catch (parseError) {
      console.error('Error parsing form data:', parseError);
      return json({ error: "Invalid form data format" }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in action:', error);
    return json({ error: "An unexpected error occurred" }, { status: 500 });
  }
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  const url = new URL(request.url);
  const description = url.searchParams.get("description");
  const suggestionsJson = url.searchParams.get("suggestions");

  if (!description) {
    return redirect(`/app/${params.tenant}/dashboard/create`);
  }

  let suggestions: ResearchSuggestions = {
    name: "",
    subreddits: [],
    keywords: []
  };

  if (suggestionsJson) {
    try {
      suggestions = JSON.parse(decodeURIComponent(suggestionsJson));
    } catch (error) {
      console.error('Error parsing suggestions:', error);
    }
  }

  const tenantId = await getTenantIdFromUrl(params);
  
  // Get the user's subscription plan features
  const planFeatures = await getPlanFeaturesUsage(tenantId);
  const researchRequestFeature = planFeatures.find(f => f.name === DefaultFeatures.ResearchRequests);
  
  // Get current research requests count
  const researchService = ResearchRequestsService.getInstance();
  const currentRequests = await researchService.getRequests(tenantId);
  
  return json({
    description,
    suggestions,
    researchRequestFeature,
    currentRequestsCount: currentRequests.data.length
  });
};

export default function CreateResearchRequestForm() {
  const { description, suggestions, researchRequestFeature } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const params = useParams();
  const suggestionsFetcher = useFetcher<SuggestionsResponse>();
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subreddits, setSubreddits] = useState<string[]>(suggestions.subreddits);
  const [keywords, setKeywords] = useState<string[]>(suggestions.keywords);
  const [name, setName] = useState(suggestions.name);
  const [newSubreddit, setNewSubreddit] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(true);
  const [minScore, setMinScore] = useState(50);
  const [minComments, setMinComments] = useState(5);
  const [limit, setLimit] = useState(5);

  // Fetch suggestions when component mounts
  useEffect(() => {
    if (description) {
      suggestionsFetcher.submit(
        { description },
        { method: "post", action: `/app/${params.tenant}/dashboard/create/suggestions` }
      );
    }
  }, [description]);

  // Update form when suggestions are received
  useEffect(() => {
    if (suggestionsFetcher.data?.suggestions) {
      const { name, subreddits, keywords } = suggestionsFetcher.data.suggestions;
      setName(name);
      setSubreddits(subreddits);
      setKeywords(keywords);
      setIsLoadingSuggestions(false);
    }
  }, [suggestionsFetcher.data]);

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

  // Set default dates for the date range
  const today = new Date();
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(today.getMonth() + 1);
  
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      
      // Validate required fields
      if (!formData.get('name') || !formData.get('description')) {
        setError('Name and description are required');
        setIsLoading(false);
        return;
      }

      const response = await fetch(window.location.pathname, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error submitting form:', errorText);
        setError('Failed to create research request. Please try again.');
        setIsLoading(false);
        return;
      }

      // If we get here, the request was successful
      navigate(`/app/${params.tenant}/dashboard`);
    } catch (err) {
      console.error('Error submitting form:', err);
      if (err instanceof Error) {
        setError(`Error: ${err.message}`);
      } else {
        setError('An unexpected error occurred while creating the research request. Please try again.');
      }
      setIsLoading(false);
    }
  };

  // Show upgrade modal if feature is not enabled
  useEffect(() => {
    if (researchRequestFeature && !researchRequestFeature.enabled) {
      setShowUpgradeModal(true);
    }
  }, [researchRequestFeature]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto pt-12 px-4 sm:px-6 lg:px-8">
        <CheckResearchRequestLimit feature={researchRequestFeature}>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create Research Request</h2>
              <button
                type="button"
                onClick={() => navigate(`/app/${params.tenant}/dashboard`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            </div>

            {isLoadingSuggestions ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-sm text-gray-600">Analyzing your request...</span>
              </div>
            ) : (
              <Form method="post" onSubmit={handleSubmit} className="space-y-6">
                {/* Description from previous step */}
                <input type="hidden" name="description" value={description} />

                {/* Request Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Request Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Suggested name based on your description. Feel free to modify it.
                  </p>
                </div>

                {/* Subreddits */}
                <div>
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
                    <input type="hidden" name="subreddits" value={JSON.stringify(subreddits)} />
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
                <div>
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
                    <input type="hidden" name="keywords" value={JSON.stringify(keywords)} />
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
                <div>
                  <label htmlFor="schedule_type" className="block text-sm font-medium text-gray-700">
                    Schedule Type
                  </label>
                  <select
                    id="schedule_type"
                    name="schedule_type"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* Min Score and Min Comments */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="min_score" className="block text-sm font-medium text-gray-700">
                      Minimum Score
                    </label>
                    <input
                      type="number"
                      name="min_score"
                      id="min_score"
                      value={minScore}
                      disabled
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm text-gray-500 text-sm"
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
                      value={minComments}
                      disabled
                      className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm text-gray-500 text-sm"
                    />
                  </div>
                </div>

                {/* Time Filter */}
                <div>
                  <label htmlFor="time_filter" className="block text-sm font-medium text-gray-700">
                    Time Filter
                  </label>
                  <select
                    id="time_filter"
                    name="time_filter"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                  >
                   
                    <option value="day">Past 24 Hours</option>
                    <option value="week">Past Week</option>
                    <option value="month">Past Month</option>
                   
                  </select>
                </div>

                {/* Sort Method */}
                <div>
                  <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
                    Sort Method
                  </label>
                  <select
                    id="sort"
                    name="sort"
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="hot">Hot</option>
                    <option value="top">Top</option>
                    <option value="new">New</option>
                    <option value="comments">Most Comments</option>
                  </select>
                </div>

                {/* Post Limit */}
                <div>
                  <label htmlFor="limit" className="block text-sm font-medium text-gray-700">
                    Maximum Posts
                  </label>
                  <input
                    type="number"
                    name="limit"
                    id="limit"
                    value={limit}
                    disabled
                    className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm text-gray-500 text-sm"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/app/${params.tenant}/dashboard/create`)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  >
                    Back to Description
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Request'
                    )}
                  </button>
                </div>
              </Form>
            )}

            {error && (
              <div className="mt-4 p-4 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </CheckResearchRequestLimit>
      </div>
    </div>
  );
} 