import React, { useState, useEffect } from 'react';
import { format, differenceInMinutes } from 'date-fns';
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
  research_metrics: {
    total_engagement: number;
    relevance_score: number;
    research_quality: number;
  };
  report: {
    sentiment_analysis: {
      labels: string[];
      values: number[];
      colors: string[];
      insights: {
        dominant_sentiment: string;
        sentiment_balance: string;
        engagement_correlation: string;
      };
    };
    topics: {
      labels: string[];
      values: number[];
      colors: string[];
      topic_insights: {
      topic_count: number;
        topic_diversity: string;
        primary_focus: string;
        topic_categories: {
          technical: number;
          business: number;
          community: number;
        };
      };
    };
      summary: {
      overview: {
        executive_summary: string;
        key_findings: string[];
        notable_patterns: string[];
      };
      recommendations: {
        suggestions: string[];
        action_items: string[];
      };
      discussion_analysis: {
        content_analysis: {
          post_summary: string;
          comment_summary: string;
          content_quality: string;
          content_metrics: {
            depth: number;
            breadth: number;
            controversy_level: number;
          };
        };
        engagement_analysis: {
          interaction_patterns: string;
          user_engagement: string;
          knowledge_sharing: string;
          engagement_metrics: {
            consensus_strength: number;
            discussion_health: string;
          };
        };
        thematic_analysis: {
          main_themes: string[];
          expertise_areas: string[];
          controversial_topics: string[];
          consensus_points: string[];
          theme_metrics: {
            theme_coherence: string;
            expertise_depth: string;
          };
        };
      };
    };
    subreddit_analytics: {
      raw_data: {
        subreddit: string;
      };
      analytics_summary: {
        subreddit_count: number;
        engagement_level: string;
        content_volume: {
          posts: number;
          comments: number;
          relevance_ratio: number;
        };
      };
    };
    redditor_leads: RedditorLead[];
  };
}

interface RedditorLead {
  basic_info: {
    username: string;
    influence_score: number;
    expertise_level: string;
    activity_level: string;
    profile_url: string;
  };
  engagement_metrics: {
    engagement_quality: number;
    content_quality: number;
    relevance_score: number;
  };
  community_presence: {
    active_subreddits: string[];
    relevant_topics: string[];
    community_impact: string;
  };
  reference_links: {
    posts: Array<{
      id: string;
      title: string;
      url: string;
      score: number;
      created_utc: string;
    }>;
    comments: Array<{
      id: string;
      content: string | null;
      url: string;
      score: number;
      created_utc: string;
    }>;
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
  const [activeTab, setActiveTab] = useState('quick-insights');
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
    { name: 'Positive', value: selectedResult.report.sentiment_analysis.values[0] },
    { name: 'Neutral', value: selectedResult.report.sentiment_analysis.values[1] },
    { name: 'Negative', value: selectedResult.report.sentiment_analysis.values[2] }
  ] : [];

  const topicData = selectedResult ? selectedResult.report.topics.labels.map((label, index) => ({
    name: label,
    value: selectedResult.report.topics.values[index]
  })) : [];

  const expertiseData = selectedResult ? Object.entries(selectedResult.report.topics.topic_insights.topic_categories)
    .map(([name, value]) => ({ name, value })) : [];

  const activityData = selectedResult ? Object.entries(selectedResult.report.topics.topic_insights.topic_categories)
    .map(([name, value]) => ({ name, value })) : [];

