import { Form } from "@remix-run/react";
import { useState } from "react";

interface RequestFormProps {
  mode: 'create' | 'edit';
  initialData?: {
    id?: string;
    name: string;
    description?: string;
    purpose?: string;
    subreddits: string[];
    keywords: string[];
    schedule_type?: 'daily' | 'weekly' | 'monthly';
    min_score?: number;
    min_comments?: number;
    time_filter?: string;
    sort?: string;
    limit?: number;
    comments_limit?: number;
  };
  onClose?: () => void;
  updateRequest?: (data: any) => Promise<void>;
}

export default function RequestForm({ mode, initialData, onClose, updateRequest }: RequestFormProps) {
  const [subreddits, setSubreddits] = useState<string[]>(initialData?.subreddits || []);
  const [keywords, setKeywords] = useState<string[]>(initialData?.keywords || []);
  const [newSubreddit, setNewSubreddit] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(getDescription());
  const [scheduleType, setScheduleType] = useState(initialData?.schedule_type || "daily");
  const [timeFilter, setTimeFilter] = useState(initialData?.time_filter || "all");
  const [sort, setSort] = useState(initialData?.sort || "relevance");
  const [minScore, setMinScore] = useState(50);
  const [minComments, setMinComments] = useState(5);
  const [limit, setLimit] = useState(5);
  const [commentsLimit, setCommentsLimit] = useState(initialData?.comments_limit || 50);

  // Get description from either description or purpose field
  function getDescription() {
    if (initialData?.description) return initialData.description;
    if (initialData?.purpose) return initialData.purpose;
    return '';
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'edit' && updateRequest && initialData?.id) {
      const formData = {
        id: initialData.id,
        name,
        description,
        subreddits,
        keywords,
        schedule_type: scheduleType,
        min_score: minScore,
        min_comments: minComments,
        time_filter: timeFilter,
        sort: sort,
        limit: limit,
        comments_limit: commentsLimit
      };
      
      try {
        await updateRequest(formData);
        if (onClose) {
          onClose();
        }
      } catch (error) {
        console.error('Error updating request:', error);
        // You might want to show an error message to the user here
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
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

          <Form method="post" className="space-y-4" onSubmit={handleSubmit}>
            {/* Request Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Request Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {/* Time Filter */}
            <div>
              <label htmlFor="time_filter" className="block text-sm font-medium text-gray-700">
                Time Filter
              </label>
              <select
                id="time_filter"
                name="time_filter"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
              >
                
                <option value="day">Past 24 Hours</option>
                <option value="week">Past Week</option>
                <option value="month">Past Month</option>
              
              </select>
            </div>

            {/* Sort Method */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700">
                Sort Method
              </label>
              <select
                id="sort"
                name="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
              >
                <option value="relevance">Relevance</option>
                <option value="hot">Hot</option>
                <option value="top">Top</option>
                <option value="new">New</option>
                <option value="comments">Most Comments</option>
              </select>
            </div>

            {/* Minimum Score */}
            <div>
              <label htmlFor="min_score" className="block text-sm font-medium text-gray-700">
                Minimum Score
              </label>
              <input
                type="number"
                name="min_score"
                id="min_score"
                value={minScore}
                disabled
                className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm text-gray-500 text-sm"
              />
            </div>

            {/* Minimum Comments */}
            <div>
              <label htmlFor="min_comments" className="block text-sm font-medium text-gray-700">
                Minimum Comments
              </label>
              <input
                type="number"
                name="min_comments"
                id="min_comments"
                value={minComments}
                disabled
                className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm text-gray-500 text-sm"
              />
            </div>

            {/* Maximum Posts */}
            <div>
              <label htmlFor="limit" className="block text-sm font-medium text-gray-700">
                Maximum Posts
              </label>
              <input
                type="number"
                name="limit"
                id="limit"
                value={limit}
                disabled
                className="mt-1 block w-full rounded-lg border-gray-300 bg-gray-50 shadow-sm text-gray-500 text-sm"
              />
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