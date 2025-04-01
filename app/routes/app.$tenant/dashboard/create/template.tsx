import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useNavigate, useParams, useFetcher } from "@remix-run/react";
import { requireAuth } from "~/utils/loaders.middleware";
import ResearchTemplates from "~/components/research/ResearchTemplates";
import { ResearchRequestsService, CreateResearchRequestData } from "~/services/research/researchRequests.server";
import { useState, useEffect } from "react";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { Link } from "@remix-run/react";

interface ResearchTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: {
    subreddits: string[];
    keywords: string[];
    min_score: number;
    min_comments: number;
    schedule_type: 'daily' | 'weekly' | 'monthly';
    additional_settings?: Record<string, any>;
  };
}

interface ActionData {
  success?: boolean;
  requestId?: string;
  error?: string;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  return json({});
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireAuth({ request, params });
  const formData = await request.formData();
  const tenant = params.tenant;
  const tenantId = await getTenantIdFromUrl(params);
  if (!tenantId) {
    return json({ error: "Tenant ID is required" }, { status: 400 });
  }

  try {
    const researchService = ResearchRequestsService.getInstance();
    
    // Log the form data for debugging
    console.log('Form data received:', {
      name: formData.get("name"),
      description: formData.get("description"),
      tenant_id: tenantId,
      subreddits: formData.get("subreddits"),
      keywords: formData.get("keywords"),
      min_score: formData.get("min_score"),
      min_comments: formData.get("min_comments"),
      schedule_type: formData.get("schedule_type"),
      created_by: formData.get("created_by"),
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date")
    });

    // Validate required fields
    const requiredFields = ["name", "description", "subreddits", "keywords", "min_score", "min_comments", "schedule_type"];
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Parse and validate JSON fields
    let subreddits: string[];
    let keywords: string[];
    try {
      subreddits = JSON.parse(formData.get("subreddits") as string);
      if (!Array.isArray(subreddits)) {
        throw new Error("subreddits must be an array");
      }
    } catch (e) {
      throw new Error(`Invalid subreddits format: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    try {
      keywords = JSON.parse(formData.get("keywords") as string);
      if (!Array.isArray(keywords)) {
        throw new Error("keywords must be an array");
      }
    } catch (e) {
      throw new Error(`Invalid keywords format: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    // Create a new research request based on the template
    const requestData: CreateResearchRequestData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      tenant_id: tenantId,
      subreddits,
      keywords,
      min_score: Number(formData.get("min_score")),
      min_comments: Number(formData.get("min_comments")),
      schedule_type: formData.get("schedule_type") as 'daily' | 'weekly' | 'monthly',
      created_by: formData.get("created_by") as string,
      date_range: {
        start_date: formData.get("start_date") as string,
        end_date: formData.get("end_date") as string
      }
    };

    // Log the request data before sending
    console.log('Sending request data:', requestData);

    const newRequest = await researchService.createRequest(requestData);

    if (!newRequest?.id) {
      throw new Error("Failed to create research request: No ID returned");
    }

    return json({ success: true, requestId: newRequest.id });
  } catch (error) {
    console.error('Error creating research request:', error);
    return json(
      { 
        error: error instanceof Error 
          ? error.message 
          : "Failed to create research request",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
};

export default function CreateFromTemplate() {
  const navigate = useNavigate();
  const { tenant } = useParams();
  const fetcher = useFetcher<ActionData>();
  const [error, setError] = useState<string | null>(null);

  const handleTemplateSelect = async (template: ResearchTemplate) => {
    if (!tenant) {
      setError("Tenant ID is required");
      return;
    }

    const formData = new FormData();
    formData.append("name", template.name);
    formData.append("description", template.description);
    formData.append("subreddits", JSON.stringify(template.config.subreddits));
    formData.append("keywords", JSON.stringify(template.config.keywords));
    formData.append("min_score", template.config.min_score.toString());
    formData.append("min_comments", template.config.min_comments.toString());
    formData.append("schedule_type", template.config.schedule_type);
    formData.append("created_by", "system");
    formData.append("start_date", new Date().toISOString());
    formData.append("end_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

    fetcher.submit(formData, { method: "post" });
  };

  // Handle fetcher state changes in useEffect
  useEffect(() => {
    if (fetcher.data?.error) {
      setError(fetcher.data.error);
    } else if (fetcher.data?.success && fetcher.data?.requestId) {
      navigate(`/app/${tenant}/dashboard/view/${fetcher.data.requestId}`);
    }
  }, [fetcher.data, navigate, tenant]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header Section with Gradient Background */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-lg shadow-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Create Research Request</h1>
              <p className="mt-1 text-purple-100 text-sm">
                Choose a template to quickly set up your research request
              </p>
            </div>
            <Link
              to={`/app/${tenant}/dashboard/create`}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 bg-white rounded-lg hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
            >
              Create Custom
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-1 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Template Categories with Enhanced Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Market Research Template */}
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Market Research</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Track industry trends, competitor mentions, and market sentiment
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Weekly market trend analysis
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Competitor strategy monitoring
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Industry sentiment tracking
                </div>
              </div>
              <button
                onClick={() => handleTemplateSelect({
                  id: "market-research",
                  name: "Market Research Analysis",
                  description: "Track industry trends and market sentiment",
                  category: "market-research",
                  config: {
                    subreddits: ["business", "entrepreneur", "startups", "marketing", "smallbusiness"],
                    keywords: ["market trends", "industry analysis", "competition", "market size", "growth"],
                    min_score: 10,
                    min_comments: 5,
                    schedule_type: "weekly"
                  }
                })}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md transition-all duration-200"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Product Feedback Template */}
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Product Feedback</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Monitor product reviews, feature requests, and user feedback
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Real-time user feedback analysis
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Feature request prioritization
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Bug report tracking
                </div>
              </div>
              <button
                onClick={() => handleTemplateSelect({
                  id: "product-feedback",
                  name: "Product Feedback Analysis",
                  description: "Monitor product reviews and user feedback",
                  category: "product-feedback",
                  config: {
                    subreddits: ["productreviews", "userexperience", "software", "techsupport", "gadgets"],
                    keywords: ["product review", "user feedback", "feature request", "bug report", "improvement"],
                    min_score: 5,
                    min_comments: 3,
                    schedule_type: "daily"
                  }
                })}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md transition-all duration-200"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Brand Monitoring Template */}
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Brand Monitoring</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Track brand mentions, sentiment, and public perception
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Brand mention tracking
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sentiment analysis
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Crisis monitoring
                </div>
              </div>
              <button
                onClick={() => handleTemplateSelect({
                  id: "brand-monitoring",
                  name: "Brand Monitoring Analysis",
                  description: "Track brand mentions and sentiment",
                  category: "brand-monitoring",
                  config: {
                    subreddits: ["marketing", "branding", "socialmedia", "publicrelations", "business"],
                    keywords: ["brand mention", "brand sentiment", "public perception", "brand reputation"],
                    min_score: 8,
                    min_comments: 4,
                    schedule_type: "daily"
                  }
                })}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md transition-all duration-200"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Competitor Analysis Template */}
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Competitor Analysis</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Monitor competitor activities, pricing, and market positioning
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Competitor product launches
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Pricing strategy analysis
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Market share tracking
                </div>
              </div>
              <button
                onClick={() => handleTemplateSelect({
                  id: "competitor-analysis",
                  name: "Competitor Analysis",
                  description: "Monitor competitor activities and market positioning",
                  category: "competitor-analysis",
                  config: {
                    subreddits: ["business", "marketing", "entrepreneur", "startups", "smallbusiness"],
                    keywords: ["competitor", "market share", "pricing", "product launch", "strategy"],
                    min_score: 15,
                    min_comments: 8,
                    schedule_type: "daily"
                  }
                })}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-red-600 rounded-lg hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md transition-all duration-200"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Industry Trends Template */}
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Industry Trends</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Track emerging trends, technologies, and industry developments
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-teal-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Emerging technology tracking
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Industry innovation monitoring
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Regulatory changes tracking
                </div>
              </div>
              <button
                onClick={() => handleTemplateSelect({
                  id: "industry-trends",
                  name: "Industry Trends Analysis",
                  description: "Track emerging trends and industry developments",
                  category: "industry-trends",
                  config: {
                    subreddits: ["technology", "business", "innovation", "futurology", "science"],
                    keywords: ["trend", "innovation", "technology", "development", "future"],
                    min_score: 12,
                    min_comments: 6,
                    schedule_type: "weekly"
                  }
                })}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg hover:from-teal-700 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md transition-all duration-200"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Customer Insights Template */}
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-50 to-rose-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Customer Insights</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Analyze customer behavior, preferences, and pain points
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-pink-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Customer behavior analysis
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Pain point identification
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Preference tracking
                </div>
              </div>
              <button
                onClick={() => handleTemplateSelect({
                  id: "customer-insights",
                  name: "Customer Insights Analysis",
                  description: "Analyze customer behavior and preferences",
                  category: "customer-insights",
                  config: {
                    subreddits: ["customerservice", "userexperience", "productreviews", "consumer", "shopping"],
                    keywords: ["customer", "user experience", "preference", "behavior", "pain point"],
                    min_score: 8,
                    min_comments: 4,
                    schedule_type: "weekly"
                  }
                })}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-600 to-rose-600 rounded-lg hover:from-pink-700 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm hover:shadow-md transition-all duration-200"
              >
                Use Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 