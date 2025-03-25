import { Form } from "@remix-run/react";
import { useState } from "react";

interface RequestFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    name: string;
    description?: string;
    purpose?: string;
    subreddits: string[];
    keywords: string[];
    schedule_type?: 'daily' | 'weekly' | 'monthly';
    duration?: 'day' | 'week' | 'month';
    min_score?: number;
    min_comments?: number;
    start_date?: string;
    end_date?: string;
    date_range?: {
      start_date: string;
      end_date: string;
    };
  };
  onClose?: () => void;
}

export default function RequestForm({ mode, initialData, onClose }: RequestFormProps) {
  const [subreddits, setSubreddits] = useState<string[]>(initialData?.subreddits || []);
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || []);
  const [newSubreddit, setNewSubreddit] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  // Set default dates for the date range
  const today = new Date();
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(today.getMonth() + 1);
  
  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Get description from either description or purpose field
  const getDescription = () => {
    if (initialData?.description) return initialData.description;
    if (initialData?.purpose) return initialData.purpose;
    return '';
  };

  // Get schedule type from either schedule_type or duration field
  const getScheduleType = () => {
    if (initialData?.schedule_type) return initialData.schedule_type;
    if (initialData?.duration === 'day') return 'daily';
    if (initialData?.duration === 'week') return 'weekly';
    if (initialData?.duration === 'month') return 'monthly';
    return 'daily';
  };

  // Get start date from either directly or from date_range
  const getStartDate = () => {
    if (initialData?.start_date) return initialData.start_date;
    if (initialData?.date_range?.start_date) return initialData.date_range.start_date;
    return formatDateForInput(today);
  };

  // Get end date from either directly or from date_range
  const getEndDate = () => {
    if (initialData?.end_date) return initialData.end_date;
    if (initialData?.date_range?.end_date) return initialData.date_range.end_date;
    return formatDateForInput(oneMonthLater);
  };

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
    <div className="fixed inset-0 bg-gray-500/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                defaultValue={getDescription()}
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
                  placeholder="Add subreddit name (without r/). Press Enter to add it."
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
                  placeholder="Add search keywords. Press Enter to add each one."
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

            {/* Schedule Type */}
            <div>
              <label htmlFor="schedule_type" className="block text-sm font-medium text-gray-700">
                Schedule Type
              </label>
              <select
                id="schedule_type"
                name="schedule_type"
                defaultValue={getScheduleType()}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <h3 className="block text-sm font-medium text-gray-700 mb-2">Date Range</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    id="start_date"
                    defaultValue={getStartDate()}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    id="end_date"
                    defaultValue={getEndDate()}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Min Score and Min Comments */}
            <div>
              <h3 className="block text-sm font-medium text-gray-700 mb-2">Filter Settings</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="min_score" className="block text-sm font-medium text-gray-700">
                    Minimum Score
                  </label>
                  <input
                    type="number"
                    name="min_score"
                    id="min_score"
                    defaultValue={initialData?.min_score || 10}
                    min={0}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="min_comments" className="block text-sm font-medium text-gray-700">
                    Minimum Comments
                  </label>
                  <input
                    type="number"
                    name="min_comments"
                    id="min_comments"
                    defaultValue={initialData?.min_comments || 5}
                    min={0}
                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
                  />
                </div>
              </div>
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