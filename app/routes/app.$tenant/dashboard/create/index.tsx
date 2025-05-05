import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useNavigate, useParams, useFetcher } from "@remix-run/react";
import { useState, KeyboardEvent, useEffect } from "react";
import { requireAuth } from "~/utils/loaders.middleware";
import { ResearchSuggestions } from "~/services/ai/researchSuggestions.server";

type SuggestionsResponse = {
  suggestions: ResearchSuggestions;
};

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireAuth({ request, params });
  return json({});
}

export default function DescribeResearchRequest() {
  const navigate = useNavigate();
  const params = useParams();
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const suggestionsFetcher = useFetcher<SuggestionsResponse>();
  const [charCount, setCharCount] = useState(0);
  const maxChars = 500;

  useEffect(() => {
    setCharCount(description.length);
  }, [description]);

  // Handle navigation after suggestions are received
  useEffect(() => {
    if (suggestionsFetcher.data?.suggestions) {
      navigate(`/app/${params.tenant}/dashboard/create/form?description=${encodeURIComponent(description)}&suggestions=${encodeURIComponent(JSON.stringify(suggestionsFetcher.data.suggestions))}`);
    }
  }, [suggestionsFetcher.data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsLoading(true);
    suggestionsFetcher.submit(
      { description },
      { method: "post", action: `/app/${params.tenant}/dashboard/create/suggestions` }
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto pt-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="border-b border-gray-200 bg-white px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-inner">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Create Research Request</h2>
                  <p className="text-sm text-gray-500 mt-1">Let's start by describing what you want to research</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/app/${params.tenant}/dashboard`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-150"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Tips Section */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                <h3 className="text-sm font-semibold text-orange-900 mb-2">Tips for Better Results</h3>
                <ul className="space-y-2">
                  <li className="flex items-start text-sm text-orange-800">
                    <svg className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Be specific about topics, time periods, and requirements
                  </li>
                  <li className="flex items-start text-sm text-orange-800">
                    <svg className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Include relevant keywords and phrases
                  </li>
                  <li className="flex items-start text-sm text-orange-800">
                    <svg className="w-5 h-5 text-orange-500 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mention any specific subreddits you're interested in
                  </li>
                </ul>
              </div>

              {/* Textarea Section */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-900">
                    Research Description
                  </label>
                  <span className={`text-xs ${charCount > maxChars ? 'text-red-600' : 'text-gray-500'}`}>
                    {charCount}/{maxChars} characters
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    id="description"
                    name="description"
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    maxLength={maxChars}
                    className="block w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 text-sm transition-colors duration-150 resize-none"
                    placeholder="Example: I want to analyze discussions about AI technology trends in healthcare from the past month. I'm particularly interested in machine learning and deep learning applications, focusing on patient care and diagnosis. Please include posts from r/artificial, r/MachineLearning, and r/healthtech."
                    autoFocus
                  />
                  <div className="absolute bottom-3 right-3 text-gray-400 text-xs">
                    Press Enter to continue
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || suggestionsFetcher.state === "submitting" || description.trim().length === 0 || charCount > maxChars}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                >
                  {isLoading || suggestionsFetcher.state === "submitting" ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Continue
                      <svg className="ml-2 -mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}