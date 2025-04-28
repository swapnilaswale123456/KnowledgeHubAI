import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useParams, Outlet, useLocation, useLoaderData, useNavigate, Link, useFetcher } from "@remix-run/react";
import { getTranslations } from "~/locale/i18next.server";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { useTranslation } from "react-i18next";
import ServerError from "~/components/ui/errors/ServerError";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { getTenant } from "~/utils/db/tenants.db.server";
import { requireAuth } from "~/utils/loaders.middleware";
import { useState, useEffect, useMemo } from "react";
import { ResearchRequestsService, ResearchRequest } from "~/services/research/researchRequests.server";
import { PlusIcon } from "@heroicons/react/24/outline";
import Logo from "~/components/brand/Logo";

export { serverTimingHeaders as headers };

type LoaderData = {
  title: string; 
  tenant: any;
  requests: ResearchRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.dashboard");
  let { t } = await time(getTranslations(request), "getTranslations");
  const tenantId = await time(getTenantIdFromUrl(params), "getTenantIdFromUrl");
  const tenant = await time(getTenant(tenantId), "getTenant");
  
  // Get the page and limit from URL params
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);

  console.log(`[dashboard.loader] Fetching research requests for tenant ${tenantId}, page ${page}, limit ${limit}`);

  // Get research requests using the service
  const researchService = ResearchRequestsService.getInstance();
  try {
    const requestsResponse = await time(
      researchService.getRequests(tenantId, page, limit),
      "getResearchRequests"
    );

    console.log(`[dashboard.loader] Successfully fetched ${requestsResponse.data.length} research requests`);
    
    return json(
      { 
        title: "Reddit Research Hub",
        tenant,
        requests: requestsResponse.data,
        pagination: requestsResponse.pagination
      }, 
      { headers: getServerTimingHeader() }
    );
  } catch (error) {
    console.error(`[dashboard.loader] Error fetching research requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Return an empty list if there's an error, but don't break the page
    return json(
      { 
        title: "Reddit Research Hub",
        tenant,
        requests: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      }, 
      { headers: getServerTimingHeader() }
    );
  }
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [{ title: data?.title }];

export default function DashboardRoute() {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const { requests, pagination } = useLoaderData<typeof loader>();
  const isChildRoute = location.pathname.includes('/create') || 
                      location.pathname.includes('/view/') ||
                      location.pathname.includes('/edit/') ||
                      location.pathname.includes('/diagnostics');
  
  const [selectedRequest, setSelectedRequest] = useState<ResearchRequest | null>(requests[0] || null);
  const [currentPage, setCurrentPage] = useState(pagination?.page || 1);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    setCurrentPage(newPage);
    navigate(`/app/${params.tenant}/dashboard?page=${newPage}&limit=${pagination.limit}`);
  };

  // Filter requests based on time range
  const filteredRequests = useMemo(() => {
    const now = new Date();
    const timeRanges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    return requests.filter(request => {
      const requestDate = new Date(request.createdAt);
      const timeDiff = now.getTime() - requestDate.getTime();
      return timeDiff <= timeRanges[timeRange];
    });
  }, [requests, timeRange]);

  // Calculate metrics based on filtered requests
  const metrics = useMemo(() => ({
    totalRequests: filteredRequests.length,
    activeRequests: filteredRequests.filter(r => r.status === 'in_progress').length,
    completedRequests: filteredRequests.filter(r => r.status === 'completed').length,
    totalSubreddits: [...new Set(filteredRequests.flatMap(r => r.subreddits))].length,
    averageSentiment: filteredRequests.reduce((acc, req) => {
      if (req.results?.sentimentBreakdown) {
        const { positive, neutral, negative } = req.results.sentimentBreakdown;
        const total = positive + neutral + negative;
        if (total > 0) {
          return acc + (positive / total);
        }
      }
      return acc;
    }, 0) / filteredRequests.filter(r => r.results?.sentimentBreakdown).length || 0,
    topSubreddits: [...new Set(filteredRequests.flatMap(r => r.subreddits))]
      .map(subreddit => ({
        name: subreddit,
        count: filteredRequests.filter(r => r.subreddits.includes(subreddit)).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(s => s.name)
  }), [filteredRequests]);

  if (isChildRoute) {
    return <Outlet />;
  }

  // If there are no requests, show the empty state
  if (requests.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
        {/* Top Navigation Bar */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-6">
                <Logo size="lg" />
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    System Active
                  </span>
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    UTC
                  </span>
                  <Link 
                    to={`/app/${params.tenant}/dashboard/diagnostics`}
                    className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-medium rounded-full hover:bg-gray-100 transition-colors"
                  >
                    Diagnostics
                  </Link>
                </div>
              </div>
              <Link
                to={`/app/${params.tenant}/dashboard/create`}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF4500] to-[#FF8B00] rounded-lg shadow-lg shadow-[#FF4500]/20 hover:shadow-xl hover:shadow-[#FF4500]/30 transition-all duration-200 hover:from-[#FF4500] hover:to-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Create New Research
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-r from-[#FF4500]/10 to-[#FF8B00]/10 rounded-full animate-pulse"></div>
                </div>
                <div className="relative">
                  <svg className="mx-auto h-24 w-24 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v20c0 4.418 7.163 8 16 8s16-3.582 16-8V14M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24v-4" />
                  </svg>
                </div>
              </div>
              <h3 className="mt-8 text-2xl font-bold text-gray-900">Welcome to Reddit Research Hub</h3>
              <p className="mt-2 text-lg text-gray-500">Start analyzing Reddit discussions and gain valuable insights</p>
              <div className="mt-8">
                <Link
                  to={`/app/${params.tenant}/dashboard/create`}
                  className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-gradient-to-r from-[#FF4500] to-[#FF8B00] rounded-lg shadow-lg shadow-[#FF4500]/20 hover:shadow-xl hover:shadow-[#FF4500]/30 transition-all duration-200 hover:from-[#FF4500] hover:to-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
                >
                  <PlusIcon className="-ml-1 mr-2 h-6 w-6" aria-hidden="true" />
                  Start Your First Research
                </Link>
              </div>
            </div>

            {/* Quick Start Guide */}
            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group bg-white rounded-2xl shadow-sm p-8 hover:shadow-lg transition-all duration-200 border border-gray-100">
                <div className="w-14 h-14 bg-[#FF4500]/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-7 h-7 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Define Your Research</h3>
                <p className="text-gray-600 leading-relaxed">
                  Choose subreddits and keywords to target your research. Our AI helps you find the most relevant discussions.
                </p>
              </div>
              <div className="group bg-white rounded-2xl shadow-sm p-8 hover:shadow-lg transition-all duration-200 border border-gray-100">
                <div className="w-14 h-14 bg-[#FF4500]/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-7 h-7 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Monitor Discussions</h3>
                <p className="text-gray-600 leading-relaxed">
                  Track real-time discussions, analyze sentiment, and identify trending topics in your target subreddits.
                </p>
              </div>
              <div className="group bg-white rounded-2xl shadow-sm p-8 hover:shadow-lg transition-all duration-200 border border-gray-100">
                <div className="w-14 h-14 bg-[#FF4500]/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-7 h-7 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Get Insights</h3>
                <p className="text-gray-600 leading-relaxed">
                  Generate comprehensive reports with sentiment analysis, key trends, and actionable insights.
                </p>
              </div>
            </div>

            {/* Features Overview */}
            <div className="mt-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Key Features</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-[#FF4500]/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Real-time Monitoring</h4>
                  <p className="text-sm text-gray-600">Track discussions and trends as they happen</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-[#FF4500]/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Sentiment Analysis</h4>
                  <p className="text-sm text-gray-600">Understand community sentiment and reactions</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-[#FF4500]/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Trend Detection</h4>
                  <p className="text-sm text-gray-600">Identify emerging topics and patterns</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="w-12 h-12 bg-[#FF4500]/10 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Custom Reports</h4>
                  <p className="text-sm text-gray-600">Generate detailed research reports</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular view with requests
  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Left Sidebar - Request Management */}
      <div className="w-full lg:w-64 border-b lg:border-r bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="p-3 space-y-2">
          <Link
            to={`/app/${params.tenant}/dashboard/create`}
            className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#FF4500] to-[#FF8B00] rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:from-[#FF4500] hover:to-[#FF6B00] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
          >
            <PlusIcon className="-ml-1 mr-2 h-4 w-4" aria-hidden="true" />
            New Research
          </Link>
          <Link
            to={`/app/${params.tenant}/dashboard/create/template`}
            className="w-full inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-[#FF4500] bg-[#FF4500]/10 rounded-lg hover:bg-[#FF4500]/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            Use Template
          </Link>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-4rem)]">
          {requests.map((request) => (
            <div
              key={request.id}
              onClick={() => {
                setSelectedRequest(request);
                navigate(`/app/${params.tenant}/dashboard/view/${request.id}`);
              }}
              className={`p-3 cursor-pointer transition-all duration-200 hover:bg-gray-50/80 ${
                selectedRequest?.id === request.id 
                ? 'bg-gradient-to-r from-[#FF4500]/10 to-[#FF8B00]/10' 
                : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">{request.name}</h3>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      request.status === 'completed' ? 'bg-green-500' :
                      request.status === 'in_progress' ? 'bg-blue-500' :
                      request.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                    } shadow-sm`}></span>
                    <span className="text-xs text-gray-600 capitalize">{request.status}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(request.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="p-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-600">
                  {currentPage}/{pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Show this when no child route is active */}
        {!location.pathname.includes('/view/') && 
         !location.pathname.includes('/create/describe') && 
         !location.pathname.includes('/create/form') && 
         !location.pathname.includes('/edit/') && (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-[#FF4500] to-[#FF8B00] rounded-xl p-4 sm:p-6 shadow-lg shadow-[#FF4500]/20">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    Welcome to Reddit Research Hub
                  </h1>
                  <p className="text-white/90 mt-1 text-sm sm:text-base">
                    Monitor and analyze Reddit discussions to gain valuable insights
                  </p>
                </div>
                <div className="h-12 w-12 sm:h-14 sm:w-14 bg-white/10 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Time Range Selector */}
            <div className="mt-4 flex justify-end">
              <div className="inline-flex rounded-lg shadow-sm">
                <button
                  onClick={() => setTimeRange('24h')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                    timeRange === '24h'
                      ? 'bg-[#FF4500] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  24h
                </button>
                <button
                  onClick={() => setTimeRange('7d')}
                  className={`px-4 py-2 text-sm font-medium ${
                    timeRange === '7d'
                      ? 'bg-[#FF4500] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  7d
                </button>
                <button
                  onClick={() => setTimeRange('30d')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                    timeRange === '30d'
                      ? 'bg-[#FF4500] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  30d
                </button>
              </div>
            </div>
            
            {/* Stats Overview */}
            <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Total Requests</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">{metrics.totalRequests}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">All time research requests</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-[#FF4500]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-5 h-5 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Active Requests</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
                      {metrics.activeRequests}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Currently running research</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Monitored Subreddits</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5">
                      {metrics.totalSubreddits}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">Active subreddit monitoring</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-[#FF4500]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <svg className="w-5 h-5 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            
            
            
            {/* Recent Requests Table */}
            <div className="mt-4 sm:mt-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Recent Requests</h2>
                <Link
                  to={`/app/${params.tenant}/dashboard/create`}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-[#FF4500] bg-[#FF4500]/10 rounded-lg hover:bg-[#FF4500]/20 transition-colors"
                >
                  Create New Request
                  <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.slice(0, 5).map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#FF4500]/10 to-[#FF8B00]/10 flex items-center justify-center">
                                  <svg className="w-4 h-4 text-[#FF4500]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-xs sm:text-sm font-medium text-gray-900">{request.name}</div>
                                <div className="text-xs text-gray-500">Research Request</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              request.status === 'completed' ? 'bg-green-100 text-green-800' : 
                              request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              request.status === 'failed' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                            <a 
                              onClick={() => navigate(`/app/${params.tenant}/dashboard/view/${request.id}`)}
                              className="text-[#FF4500] hover:text-[#FF6B00] cursor-pointer transition-colors inline-flex items-center"
                            >
                              View Details
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <Outlet />
      </div>
      </div>
    );
}

export function ErrorBoundary() {
  return <ServerError />;
}
