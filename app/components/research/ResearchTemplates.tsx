import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ResearchTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  config: {
    subreddits: string[];
    keywords: string[];
    min_score: number;
    min_comments: number;
    schedule_type: 'daily' | 'weekly' | 'monthly';
    additional_settings?: Record<string, any>;
  };
}

interface ResearchTemplatesProps {
  onSelectTemplate: (template: ResearchTemplate) => void;
}

const templates: ResearchTemplate[] = [
  {
    id: "market-research",
    name: "Market Research Analysis",
    description: "Comprehensive market research to identify trends, opportunities, and competitive landscape in your industry.",
    category: "Market Research",
    icon: "📊",
    config: {
      subreddits: ["business", "entrepreneur", "startups", "marketing", "smallbusiness"],
      keywords: ["market trends", "industry analysis", "competition", "opportunities", "market size"],
      min_score: 10,
      min_comments: 5,
      schedule_type: "weekly"
    }
  },
  {
    id: "product-feedback",
    name: "Product Feedback Analysis",
    description: "Gather and analyze customer feedback about your product or similar products in the market.",
    category: "Product Development",
    icon: "💡",
    config: {
      subreddits: ["ProductManagement", "software", "technology", "webdev", "UXDesign"],
      keywords: ["user feedback", "product review", "customer experience", "pain points", "feature request"],
      min_score: 5,
      min_comments: 3,
      schedule_type: "daily"
    }
  },
  {
    id: "content-strategy",
    name: "Content Strategy Research",
    description: "Research content topics, formats, and distribution channels that resonate with your target audience.",
    category: "Content Marketing",
    icon: "📝",
    config: {
      subreddits: ["content_marketing", "marketing", "digital_marketing", "socialmedia", "blogging"],
      keywords: ["content strategy", "content marketing", "blog topics", "content ideas", "content distribution"],
      min_score: 8,
      min_comments: 4,
      schedule_type: "weekly"
    }
  },
  {
    id: "competitor-analysis",
    name: "Competitor Analysis",
    description: "Track competitor activities, product launches, and market positioning strategies.",
    category: "Competitive Intelligence",
    icon: "🔍",
    config: {
      subreddits: ["business", "marketing", "startups", "technology", "entrepreneur"],
      keywords: ["competitor", "market share", "product launch", "pricing strategy", "brand positioning"],
      min_score: 15,
      min_comments: 8,
      schedule_type: "daily"
    }
  },
  {
    id: "customer-insights",
    name: "Customer Insights Research",
    description: "Deep dive into customer behavior, preferences, and pain points to inform product decisions.",
    category: "Customer Research",
    icon: "👥",
    config: {
      subreddits: ["ProductManagement", "UXResearch", "startups", "technology", "business"],
      keywords: ["customer behavior", "user needs", "pain points", "customer journey", "user experience"],
      min_score: 10,
      min_comments: 5,
      schedule_type: "weekly"
    }
  },
  {
    id: "brand-monitoring",
    name: "Brand Monitoring",
    description: "Track brand mentions, sentiment, and customer feedback across social media platforms.",
    category: "Brand Management",
    icon: "🎯",
    config: {
      subreddits: ["marketing", "branding", "socialmedia", "business", "digital_marketing"],
      keywords: ["brand mention", "brand sentiment", "customer feedback", "brand perception", "brand reputation"],
      min_score: 5,
      min_comments: 3,
      schedule_type: "daily"
    }
  }
];

export default function ResearchTemplates({ onSelectTemplate }: ResearchTemplatesProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder={t("Search templates...")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => onSelectTemplate(template)}
            className="group relative bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="text-2xl mb-2">{template.icon}</div>
              <div className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {template.category}
              </div>
            </div>
            
            <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              {template.name}
            </h3>
            
            <p className="text-xs text-gray-600 mb-2">
              {template.description}
            </p>
            
            <div className="flex items-center text-xs text-gray-500">
              <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {template.config.schedule_type.charAt(0).toUpperCase() + template.config.schedule_type.slice(1)} updates
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-2">🔍</div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">{t("No templates found")}</h3>
          <p className="text-xs text-gray-500">{t("Try adjusting your search")}</p>
        </div>
      )}
    </div>
  );
} 