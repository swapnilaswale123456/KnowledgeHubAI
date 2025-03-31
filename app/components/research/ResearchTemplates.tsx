import { useState } from 'react';
import { useNavigate } from '@remix-run/react';

interface ResearchTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: {
    subreddits: string[];
    keywords: string[];
    min_score: number;
    min_comments: number;
    schedule_type: 'daily' | 'weekly' | 'monthly';
    additional_settings?: Record<string, any>;
  };
}

const PREDEFINED_TEMPLATES: ResearchTemplate[] = [
  {
    id: 'market-research',
    name: 'Product Launch Research',
    description: 'Research consumer sentiment for new product launch',
    category: 'Market Research',
    config: {
      subreddits: ['productreviews', 'gadgets', 'technology'],
      keywords: ['product launch', 'user experience', 'feedback'],
      min_score: 10,
      min_comments: 5,
      schedule_type: 'daily',
      additional_settings: {
        sentiment_analysis: true,
        competitor_mentions: true,
        feature_requests: true
      }
    }
  },
  {
    id: 'competitor-analysis',
    name: 'Competitor Monitoring',
    description: 'Monitor competitor mentions and sentiment',
    category: 'Competitor Analysis',
    config: {
      subreddits: ['industry_specific_subreddit'],
      keywords: ['competitor_name', 'alternative', 'comparison'],
      min_score: 5,
      min_comments: 3,
      schedule_type: 'weekly',
      additional_settings: {
        sentiment_analysis: true,
        market_share_analysis: true,
        feature_comparison: true
      }
    }
  },
  {
    id: 'content-strategy',
    name: 'Content Topic Research',
    description: 'Find trending topics in target audience',
    category: 'Content Strategy',
    config: {
      subreddits: ['target_audience_subreddit'],
      keywords: ['how to', 'recommendation', 'help'],
      min_score: 15,
      min_comments: 10,
      schedule_type: 'daily',
      additional_settings: {
        topic_clustering: true,
        content_gaps: true,
        audience_insights: true
      }
    }
  }
];

interface ResearchTemplatesProps {
  onSelectTemplate: (template: ResearchTemplate) => void;
}

export default function ResearchTemplates({ onSelectTemplate }: ResearchTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categories = ['all', ...new Set(PREDEFINED_TEMPLATES.map(t => t.category))];

  const filteredTemplates = PREDEFINED_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-2 text-sm rounded-md ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div
            key={template.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSelectTemplate(template)}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{template.name}</h3>
                <p className="mt-1 text-xs text-gray-500">{template.description}</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-full">
                {template.category}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center text-xs text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                {template.config.subreddits.length} Subreddits
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {template.config.keywords.length} Keywords
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {template.config.schedule_type} Schedule
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {Object.entries(template.config.additional_settings || {}).map(([key, value]) => (
                  <span
                    key={key}
                    className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full"
                  >
                    {key.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 