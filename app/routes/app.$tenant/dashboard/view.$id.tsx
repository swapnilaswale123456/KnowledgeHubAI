import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { requireAuth } from "~/utils/loaders.middleware";
import { useState } from "react";
import RequestForm from "~/components/research/RequestForm";

interface RedditRequest {
  id: string;
  name: string;
  purpose: string;
  subreddits: string[];
  keywords: string[];
  duration: 'day' | 'week' | 'month';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
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

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  
  // Mock data - Replace with actual API/DB call
  const request_data: RedditRequest = {
    id: params.id || "1",
    name: "SaaS AI Prospects",
    purpose: "Identify users interested in or seeking SaaS AI products to understand their needs and potentially offer relevant solutions.",
    subreddits: ["SaaS"],
    keywords: [
      "SaaS AI", "AI software", "AI solutions", "SaaS tools", "AI platform",
      "AI integration", "machine learning SaaS", "AI automation", "AI SaaS pricing",
      "SaaS AI benefits", "AI SaaS demo", "AI SaaS challenges", "AI SaaS reviews",
      "AI SaaS comparison", "AI SaaS implementation"
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
  };

  return json({ request: request_data });
};

export default function ViewRequest() {
  const { request } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const params = useParams();
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <RequestForm
        mode="edit"
        initialData={{
          name: request.name,
          purpose: request.purpose,
          subreddits: request.subreddits,
          keywords: request.keywords,
          duration: request.duration,
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
                <button className="px-3 py-1.5 text-xs border-2 border-red-100 rounded-lg text-red-600 hover:bg-red-50 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                <button className="px-3 py-1.5 text-xs border-2 border-gray-200 rounded-lg hover:bg-gray-50 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
                <button className="px-3 py-1.5 text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700 flex items-center shadow-sm">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  Execute Request
                </button>
              </div>
            </div>

            {request.status === 'completed' && (
              <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-xs font-semibold text-green-800">Completed</span>
                    <span className="text-xs text-green-600">{new Date(request.createdAt).toLocaleString()}</span>
                  </div>
                  <button className="px-3 py-1.5 text-xs bg-white border-2 border-green-200 rounded-lg hover:bg-green-50 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 