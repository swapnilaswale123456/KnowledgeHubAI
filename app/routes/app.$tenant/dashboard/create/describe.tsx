import { useNavigate, useParams } from "@remix-run/react";
import { useState, KeyboardEvent } from "react";

export default function DescribeResearchRequest() {
  const navigate = useNavigate();
  const params = useParams();
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (description.trim()) {
      // Navigate to the create form with the description as a query parameter
      navigate(`/app/${params.tenant}/dashboard/create/form?description=${encodeURIComponent(description)}`);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-3xl mx-auto pt-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create Find Request</h1>
          <p className="text-xl text-gray-600">
            Describe who you want to find, and we'll help you set it up
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              <div className="h-8 w-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-grow relative">
              <textarea
                className="w-full h-32 p-4 text-lg text-gray-900 border-0 focus:ring-0 placeholder-gray-400 bg-transparent resize-none"
                placeholder="Describe your search request and who you want to find... (e.g., 'I want to analyze insurance industry trends from Reddit in the last month')"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <div className="absolute bottom-2 right-2">
                <button
                  onClick={handleSubmit}
                  disabled={!description.trim()}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
                    description.trim()
                      ? 'text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-sm hover:shadow'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <span className="mr-2">Continue</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-4">Press Enter to continue, Shift + Enter for new line</h3>
            
            {/* Quick Start Examples */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Example Prompts</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Find discussions about AI tools in startup communities</li>
                  <li>• Analyze customer feedback for SaaS products</li>
                  <li>• Track mentions of specific tech products</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Tips</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Be specific about your target audience</li>
                  <li>• Include relevant timeframes</li>
                  <li>• Mention specific subreddits if known</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 