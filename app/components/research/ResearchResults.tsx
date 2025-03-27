import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { useFetcher } from '@remix-run/react';

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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ResearchResults({ results: initialResults, onDateRangeChange }: ResearchResultsProps) {
  const [selectedResult, setSelectedResult] = useState<ResearchResult | null>(initialResults[0] || null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [results, setResults] = useState(initialResults);
  const fetcher = useFetcher();

  // Set initial dates from the first result if available
  useEffect(() => {
    if (initialResults.length > 0) {
      const firstResult = initialResults[0];
      const runDate = new Date(firstResult.run_date);
      setFromDate(format(runDate, "yyyy-MM-dd'T'HH:mm"));
      setToDate(format(runDate, "yyyy-MM-dd'T'HH:mm"));
    }
  }, [initialResults]);

  const handleDateRangeChange = () => {
    if (fromDate && toDate) {
      // Convert local datetime to UTC ISO string
      const fromDateUTC = new Date(fromDate).toISOString();
      const toDateUTC = new Date(toDate).toISOString();

      // Make the API call using fetcher
      fetcher.submit(
        { fromDate: fromDateUTC, toDate: toDateUTC },
        { method: 'get', action: window.location.pathname }
      );

      if (onDateRangeChange) {
        onDateRangeChange(fromDateUTC, toDateUTC);
      }
    }
  };

  // Update results when fetcher data changes
  useEffect(() => {
    if (fetcher.data?.results) {
      setResults(fetcher.data.results);
      if (fetcher.data.results.length > 0) {
        setSelectedResult(fetcher.data.results[0]);
      }
    }
  }, [fetcher.data]);

  if (!results.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No research results available.</p>
      </div>
    );
  }

  // Prepare data for charts
  const sentimentData = selectedResult ? [
    { name: 'Positive', value: selectedResult.report.sentiment_distribution.positive },
    { name: 'Neutral', value: selectedResult.report.sentiment_distribution.neutral },
    { name: 'Negative', value: selectedResult.report.sentiment_distribution.negative }
  ] : [];

  const expertiseData = selectedResult ? Object.entries(selectedResult.report.user_insights.expertise_distribution)
    .map(([name, value]) => ({ name, value })) : [];

  const activityData = selectedResult ? Object.entries(selectedResult.report.user_insights.activity_distribution)
    .map(([name, value]) => ({ name, value })) : [];

  const engagementData = selectedResult ? [
    {
      name: 'Posts',
      total: selectedResult.report.engagement_metrics.posts_vs_comments.posts,
      relevant: selectedResult.report.engagement_metrics.relevance_metrics.relevant_posts
    },
    {
      name: 'Comments',
      total: selectedResult.report.engagement_metrics.posts_vs_comments.comments,
      relevant: selectedResult.report.engagement_metrics.relevance_metrics.relevant_comments
    }
  ] : [];

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
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Analysis Results</h2>
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.id}
              onClick={() => {
                setSelectedResult(result);
                setShowDetailsModal(true);
              }}
              className="p-4 rounded-lg border cursor-pointer transition-all hover:border-indigo-200 hover:bg-gray-50"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    Analysis Run: {format(new Date(result.run_date), 'PPpp')}
                  </p>
                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                    <span>{result.total_posts} posts</span>
                    <span>{result.total_comments} comments</span>
                    <span>{result.relevant_posts} relevant posts</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-indigo-600 font-medium">View Details</span>
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Research Analysis Details</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Analysis Run: {format(new Date(selectedResult.run_date), 'PPpp')}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-xs font-medium text-gray-500">Total Posts</h3>
                  <p className="text-sm font-bold text-gray-900 mt-1">{selectedResult.total_posts}</p>
                  <p className="text-xs text-gray-500 mt-1">Relevant: {selectedResult.relevant_posts}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-xs font-medium text-gray-500">Total Comments</h3>
                  <p className="text-sm font-bold text-gray-900 mt-1">{selectedResult.total_comments}</p>
                  <p className="text-xs text-gray-500 mt-1">Relevant: {selectedResult.relevant_comments}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-xs font-medium text-gray-500">Relevance Rate</h3>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {Math.round(selectedResult.report.engagement_metrics.relevance_metrics.relevance_rate)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Posts vs Comments: {selectedResult.report.engagement_metrics.posts_vs_comments.ratio}</p>
                </div>
              </div>

              {/* Sentiment Analysis */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Sentiment Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-medium text-gray-500">Sentiment Distribution</h4>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Positive</span>
                          <span className="text-xs font-medium text-gray-900">{Math.round(selectedResult.report.sentiment_distribution.positive)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Neutral</span>
                          <span className="text-xs font-medium text-gray-900">{Math.round(selectedResult.report.sentiment_distribution.neutral)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Negative</span>
                          <span className="text-xs font-medium text-gray-900">{Math.round(selectedResult.report.sentiment_distribution.negative)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topic Analysis */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Topic Analysis</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-500">Total Topics</span>
                    <span className="text-xs font-medium text-gray-900">{selectedResult.report.topic_analysis.topic_count}</span>
                  </div>
                  <div className="space-y-2">
                    {selectedResult.report.topic_analysis.topics.map((topic, index) => (
                      <div key={index} className="text-xs text-gray-600">{topic}</div>
                    ))}
                  </div>
                </div>
              </div>

              {/* User Insights */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">User Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-xs font-medium text-gray-500 mb-3">Expertise Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedResult.report.user_insights.expertise_distribution).map(([level, count]) => (
                        <div key={level} className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">{level}</span>
                          <span className="text-xs font-medium text-gray-900">{count} users</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-xs font-medium text-gray-500 mb-3">Activity Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedResult.report.user_insights.activity_distribution).map(([level, count]) => (
                        <div key={level} className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">{level}</span>
                          <span className="text-xs font-medium text-gray-900">{count} users</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Engagement Trends */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Engagement Trends</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-xs font-medium text-gray-500 mb-3">Activity Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Avg Activities/Day</span>
                        <span className="text-xs font-medium text-gray-900">{selectedResult.report.user_insights.engagement_trends.avg_activities_per_day}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Avg Content Length</span>
                        <span className="text-xs font-medium text-gray-900">{selectedResult.report.user_insights.engagement_trends.avg_content_length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-xs font-medium text-gray-500 mb-3">Diversity Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Vocabulary Diversity</span>
                        <span className="text-xs font-medium text-gray-900">{selectedResult.report.user_insights.engagement_trends.vocabulary_diversity}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Subreddit Diversity</span>
                        <span className="text-xs font-medium text-gray-900">{selectedResult.report.user_insights.engagement_trends.subreddit_diversity}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Findings */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Key Findings</h3>
                <ul className="space-y-3">
                  {selectedResult.report.content_insights.summary.key_findings.map((finding, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-indigo-500 mr-2">•</span>
                      <span className="text-gray-600">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Recommended Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedResult.report.content_insights.summary.action_items.map((action, index) => (
                    <div key={index} className="p-4 bg-indigo-50 rounded-lg">
                      <p className="text-xs text-indigo-900">{action}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Result Details */}
      {selectedResult && (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-xs font-medium ${
                  activeTab === 'overview'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('engagement')}
                className={`px-4 py-2 text-xs font-medium ${
                  activeTab === 'engagement'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Engagement
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 text-xs font-medium ${
                  activeTab === 'users'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Users
              </button>
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Executive Summary</h3>
                <p className="text-xs text-gray-600">{selectedResult.report.content_insights.summary.executive_summary}</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Total Activities</h3>
                  <p className="text-sm font-bold text-gray-900">{selectedResult.report.content_insights.key_metrics.total_activities}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Average Engagement</h3>
                  <p className="text-sm font-bold text-gray-900">{selectedResult.report.content_insights.key_metrics.avg_engagement}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Content Quality</h3>
                  <p className="text-sm font-bold text-gray-900">{selectedResult.report.content_insights.key_metrics.content_quality}</p>
                </div>
              </div>

              {/* Sentiment Analysis */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Findings */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Key Findings</h3>
                <ul className="space-y-3">
                  {selectedResult.report.content_insights.summary.key_findings.map((finding, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-indigo-500 mr-2">•</span>
                      <span className="text-gray-600">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Engagement Tab */}
          {activeTab === 'engagement' && (
            <div className="space-y-6">
              {/* Engagement Overview */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Engagement Overview</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" name="Total" fill="#8884d8" />
                      <Bar dataKey="relevant" name="Relevant" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Posts vs Comments</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">Posts</p>
                      <p className="text-sm font-bold text-gray-900">{selectedResult.report.engagement_metrics.posts_vs_comments.posts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Comments</p>
                      <p className="text-sm font-bold text-gray-900">{selectedResult.report.engagement_metrics.posts_vs_comments.comments}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Ratio</p>
                      <p className="text-sm font-bold text-gray-900">{selectedResult.report.engagement_metrics.posts_vs_comments.ratio}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Relevance Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">Relevant Posts</p>
                      <p className="text-sm font-bold text-gray-900">{selectedResult.report.engagement_metrics.relevance_metrics.relevant_posts}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Relevant Comments</p>
                      <p className="text-sm font-bold text-gray-900">{selectedResult.report.engagement_metrics.relevance_metrics.relevant_comments}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Relevance Rate</p>
                      <p className="text-sm font-bold text-gray-900">
                        {Math.round(selectedResult.report.engagement_metrics.relevance_metrics.relevance_rate * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notable Patterns */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Notable Patterns</h3>
                <ul className="space-y-3">
                  {selectedResult.report.content_insights.summary.notable_patterns.map((pattern, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-indigo-500 mr-2">•</span>
                      <span className="text-gray-600">{pattern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* User Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Expertise Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expertiseData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Users" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Users" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Top Influencers */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Influencers</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expertise</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karma</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedResult.report.user_insights.top_influencers.map((influencer, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{influencer.username}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{influencer.score}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{influencer.expertise}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{influencer.activity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{influencer.karma}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{influencer.engagement}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Engagement Trends */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">User Engagement Trends</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-500">Average Activities per Day</p>
                    <p className="text-sm font-bold text-gray-900">{selectedResult.report.user_insights.engagement_trends.avg_activities_per_day}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Average Content Length</p>
                    <p className="text-sm font-bold text-gray-900">{selectedResult.report.user_insights.engagement_trends.avg_content_length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Vocabulary Diversity</p>
                    <p className="text-sm font-bold text-gray-900">{selectedResult.report.user_insights.engagement_trends.vocabulary_diversity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Subreddit Diversity</p>
                    <p className="text-sm font-bold text-gray-900">{selectedResult.report.user_insights.engagement_trends.subreddit_diversity}</p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Recommendations</h3>
                <ul className="space-y-3">
                  {selectedResult.report.content_insights.summary.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-indigo-500 mr-2">•</span>
                      <span className="text-gray-600">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 