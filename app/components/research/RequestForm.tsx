import { Form } from "@remix-run/react";
import { useState } from "react";

interface RequestFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    name: string;
    purpose: string;
    subreddits: string[];
    keywords: string[];
    duration: 'day' | 'week' | 'month';
  };
  onClose?: () => void;
}

export default function RequestForm({ mode, initialData, onClose }: RequestFormProps) {
  const [subreddits, setSubreddits] = useState<string[]>(initialData?.subreddits || []);
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || []);
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
    <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'create' ? 'Create New Request' : 'Edit Request'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <Form method="post" className="space-y-4">
            {/* Request Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Request Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                defaultValue={initialData?.name}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                required
              />
            </div>

            {/* Purpose */}
            <div>
              <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                Purpose
              </label>
              <textarea
                name="purpose"
                id="purpose"
                rows={3}
                defaultValue={initialData?.purpose}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                required
              />
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
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                Duration
              </label>
              <select
                id="duration"
                name="duration"
                defaultValue={initialData?.duration || 'day'}
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
                {mode === 'create' ? 'Create Request' : 'Update Request'}
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
} 