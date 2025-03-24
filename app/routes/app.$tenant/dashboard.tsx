import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useParams, Outlet, useLocation, useLoaderData, useNavigate } from "@remix-run/react";
import { getTranslations } from "~/locale/i18next.server";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { useTranslation } from "react-i18next";
import ServerError from "~/components/ui/errors/ServerError";
import { serverTimingHeaders } from "~/modules/metrics/utils/defaultHeaders.server";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { getTenant } from "~/utils/db/tenants.db.server";
import { requireAuth } from "~/utils/loaders.middleware";
import { useState } from "react";

export { serverTimingHeaders as headers };

// Types for the Reddit AI Agent system
interface RedditRequest {
  id: string;
  name: string;
  purpose: string;
  subreddits: string[];
  keywords: string[];
  duration: 'day' | 'week' | 'month';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    lastRun: string;
    nextRun: string;
  };
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
}

type LoaderData = {
  title: string;
  tenant: any;
  requests: RedditRequest[];
};

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "app.$tenant.dashboard");
  let { t } = await time(getTranslations(request), "getTranslations");
  const tenantId = await time(getTenantIdFromUrl(params), "getTenantIdFromUrl");
  const tenant = await time(getTenant(tenantId), "getTenant");

  // Test request data
  const requests: RedditRequest[] = [{
    id: "1",
    name: "SaaS AI Prospects",
    purpose: "Identify users interested in or seeking SaaS AI products to understand their needs and potentially offer relevant solutions.",
    subreddits: ["SaaS"],
    keywords: [
      "SaaS AI",
      "AI software",
      "AI solutions",
      "SaaS tools",
      "AI platform",
      "AI integration",
      "machine learning SaaS",
      "AI automation",
      "AI SaaS pricing",
      "SaaS AI benefits",
      "AI SaaS demo",
      "AI SaaS challenges",
      "AI SaaS reviews",
      "AI SaaS comparison",
      "AI SaaS implementation"
    ],
    duration: "day",
    status: "completed",
    createdAt: "2024-03-19T10:34:39",
    results: {
      postsAnalyzed: 150,
      relevantPosts: 45,
      sentimentBreakdown: {
        positive: 60,
        neutral: 30,
        negative: 10
      },
      downloadUrl: "#"
    }
  }];

  return json(
    { 
      title: "AI Research Hub",
      tenant,
      requests 
    }, 
    { headers: getServerTimingHeader() }
  );
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [{ title: data?.title }];

export default function DashboardRoute() {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { requests } = useLoaderData<typeof loader>();
  const isChildRoute = location.pathname.includes('/create') || location.pathname.includes('/file');
  
  const [selectedRequest, setSelectedRequest] = useState<RedditRequest | null>(requests[0] || null);

  if (isChildRoute) {
    return <Outlet />;
  }

  // If there are no requests, show the empty state
  if (requests.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Top Navigation Bar */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">Research Hub</span>
                </div>
                <div className="h-6 w-px bg-gray-200"></div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded">System: Active</span>
                  <span className="px-2 py-1 bg-gray-100 rounded">UTC</span>
                </div>
              </div>
              <button
                onClick={() => navigate(`/app/${params.tenant}/dashboard/create`)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Research
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="mt-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v20c0 4.418 7.163 8 16 8s16-3.582 16-8V14M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m0-4c0 4.418-7.163 8-16 8S8 28.418 8 24v-4" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No Research Requests Yet</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first research request.</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate(`/app/${params.tenant}/dashboard/create`)}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Start Your First Research
                </button>
              </div>
            </div>

            {/* Quick Start Guide */}
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Define Your Search</h3>
                <p className="mt-2 text-sm text-gray-500">Specify subreddits and keywords to target your research effectively.</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Collect Data</h3>
                <p className="mt-2 text-sm text-gray-500">Our AI analyzes Reddit content to find relevant discussions and insights.</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Get Insights</h3>
                <p className="mt-2 text-sm text-gray-500">Review analyzed data with sentiment analysis and key trends.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular view with requests
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Left Sidebar - Request Management */}
      <div className="w-72 border-r bg-white/80 backdrop-blur-sm">
        <div className="p-4">
          <button 
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl py-2.5 px-4 flex items-center justify-center space-x-2 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            onClick={() => navigate(`/app/${params.tenant}/dashboard/create`)}
          >
            <span className="text-lg font-bold">+</span>
            <span className="text-sm font-small">New Research Request</span>
          </button>
        </div>
        <div className="overflow-y-auto">
          {requests.map((request) => (
            <div
              key={request.id}
              onClick={() => {
                setSelectedRequest(request);
                navigate(`/app/${params.tenant}/dashboard/view/${request.id}`);
              }}
              className={`p-4 cursor-pointer transition-all duration-200 border-l-4 ${
                selectedRequest?.id === request.id 
                ? 'bg-purple-50 border-purple-600' 
                : 'hover:bg-gray-50 border-transparent'
              }`}
            >
              <h3 className="font-semibold text-gray-900 text-sm">{request.name}</h3>
              <div className="flex items-center space-x-2 mt-1.5">
                <span className={`w-2 h-2 rounded-full ${
                  request.status === 'completed' ? 'bg-green-500' :
                  request.status === 'in_progress' ? 'bg-blue-500' :
                  request.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                } shadow-sm`}></span>
                <span className="text-xs text-gray-600 capitalize">{request.status}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(request.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return <ServerError />;
}
