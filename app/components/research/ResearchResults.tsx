import React, { useState } from 'react';
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

export default function ResearchResults({ results, onDateRangeChange }: ResearchResultsProps) {
  const [selectedResult, setSelectedResult] = useState<ResearchResult | null>(results[0] || null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

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
          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('engagement')}
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === 'engagement'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Engagement
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 text-sm font-medium ${
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sentiment Analysis Chart */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
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

              {/* Engagement Overview */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Overview</h3>
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
            </div>
          )}

          {/* Engagement Tab */}
          {activeTab === 'engagement' && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={engagementData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRelevant" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="total"
                      name="Total"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                    />
                    <Area
                      type="monotone"
                      dataKey="relevant"
                      name="Relevant"
                      stroke="#82ca9d"
                      fillOpacity={1}
                      fill="url(#colorRelevant)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expertise Distribution */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expertise Distribution</h3>
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

              {/* Activity Distribution */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Distribution</h3>
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
          )}

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