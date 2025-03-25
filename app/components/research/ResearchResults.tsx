import { useState } from 'react';
import { format } from 'date-fns';

type SentimentAnalysis = {
  positive: number;
  negative: number;
  neutral: number;
};

type ResearchResult = {
  id: string;
  request_id: string;
  run_date: string;
  total_posts: number;
  total_comments: number;
  relevant_posts: number;
  relevant_comments: number;
  sentiment_analysis: SentimentAnalysis;
  top_topics: string[];
  highlights: any[];
  report: string | null;
};

interface ResearchResultsProps {
  results: ResearchResult[];
  onDateRangeChange?: (fromDate: string, toDate: string) => void;
}

export default function ResearchResults({ results, onDateRangeChange }: ResearchResultsProps) {
  const [selectedResultId, setSelectedResultId] = useState<string | null>(
    results.length > 0 ? results[0].id : null
  );
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });

  const selectedResult = results.find(r => r.id === selectedResultId) || results[0];

  const handleDateRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onDateRangeChange) {
      onDateRangeChange(dateRange.fromDate, dateRange.toDate);
    }
  };

  if (!selectedResult) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No results available</p>
      </div>
    );
  }

  // Calculate percentages for the sentiment analysis
  const sentimentTotal = Object.values(selectedResult.sentiment_analysis).reduce((a, b) => a + b, 0);
  const sentimentPercentages = {
    positive: (selectedResult.sentiment_analysis.positive / sentimentTotal) * 100,
    negative: (selectedResult.sentiment_analysis.negative / sentimentTotal) * 100,
    neutral: (selectedResult.sentiment_analysis.neutral / sentimentTotal) * 100
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Filter Results</h2>
        <form onSubmit={handleDateRangeSubmit} className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">From:</label>
            <input
              type="datetime-local"
              value={dateRange.fromDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, fromDate: e.target.value }))}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600">To:</label>
            <input
              type="datetime-local"
              value={dateRange.toDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, toDate: e.target.value }))}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 text-xs text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg hover:from-purple-700 hover:to-indigo-700"
          >
            Apply Filter
          </button>
        </form>
      </div>

      {/* Results Timeline */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-900 mb-3">Analysis Timeline</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => setSelectedResultId(result.id)}
              className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs ${
                selectedResultId === result.id
                  ? 'bg-purple-100 text-purple-700 border-2 border-purple-200'
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {format(new Date(result.run_date), 'MMM d, yyyy HH:mm')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Engagement Stats */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Engagement Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-xs text-purple-600">Total Posts</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                {selectedResult.total_posts.toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {selectedResult.relevant_posts} relevant
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <p className="text-xs text-indigo-600">Total Comments</p>
              <p className="text-2xl font-bold text-indigo-700 mt-1">
                {selectedResult.total_comments.toLocaleString()}
              </p>
              <p className="text-xs text-indigo-600 mt-1">
                {selectedResult.relevant_comments} relevant
              </p>
            </div>
          </div>
        </div>

        {/* Sentiment Analysis */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Sentiment Analysis</h2>
          <div className="space-y-3">
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-green-600">Positive</span>
                <span className="text-xs font-semibold text-green-600">
                  {sentimentPercentages.positive.toFixed(1)}%
                </span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                <div
                  style={{ width: `${sentimentPercentages.positive}%` }}
                  className="bg-green-500 rounded"
                />
              </div>
            </div>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-red-600">Negative</span>
                <span className="text-xs font-semibold text-red-600">
                  {sentimentPercentages.negative.toFixed(1)}%
                </span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                <div
                  style={{ width: `${sentimentPercentages.negative}%` }}
                  className="bg-red-500 rounded"
                />
              </div>
            </div>
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">Neutral</span>
                <span className="text-xs font-semibold text-gray-600">
                  {sentimentPercentages.neutral.toFixed(1)}%
                </span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                <div
                  style={{ width: `${sentimentPercentages.neutral}%` }}
                  className="bg-gray-500 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Topics */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Top Topics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {selectedResult.top_topics.map((topic, index) => (
            <div
              key={index}
              className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-100"
            >
              <div className="flex items-start">
                <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-semibold text-purple-600 border border-purple-200">
                  {index + 1}
                </span>
                <p className="ml-2 text-sm text-gray-700">{topic}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Highlights Section */}
      {selectedResult.highlights && selectedResult.highlights.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Key Highlights</h2>
          <div className="space-y-3">
            {selectedResult.highlights.map((highlight, index) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-100"
              >
                <p className="text-sm text-gray-700">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Report */}
      {selectedResult.report && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Detailed Report</h2>
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: selectedResult.report }} />
          </div>
        </div>
      )}
    </div>
  );
} 