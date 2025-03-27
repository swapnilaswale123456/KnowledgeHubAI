import React, { useState } from 'react';
import { format } from 'date-fns';

interface ResearchResult {
  id: string;
  request_id: string;
  run_date: string;
  total_posts: number;
  total_comments: number;
  relevant_posts: number;
  relevant_comments: number;
  sentiment_analysis: {
    positive: number;
    negative: number;
    neutral: number;
  };
  report: {
    engagement_metrics: {
      posts_vs_comments: {
        posts: number;
        comments: number;
        ratio: number;
      };
      relevance_metrics: {
        relevant_posts: number;
        relevant_comments: number;
        relevance_rate: number;
      };
    };
    sentiment_distribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
    topic_analysis: {
      topics: string[];
      topic_count: number;
    };
    user_insights: {
      total_users: number;
      expertise_distribution: Record<string, number>;
      activity_distribution: Record<string, number>;
      top_influencers: Array<{
        username: string;
        score: number;
        expertise: string;
        activity: string;
        karma: number;
        engagement: number;
      }>;
      engagement_trends: {
        avg_activities_per_day: number;
        avg_content_length: number;
        vocabulary_diversity: number;
        subreddit_diversity: number;
        engagement_patterns: {
          high_engagement: number;
          medium_engagement: number;
          low_engagement: number;
        };
      };
    };
    content_insights: {
      summary: {
        executive_summary: string;
        key_findings: string[];
        notable_patterns: string[];
        recommendations: string[];
        action_items: string[];
      };
      key_metrics: {
        total_activities: number;
        avg_engagement: number;
        content_quality: number;
      };
    };
  };
}

interface ResearchResultsProps {
  results: ResearchResult[];
  onDateRangeChange?: (fromDate: string, toDate: string) => void;
}

export default function ResearchResults({ results, onDateRangeChange }: ResearchResultsProps) {
  const [selectedResult, setSelectedResult] = useState<ResearchResult | null>(results[0] || null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleDateRangeChange = () => {
    if (fromDate && toDate && onDateRangeChange) {
      onDateRangeChange(fromDate, toDate);
    }
  };

  if (!results.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No research results available.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            />
          </div>
          <button
            onClick={handleDateRangeChange}
            className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Results Timeline */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h2>
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.id}
              onClick={() => setSelectedResult(result)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedResult?.id === result.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-200'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Analysis Run: {format(new Date(result.run_date), 'PPpp')}
                  </p>
                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                    <span>{result.total_posts} posts</span>
                    <span>{result.total_comments} comments</span>
                    <span>{result.relevant_posts} relevant posts</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Click to view details</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Result Details */}
      {selectedResult && (
        <div className="space-y-6">
          {/* Engagement Metrics */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Posts vs Comments</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Posts</span>
                    <span className="font-medium">{selectedResult.report.engagement_metrics.posts_vs_comments.posts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Comments</span>
                    <span className="font-medium">{selectedResult.report.engagement_metrics.posts_vs_comments.comments}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Ratio</span>
                    <span className="font-medium">{selectedResult.report.engagement_metrics.posts_vs_comments.ratio.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Relevance Metrics</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Relevant Posts</span>
                    <span className="font-medium">{selectedResult.report.engagement_metrics.relevance_metrics.relevant_posts}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Relevant Comments</span>
                    <span className="font-medium">{selectedResult.report.engagement_metrics.relevance_metrics.relevant_comments}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Relevance Rate</span>
                    <span className="font-medium">{selectedResult.report.engagement_metrics.relevance_metrics.relevance_rate.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment Analysis */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Analysis</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Positive</span>
                  <span className="font-medium">{selectedResult.report.sentiment_distribution.positive.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${selectedResult.report.sentiment_distribution.positive}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Neutral</span>
                  <span className="font-medium">{selectedResult.report.sentiment_distribution.neutral.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gray-500 h-2 rounded-full"
                    style={{ width: `${selectedResult.report.sentiment_distribution.neutral}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Negative</span>
                  <span className="font-medium">{selectedResult.report.sentiment_distribution.negative.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${selectedResult.report.sentiment_distribution.negative}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* User Insights */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">User Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Expertise Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(selectedResult.report.user_insights.expertise_distribution).map(([level, count]) => (
                    <div key={level} className="flex justify-between text-sm">
                      <span>{level}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Activity Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(selectedResult.report.user_insights.activity_distribution).map(([level, count]) => (
                    <div key={level} className="flex justify-between text-sm">
                      <span>{level}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Influencers */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Top Influencers</h3>
              <div className="space-y-3">
                {selectedResult.report.user_insights.top_influencers.map((influencer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{influencer.username}</p>
                      <p className="text-xs text-gray-500">
                        {influencer.expertise} • {influencer.activity} • {influencer.karma.toLocaleString()} karma
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-indigo-600">{influencer.engagement.toFixed(1)}% engagement</p>
                      <p className="text-xs text-gray-500">Score: {influencer.score.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Content Insights */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Insights</h2>
            
            {/* Executive Summary */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Executive Summary</h3>
              <p className="text-sm text-gray-600">{selectedResult.report.content_insights.summary.executive_summary}</p>
            </div>

            {/* Key Findings */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Key Findings</h3>
              <ul className="list-disc list-inside space-y-2">
                {selectedResult.report.content_insights.summary.key_findings.map((finding, index) => (
                  <li key={index} className="text-sm text-gray-600">{finding}</li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Recommended Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedResult.report.content_insights.summary.action_items.map((action, index) => (
                  <div key={index} className="p-3 bg-indigo-50 rounded-lg">
                    <p className="text-sm text-indigo-900">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 