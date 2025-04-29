import React, { useState, useEffect, useMemo } from 'react';
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
      raw_data: string;
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

type ColorScale = {
  [key: number]: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

const COLORS: {
  primary: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  danger: ColorScale;
} = {
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  }
};

interface FetcherData {
  results: ResearchResult[];
}

const calculateAnalysisDuration = (runDate: string): string => {
  const startTime = new Date(runDate);
  const endTime = new Date();
  const durationInMinutes = differenceInMinutes(endTime, startTime);
  
  if (durationInMinutes < 60) {
    return `${durationInMinutes} minutes`;
  } else if (durationInMinutes < 1440) { // less than 24 hours
    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(durationInMinutes / 1440);
    const hours = Math.floor((durationInMinutes % 1440) / 60);
    return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
  }
};

export default function ResearchResults({ results: initialResults, onDateRangeChange }: ResearchResultsProps) {
  const [selectedResult, setSelectedResult] = useState<ResearchResult | null>(initialResults[0] || null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activeTab, setActiveTab] = useState('quick-insights');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [results, setResults] = useState(initialResults);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const fetcher = useFetcher<FetcherData>();

  // Filter Redditor leads based on search query and filter type
  const filteredLeads = useMemo(() => {
    if (!selectedResult) return [];
    
    let filtered = selectedResult.report.redditor_leads;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.basic_info.username.toLowerCase().includes(query) ||
        lead.community_presence.relevant_topics.some(topic => topic.toLowerCase().includes(query)) ||
        lead.community_presence.active_subreddits.some(subreddit => subreddit.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    switch (filterType) {
      case 'high-influence':
        filtered = filtered.filter(lead => lead.basic_info.influence_score >= 0.7);
        break;
      case 'active':
        filtered = filtered.filter(lead => lead.basic_info.activity_level === 'High');
        break;
      case 'expert':
        filtered = filtered.filter(lead => lead.basic_info.expertise_level === 'High');
        break;
      default:
        break;
    }

    return filtered;
  }, [selectedResult, searchQuery, filterType]);

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
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Quick Insights
              </button>
                <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-xs font-medium ${
                  activeTab === 'overview'
                    ? 'text-orange-600 border-b-2 border-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
                </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`px-4 py-2 text-xs font-medium ${
                  activeTab === 'leads'
                    ? 'text-orange-600 border-b-2 border-orange-600'
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
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Executive Summary
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{selectedResult.report.summary.overview.executive_summary}</p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-6 shadow-sm border border-orange-100 hover:shadow-md transition-shadow duration-200">
                  <h3 className="text-xs font-medium text-orange-600 mb-2">Total Activities</h3>
                  <p className="text-lg font-bold text-orange-900">{selectedResult.total_posts + selectedResult.total_comments}</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-orange-600">
                      Posts: {selectedResult.total_posts} (Relevant: {selectedResult.relevant_posts})
                    </p>
                    <p className="text-xs text-orange-600">
                      Comments: {selectedResult.total_comments} (Relevant: {selectedResult.relevant_comments})
                    </p>
                        </div>
                    </div>
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-6 shadow-sm border border-orange-100 hover:shadow-md transition-shadow duration-200">
                  <h3 className="text-xs font-medium text-orange-600 mb-2">Topic Diversity</h3>
                  <p className="text-lg font-bold text-orange-900">
                    {selectedResult.report.topics.topic_insights.topic_count} Topics
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {selectedResult.report.topics.topic_insights.topic_diversity}
                  </p>
                  </div>
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-6 shadow-sm border border-orange-100 hover:shadow-md transition-shadow duration-200">
                  <h3 className="text-xs font-medium text-orange-600 mb-2">Community Impact</h3>
                  <p className="text-lg font-bold text-orange-900">
                    {selectedResult.report.subreddit_analytics.analytics_summary.engagement_level}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {selectedResult.report.subreddit_analytics.analytics_summary.content_volume.relevance_ratio}% Relevance
                  </p>
                </div>
              </div>

              {/* Redditor Leads Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Top Redditor Leads
                  </h3>
                      </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Influence Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expertise Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement Quality</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content Quality</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relevance Score</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedResult.report.redditor_leads.slice(0, 5).map((lead, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 font-medium">
                                  {lead.basic_info.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <a 
                                  href={`https://reddit.com/user/${lead.basic_info.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-orange-600 hover:text-orange-800 hover:underline"
                                >
                                  {lead.basic_info.username}
                                </a>
                                <div className="text-xs text-gray-500">
                                  <a 
                                    href={`https://reddit.com/user/${lead.basic_info.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-orange-600"
                                  >
                                    View Profile →
                                  </a>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full" 
                                  style={{ width: `${lead.basic_info.influence_score * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">{(lead.basic_info.influence_score * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              lead.basic_info.expertise_level === 'High' ? 'bg-orange-100 text-orange-800' :
                              lead.basic_info.expertise_level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {lead.basic_info.expertise_level}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              lead.basic_info.activity_level === 'High' ? 'bg-orange-100 text-orange-800' :
                              lead.basic_info.activity_level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {lead.basic_info.activity_level}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full" 
                                  style={{ width: `${lead.engagement_metrics.engagement_quality * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">{(lead.engagement_metrics.engagement_quality * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full" 
                                  style={{ width: `${lead.engagement_metrics.content_quality * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">{(lead.engagement_metrics.content_quality * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full" 
                                  style={{ width: `${lead.engagement_metrics.relevance_score * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">{(lead.engagement_metrics.relevance_score * 100).toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 border-t border-gray-100">
              <button
                    onClick={() => setActiveTab('leads')}
                    className="text-sm text-orange-600 hover:text-orange-800 font-medium flex items-center"
                  >
                    View All Leads
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
              </button>
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
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-5 shadow-sm border border-orange-100">
                  <h3 className="text-xs font-medium text-orange-600 mb-2">Total Activities</h3>
                  <p className="text-sm font-bold text-orange-900">{selectedResult.total_posts + selectedResult.total_comments}</p>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-orange-600">
                      Posts: {selectedResult.total_posts} (Relevant: {selectedResult.relevant_posts})
                    </p>
                    <p className="text-xs text-orange-600">
                      Comments: {selectedResult.total_comments} (Relevant: {selectedResult.relevant_comments})
                    </p>
                </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-5 shadow-sm border border-orange-100">
                  <h3 className="text-xs font-medium text-orange-600 mb-2">Topic Diversity</h3>
                  <p className="text-sm font-bold text-orange-900">
                    {selectedResult.report.topics.topic_insights.topic_count} Topics
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {selectedResult.report.topics.topic_insights.topic_diversity}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-5 shadow-sm border border-orange-100">
                  <h3 className="text-xs font-medium text-orange-600 mb-2">Community Impact</h3>
                  <p className="text-sm font-bold text-orange-900">
                    {selectedResult.report.subreddit_analytics.analytics_summary.engagement_level}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {selectedResult.report.subreddit_analytics.analytics_summary.content_volume.relevance_ratio}% Relevance
                  </p>
                </div>
              </div>

              {/* Key Findings */}
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Key Findings</h3>
                <div className="space-y-4">
                  {selectedResult.report.summary.overview.key_findings.map((finding, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-600 text-xs font-medium">{index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-600">{finding}</p>
                    </div>
                  ))}
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
                        outerRadius={120}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={Object.values(COLORS.primary)[Math.floor(index * 2 + 2)]}
                            stroke="#fff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.5rem',
                          padding: '0.5rem'
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            
            </div>
          )}

          {/* Redditor Leads Tab */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Redditor Leads</h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search leads..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="all">All Leads</option>
                      <option value="high-influence">High Influence</option>
                      <option value="active">Most Active</option>
                      <option value="expert">Experts</option>
                    </select>
                    <button
                      onClick={() => {
                        const csvContent = filteredLeads.map(lead => ({
                          Username: lead.basic_info.username,
                          'Influence Score': (lead.basic_info.influence_score * 100).toFixed(1) + '%',
                          'Expertise Level': lead.basic_info.expertise_level,
                          'Activity Level': lead.basic_info.activity_level,
                          'Engagement Quality': (lead.engagement_metrics.engagement_quality * 100).toFixed(1) + '%',
                          'Content Quality': (lead.engagement_metrics.content_quality * 100).toFixed(1) + '%',
                          'Relevance Score': (lead.engagement_metrics.relevance_score * 100).toFixed(1) + '%',
                          'Profile URL': lead.basic_info.profile_url,
                          'Active Subreddits': lead.community_presence.active_subreddits.join(', '),
                          'Relevant Topics': lead.community_presence.relevant_topics.join(', '),
                          'Community Impact': lead.community_presence.community_impact
                        }));

                        const headers = Object.keys(csvContent[0]);
                        const csvRows = [
                          headers.join(','),
                          ...csvContent.map(row => 
                            headers.map(header => 
                              JSON.stringify(row[header as keyof typeof row])
                            ).join(',')
                          )
                        ].join('\n');

                        const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', `redditor_leads_${new Date().toISOString().split('T')[0]}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center space-x-2 transition-colors duration-200"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Export CSV</span>
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Redditor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Influence Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expertise Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement Quality</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content Quality</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relevance Score</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredLeads.map((lead, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <span className="text-orange-600 font-medium">
                                  {lead.basic_info.username.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <a 
                                  href={`https://reddit.com/user/${lead.basic_info.username}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-orange-600 hover:text-orange-800 hover:underline"
                                >
                                  {lead.basic_info.username}
                                </a>
                                <div className="text-xs text-gray-500">
                                  <a 
                                    href={`https://reddit.com/user/${lead.basic_info.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-orange-600"
                                  >
                                    View Profile →
                                  </a>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full" 
                                  style={{ width: `${lead.basic_info.influence_score * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">
                                {(lead.basic_info.influence_score * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              lead.basic_info.expertise_level === 'High' ? 'bg-orange-100 text-orange-800' :
                              lead.basic_info.expertise_level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {lead.basic_info.expertise_level}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              lead.basic_info.activity_level === 'High' ? 'bg-orange-100 text-orange-800' :
                              lead.basic_info.activity_level === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {lead.basic_info.activity_level}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full" 
                                  style={{ width: `${lead.engagement_metrics.engagement_quality * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">
                                {(lead.engagement_metrics.engagement_quality * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full" 
                                  style={{ width: `${lead.engagement_metrics.content_quality * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">
                                {(lead.engagement_metrics.content_quality * 100).toFixed(1)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full" 
                                  style={{ width: `${lead.engagement_metrics.relevance_score * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-900">
                                {(lead.engagement_metrics.relevance_score * 100).toFixed(1)}%
                              </span>
                            </div>
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
                            className="text-orange-600 hover:text-orange-800"
                          >
                            {lead.basic_info.username}
                          </a>
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          lead.community_presence.community_impact === 'High' ? 'bg-orange-100 text-orange-800' :
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
                              <span key={idx} className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded-full">
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
                          className="text-orange-600 hover:text-orange-800"
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
                                    className="text-sm text-orange-600 hover:text-orange-800"
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
                                    className="text-sm text-orange-600 hover:text-orange-800"
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
                  <h4 className="text-sm font-medium text-gray-900">Monitored Subreddits</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedResult.report.subreddit_analytics.raw_data ? (
                      selectedResult.report.subreddit_analytics.raw_data.split(',').map((subreddit, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-white rounded-full border border-gray-200">
                          r/{subreddit.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No subreddits monitored</span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  selectedResult.report.subreddit_analytics.analytics_summary.engagement_level === 'High' ? 'bg-orange-100 text-orange-800' :
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