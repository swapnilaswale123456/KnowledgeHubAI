import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useNavigate, useParams } from "@remix-run/react";
import { requireAuth } from "~/utils/loaders.middleware";
import { useState } from "react";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireAuth({ request, params });
  const formData = await request.formData();
  
  // Parse form data
  const name = formData.get("name") as string;
  const purpose = formData.get("purpose") as string;
  const subreddits = JSON.parse(formData.get("subreddits") as string);
  const keywords = JSON.parse(formData.get("keywords") as string);
  const duration = formData.get("duration") as string;

  // TODO: Save the request to your database
  console.log({ name, purpose, subreddits, keywords, duration });

  return redirect(`/app/${params.tenant}/dashboard`);
};

export default function CreateRequest() {
  const navigate = useNavigate();
  const params = useParams();
  const [subreddits, setSubreddits] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation Bar */}
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
              <h1 className="text-sm font-semibold text-gray-900">Create New Request</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
              required
            />
          </div>

          {/* Purpose */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
              Purpose
            </label>
            <textarea
              name="purpose"
              id="purpose"
              rows={3}
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
                placeholder="Add 1 subreddit. Press Enter to add it."
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
                placeholder="Add up to 50 keywords. Press Enter to add each one."
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

          {/* Duration */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              Duration
            </label>
            <select
              id="duration"
              name="duration"
              defaultValue="day"
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
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
              Create Request
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
