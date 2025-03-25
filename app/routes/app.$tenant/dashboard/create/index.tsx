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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Create Find Request</h2>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/app/${params.tenant}/dashboard`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Describe Your Research Request
              </label>
              <div className="mt-1">
                <textarea
                  id="description"
                  name="description"
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                  placeholder="Example: I want to find discussions about AI technology trends in the last month, focusing on machine learning and deep learning applications in healthcare."
                  autoFocus
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Be specific about what you're looking for. Include topics, time periods, and any specific requirements.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || suggestionsFetcher.state === "submitting"}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading || suggestionsFetcher.state === "submitting" ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}