  const engagementData = selectedResult ? [
    {
      name: 'Posts',
      total: selectedResult.report.topics.values[0],
      relevant: selectedResult.report.topics.values[1]
    },
    {
      name: 'Comments',
      total: selectedResult.report.topics.values[2],
      relevant: selectedResult.report.topics.values[3]
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

      {/* Selected Result Details */}
      {selectedResult && (
        <div className="space-y-6">
          {/* Navigation Tabs */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('quick-insights')}
                className={`px-4 py-2 text-xs font-medium ${
                  activeTab === 'quick-insights'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Quick Insights
              </button>
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
                onClick={() => setActiveTab('leads')}
                className={`px-4 py-2 text-xs font-medium ${
                  activeTab === 'leads'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Redditor Leads
              </button>
        </div>
      </div>

          {/* Quick Insights Tab */}
          {activeTab === 'quick-insights' && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Executive Summary</h3>
                <p className="text-sm text-gray-600">{selectedResult.report.summary.overview.executive_summary}</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Total Activities</h3>
                  <p className="text-sm font-bold text-gray-900">{selectedResult.total_posts + selectedResult.total_comments}</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-gray-500">
                      Posts: {selectedResult.total_posts} (Relevant: {selectedResult.relevant_posts})
                    </p>
                    <p className="text-xs text-gray-500">
                      Comments: {selectedResult.total_comments} (Relevant: {selectedResult.relevant_comments})
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Engagement Level</h3>
                  <p className="text-sm font-bold text-gray-900 capitalize">{selectedResult?.report?.subreddit_analytics?.analytics_summary?.engagement_level || 'N/A'}</p>
                  <p className="text-xs text-gray-500 mt-1">Total Engagement: {selectedResult?.research_metrics?.total_engagement || 0}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Content Relevance</h3>
                  <p className="text-sm font-bold text-gray-900">{selectedResult?.research_metrics?.relevance_score || 0}%</p>
                  <p className="text-xs text-gray-500 mt-1">Relevance Ratio: {selectedResult?.report?.subreddit_analytics?.analytics_summary?.content_volume?.relevance_ratio || 0}%</p>
                </div>
              </div>

              {/* Key Findings */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Key Findings</h3>
                <ul className="space-y-3">
                  {selectedResult.report.summary.overview.key_findings.map((finding, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-indigo-500 mr-2">•</span>
                      <span className="text-sm text-gray-600">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sentiment Analysis */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
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
                    <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-3">Sentiment Insights</h4>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Dominant Sentiment</span>
                        <span className="text-xs font-medium text-gray-900 capitalize">{selectedResult.report.sentiment_analysis.insights.dominant_sentiment}</span>
                        </div>
                        <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Sentiment Balance</span>
                        <span className="text-xs font-medium text-gray-900 capitalize">{selectedResult.report.sentiment_analysis.insights.sentiment_balance}</span>
                        </div>
                        <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Engagement Correlation</span>
                        <span className="text-xs font-medium text-gray-900 capitalize">{selectedResult.report.sentiment_analysis.insights.engagement_correlation}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Topic Analysis */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Topic Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topicData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {topicData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-3">Topic Insights</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Topic Count</span>
                        <span className="text-xs font-medium text-gray-900">{selectedResult.report.topics.topic_insights.topic_count}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Topic Diversity</span>
                        <span className="text-xs font-medium text-gray-900 capitalize">{selectedResult.report.topics.topic_insights.topic_diversity}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Primary Focus</span>
                        <span className="text-xs font-medium text-gray-900">{selectedResult.report.topics.topic_insights.primary_focus}</span>
                      </div>
                      <div className="mt-4">
                        <h5 className="text-xs font-medium text-gray-500 mb-2">Topic Categories</h5>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Technical</span>
                            <span className="text-xs font-medium text-gray-900">{selectedResult.report.topics.topic_insights.topic_categories.technical}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Business</span>
                            <span className="text-xs font-medium text-gray-900">{selectedResult.report.topics.topic_insights.topic_categories.business}</span>
                      </div>
                      <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">Community</span>
                            <span className="text-xs font-medium text-gray-900">{selectedResult.report.topics.topic_insights.topic_categories.community}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Redditor Leads */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Redditor Leads</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influence Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expertise Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity Level</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedResult.report.redditor_leads.slice(0, 5).map((lead, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <a 
                              href={lead.basic_info.profile_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              {lead.basic_info.username}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(lead.basic_info.influence_score * 100).toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lead.basic_info.expertise_level}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lead.basic_info.activity_level}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-right">
                  <button 
                    onClick={() => setActiveTab('leads')}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    View All Leads →
                  </button>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Suggestions</h4>
                    <ul className="space-y-2">
                      {selectedResult.report.summary.recommendations.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-indigo-500 mr-2">•</span>
                          <span className="text-sm text-gray-600">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-2">Action Items</h4>
                    <ul className="space-y-2">
                      {selectedResult.report.summary.recommendations.action_items.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-indigo-500 mr-2">•</span>
                          <span className="text-sm text-gray-600">{item}</span>
                        </li>
                      ))}
                    </ul>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Executive Summary</h3>
                <p className="text-sm text-gray-600">{selectedResult.report.summary.overview.executive_summary}</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Total Activities</h3>
                  <p className="text-sm font-bold text-gray-900">{selectedResult.total_posts + selectedResult.total_comments}</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-gray-500">
                      Posts: {selectedResult.total_posts} (Relevant: {selectedResult.relevant_posts})
                    </p>
                    <p className="text-xs text-gray-500">
                      Comments: {selectedResult.total_comments} (Relevant: {selectedResult.relevant_comments})
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Research Quality</h3>
                  <p className="text-sm font-bold text-gray-900">{selectedResult.research_metrics.research_quality}%</p>
                  <p className="text-xs text-gray-500 mt-1">Total Engagement: {selectedResult.research_metrics.total_engagement}</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-xs font-medium text-gray-500 mb-2">Content Relevance</h3>
                  <p className="text-sm font-bold text-gray-900">{selectedResult.research_metrics.relevance_score}%</p>
                  <p className="text-xs text-gray-500 mt-1">Relevance Ratio: {selectedResult.report.subreddit_analytics.analytics_summary.content_volume.relevance_ratio}%</p>
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
                  {selectedResult.report.topics.values.slice(10).map((finding, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-indigo-500 mr-2">•</span>
                      <span className="text-gray-600">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Redditor Leads Tab */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Redditor Leads</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Influence Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expertise Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Engagement Quality</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content Quality</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Relevance Score</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedResult.report.redditor_leads.map((lead, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <a 
                              href={lead.basic_info.profile_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800"
                            >
                              {lead.basic_info.username}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(lead.basic_info.influence_score * 100).toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lead.basic_info.expertise_level}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lead.basic_info.activity_level}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(lead.engagement_metrics.engagement_quality * 100).toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(lead.engagement_metrics.content_quality * 100).toFixed(2)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(lead.engagement_metrics.relevance_score * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Community Presence */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Community Presence</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedResult.report.redditor_leads.map((lead, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          <a 
                            href={lead.basic_info.profile_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-800"
                          >
                            {lead.basic_info.username}
                          </a>
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          lead.community_presence.community_impact === 'High' ? 'bg-green-100 text-green-800' :
                          lead.community_presence.community_impact === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.community_presence.community_impact} Impact
                        </span>
                      </div>
                      <div className="space-y-2">
                  <div>
                          <p className="text-xs text-gray-500">Active Subreddits</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lead.community_presence.active_subreddits.map((subreddit, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs bg-white rounded-full border border-gray-200">
                                r/{subreddit}
                              </span>
                            ))}
                          </div>
                  </div>
                  <div>
                          <p className="text-xs text-gray-500">Relevant Topics</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {lead.community_presence.relevant_topics.map((topic, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-full">
                                {topic}
                              </span>
                            ))}
                          </div>
                  </div>
                  </div>
                  </div>
                  ))}
                </div>
              </div>

              {/* Reference Links */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Reference Links</h3>
                <div className="space-y-6">
                  {selectedResult.report.redditor_leads.map((lead, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        <a 
                          href={lead.basic_info.profile_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          {lead.basic_info.username}
                        </a>
                      </h4>
                      
                      {/* Posts */}
                      <div>
                        <h5 className="text-xs font-medium text-gray-500 mb-2">Posts</h5>
                        {lead.reference_links.posts.length > 0 ? (
                          <div className="space-y-2">
                            {lead.reference_links.posts.map((post, postIdx) => (
                              <div key={postIdx} className="p-2 bg-white rounded border border-gray-200">
                                <div className="flex justify-between items-start">
                                  <a 
                                    href={post.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-indigo-600 hover:text-indigo-800"
                                  >
                                    {post.title}
                                  </a>
                                  <span className="text-xs text-gray-500 ml-2">
                                    Score: {post.score}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Posted: {new Date(post.created_utc).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No posts found</p>
                        )}
                      </div>

                      {/* Comments */}
                      <div className="mt-4">
                        <h5 className="text-xs font-medium text-gray-500 mb-2">Comments</h5>
                        {lead.reference_links.comments.length > 0 ? (
                          <div className="space-y-2">
                            {lead.reference_links.comments.map((comment, commentIdx) => (
                              <div key={commentIdx} className="p-2 bg-white rounded border border-gray-200">
                                <div className="flex justify-between items-start">
                                  <a 
                                    href={comment.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-indigo-600 hover:text-indigo-800"
                                  >
                                    {comment.content || 'View Comment'}
                                  </a>
                                  <span className="text-xs text-gray-500 ml-2">
                                    Score: {comment.score}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Posted: {new Date(comment.created_utc).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No comments found</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subreddit Analytics */}
      {selectedResult && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Subreddit Analytics</h3>
          <div className="space-y-6">
            {/* Subreddit Overview */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">r/{selectedResult.report.subreddit_analytics.raw_data.subreddit}</h4>
                  <p className="text-xs text-gray-500">Subreddit Analysis</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedResult.report.subreddit_analytics.analytics_summary.engagement_level === 'High' ? 'bg-green-100 text-green-800' :
                  selectedResult.report.subreddit_analytics.analytics_summary.engagement_level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedResult.report.subreddit_analytics.analytics_summary.engagement_level} Engagement
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Total Posts</p>
                  <p className="text-sm font-medium text-gray-900">{selectedResult.report.subreddit_analytics.analytics_summary.content_volume.posts}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Comments</p>
                  <p className="text-sm font-medium text-gray-900">{selectedResult.report.subreddit_analytics.analytics_summary.content_volume.comments}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Relevance Ratio</p>
                  <p className="text-sm font-medium text-gray-900">{selectedResult.report.subreddit_analytics.analytics_summary.content_volume.relevance_ratio}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 