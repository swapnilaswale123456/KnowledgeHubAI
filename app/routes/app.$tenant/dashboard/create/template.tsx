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
        <div className="bg-gradient-to-r from-[#FF4500] to-[#FF8B00] rounded-xl p-4 sm:p-5 mb-4 sm:mb-6 shadow-lg shadow-[#FF4500]/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Create Reddit Research Request</h1>
              <p className="mt-1 text-[#FF4500]/90 text-sm">
                Choose a template to analyze Reddit discussions, trends, and insights
              </p>
            </div>
            <Link
              to={`/app/${tenant}/dashboard/create`}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-[#FF4500] bg-white rounded-lg hover:bg-[#FF4500]/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200"
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
          {/* Reddit Market Research Template */}
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4500]/10 to-[#FF8B00]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reddit Market Research</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Track Reddit discussions about industry trends and market sentiment
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-[#FF4500]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track trending subreddits and topics
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Monitor Reddit community sentiment
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Analyze Reddit engagement patterns
                </div>
              </div>
              <button
                onClick={() => handleTemplateSelect({
                  id: "market-research",
                  name: "Reddit Market Research Analysis",
                  description: "Track Reddit discussions about industry trends and market sentiment",
                  category: "market-research",
                  config: {
                    subreddits: ["business", "entrepreneur", "startups", "marketing", "smallbusiness"],
                    keywords: ["market trends", "industry analysis", "competition", "market size", "growth"],
                    min_score: 10,
                    min_comments: 5,
                    schedule_type: "weekly"
                  }
                })}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF4500] to-[#FF8B00] rounded-lg hover:from-[#FF4500] hover:to-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500] shadow-sm hover:shadow-md transition-all duration-200"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Reddit Product Feedback Template */}
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4500]/10 to-[#FF8B00]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reddit Product Feedback</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Monitor Reddit discussions about product reviews and user experiences
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-[#FF4500]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track Reddit product reviews
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Monitor feature requests in Reddit
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track Reddit bug reports
                </div>
              </div>
              <button
                onClick={() => handleTemplateSelect({
                  id: "product-feedback",
                  name: "Reddit Product Feedback Analysis",
                  description: "Monitor Reddit discussions about product reviews and user experiences",
                  category: "product-feedback",
                  config: {
                    subreddits: ["productreviews", "userexperience", "software", "techsupport", "gadgets"],
                    keywords: ["product review", "user feedback", "feature request", "bug report", "improvement"],
                    min_score: 5,
                    min_comments: 3,
                    schedule_type: "daily"
                  }
                })}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF4500] to-[#FF8B00] rounded-lg hover:from-[#FF4500] hover:to-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500] shadow-sm hover:shadow-md transition-all duration-200"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Reddit Brand Monitoring Template */}
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4500]/10 to-[#FF8B00]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reddit Brand Monitoring</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Track brand mentions and sentiment across Reddit communities
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-[#FF4500]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track brand mentions in Reddit
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Monitor Reddit sentiment analysis
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track Reddit brand reputation
                </div>
              </div>
              <button
                onClick={() => handleTemplateSelect({
                  id: "brand-monitoring",
                  name: "Reddit Brand Monitoring Analysis",
                  description: "Track brand mentions and sentiment across Reddit communities",
                  category: "brand-monitoring",
                  config: {
                    subreddits: ["marketing", "branding", "socialmedia", "publicrelations", "business"],
                    keywords: ["brand mention", "brand sentiment", "public perception", "brand reputation"],
                    min_score: 8,
                    min_comments: 4,
                    schedule_type: "daily"
                  }
                })}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF4500] to-[#FF8B00] rounded-lg hover:from-[#FF4500] hover:to-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500] shadow-sm hover:shadow-md transition-all duration-200"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Reddit Competitor Analysis Template */}
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4500]/10 to-[#FF8B00]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reddit Competitor Analysis</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Monitor competitor discussions and activities on Reddit
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-[#FF4500]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track competitor mentions on Reddit
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Monitor Reddit pricing discussions
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track Reddit market share discussions
                </div>
              </div>
              <button
                onClick={() => handleTemplateSelect({
                  id: "competitor-analysis",
                  name: "Reddit Competitor Analysis",
                  description: "Monitor competitor discussions and activities on Reddit",
                  category: "competitor-analysis",
                  config: {
                    subreddits: ["business", "marketing", "entrepreneur", "startups", "smallbusiness"],
                    keywords: ["competitor", "market share", "pricing", "product launch", "strategy"],
                    min_score: 15,
                    min_comments: 8,
                    schedule_type: "daily"
                  }
                })}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF4500] to-[#FF8B00] rounded-lg hover:from-[#FF4500] hover:to-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500] shadow-sm hover:shadow-md transition-all duration-200"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Reddit Industry Trends Template */}
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4500]/10 to-[#FF8B00]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reddit Industry Trends</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Track emerging trends and discussions across Reddit communities
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-[#FF4500]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track trending Reddit topics
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Monitor Reddit innovation discussions
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track Reddit regulatory discussions
                </div>
              </div>
              <button
                onClick={() => handleTemplateSelect({
                  id: "industry-trends",
                  name: "Reddit Industry Trends Analysis",
                  description: "Track emerging trends and discussions across Reddit communities",
                  category: "industry-trends",
                  config: {
                    subreddits: ["technology", "business", "innovation", "futurology", "science"],
                    keywords: ["trend", "innovation", "technology", "development", "future"],
                    min_score: 12,
                    min_comments: 6,
                    schedule_type: "weekly"
                  }
                })}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF4500] to-[#FF8B00] rounded-lg hover:from-[#FF4500] hover:to-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500] shadow-sm hover:shadow-md transition-all duration-200"
              >
                Use Template
              </button>
            </div>
          </div>

          {/* Reddit Customer Insights Template */}
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4500]/10 to-[#FF8B00]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reddit Customer Insights</h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Analyze customer behavior and preferences from Reddit discussions
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-[#FF4500]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track Reddit user behavior
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Monitor Reddit pain points
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Track Reddit user preferences
                </div>
              </div>
              <button
                onClick={() => handleTemplateSelect({
                  id: "customer-insights",
                  name: "Reddit Customer Insights Analysis",
                  description: "Analyze customer behavior and preferences from Reddit discussions",
                  category: "customer-insights",
                  config: {
                    subreddits: ["customerservice", "userexperience", "productreviews", "consumer", "shopping"],
                    keywords: ["customer", "user experience", "preference", "behavior", "pain point"],
                    min_score: 8,
                    min_comments: 4,
                    schedule_type: "weekly"
                  }
                })}
                className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF4500] to-[#FF8B00] rounded-lg hover:from-[#FF4500] hover:to-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500] shadow-sm hover:shadow-md transition-all duration-200"
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