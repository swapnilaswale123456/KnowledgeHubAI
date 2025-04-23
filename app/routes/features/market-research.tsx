import { useTranslation } from "react-i18next";
import { Colors } from "~/application/enums/shared/Colors";
import { FeaturesBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/features/FeaturesBlockUtils";
import FeaturesBlock from "~/modules/pageBlocks/components/blocks/marketing/features/FeaturesBlock";
import { defaultSeoMetaTags } from "~/modules/pageBlocks/utils/defaultSeoMetaTags";
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getTranslations } from "~/locale/i18next.server";
import HeaderBlock from "~/modules/pageBlocks/components/blocks/marketing/header/HeaderBlock";
import FooterBlock from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlock";
import { getCurrentPage } from "~/modules/pageBlocks/services/.server/pagesService";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { PageLoaderData } from "~/modules/pageBlocks/dtos/PageBlockData";
import { useTypedLoaderData } from "remix-typedjson";
import { Link } from "@remix-run/react";
import { FaqBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/faq/FaqBlockUtils";
import FaqBlock from "~/modules/pageBlocks/components/blocks/marketing/faq/FaqBlock";

type LoaderData = PageLoaderData & {
  t: any;
};

export const handle = { i18n: "translations" };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "market-research");
  const { t } = await time(getTranslations(request), "getTranslations");
  const page = await time(getCurrentPage({ request, params, slug: "/features/market-research" }), "getCurrentPage.market-research");
  
  const data: LoaderData = {
    ...page,
    t,
  };
  
  return json(data, { headers: getServerTimingHeader() });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return data?.metatags || defaultSeoMetaTags({ t: data?.t, slug: "/features/market-research" });
};

export default function MarketResearchRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  
  const features: FeaturesBlockDto = {
    style: "groups",
    headline: "Market Research Features",
    subheadline: "Transform Reddit discussions into actionable market insights with our comprehensive research tools.",
    color: Colors.BLUE,
    items: [
      {
        name: "Trend Analysis",
        description: "Identify emerging trends and topics in your industry by analyzing Reddit discussions across multiple subreddits.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>`,
        subFeatures: [
          { name: "Topic Discovery", description: "Find trending topics and discussions in your industry" },
          { name: "Volume Analysis", description: "Track discussion volume and growth over time" },
          { name: "Content Clustering", description: "Group related discussions for deeper insights" }
        ],
        highlight: { text: "Real-time Trends", color: Colors.BLUE }
      },
      {
        name: "Sentiment Tracking",
        description: "Monitor and analyze sentiment across Reddit discussions to understand public opinion and market perception.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
        </svg>`,
        subFeatures: [
          { name: "Sentiment Analysis", description: "AI-powered sentiment analysis of discussions" },
          { name: "Emotion Detection", description: "Identify emotional patterns in user responses" },
          { name: "Sentiment Trends", description: "Track sentiment changes over time" }
        ],
        highlight: { text: "Deep Insights", color: Colors.BLUE }
      },
      {
        name: "Competitor Monitoring",
        description: "Track and analyze competitor mentions, product discussions, and market positioning across Reddit.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
        </svg>`,
        subFeatures: [
          { name: "Brand Mentions", description: "Track competitor brand mentions and discussions" },
          { name: "Product Comparisons", description: "Analyze product comparison discussions" },
          { name: "Market Share", description: "Estimate market share from Reddit discussions" }
        ],
        highlight: { text: "Competitive Edge", color: Colors.BLUE }
      }
    ],
    cta: [
      {
        text: "Start Researching",
        href: "/pricing",
        isPrimary: true
      },
      {
        text: "View Demo",
        href: "/contact",
        isPrimary: false
      }
    ]
  };

  const faq: FaqBlockDto = {
    style: "simple",
    headline: "Frequently Asked Questions",
    subheadline: "Common questions about our market research features",
    items: [
      {
        question: "How does Reddit research help with market analysis?",
        answer: "Reddit provides a wealth of authentic user discussions that can reveal consumer preferences, pain points, and emerging trends. Our platform aggregates and analyzes this data to give you actionable market insights that traditional research methods might miss."
      },
      {
        question: "Which subreddits are monitored for market research?",
        answer: "Our platform allows you to monitor any subreddits relevant to your industry. We provide recommendations based on your research goals, but you have full control to add, remove, or prioritize specific subreddits for your analysis."
      },
      {
        question: "How accurate is the sentiment analysis?",
        answer: "Our sentiment analysis uses advanced AI models trained on millions of Reddit comments. It can detect nuanced emotions and context-specific sentiment with high accuracy. The system continuously learns and improves from new data."
      },
      {
        question: "Can I export the research data for reports?",
        answer: "Yes, all research data can be exported in various formats including CSV, PDF, and interactive dashboards. This makes it easy to incorporate Reddit insights into your market reports, presentations, and strategic planning documents."
      },
      {
        question: "How often is the data updated?",
        answer: "Our platform monitors Reddit discussions in real-time, with data refreshed continuously. You can set custom update frequencies for different types of analysis, from real-time alerts to daily or weekly summary reports."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <HeaderBlock />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Market Research Features
            </h1>
            <p className="mt-6 text-xl max-w-3xl mx-auto">
              Transform Reddit discussions into actionable market insights with our comprehensive research tools.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link 
                to="/pricing" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#FF4500] hover:bg-[#FF5722] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
              >
                Start Researching
              </Link>
              <Link 
                to="/contact" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-500 bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <FeaturesBlock item={features} />
      </div>
      
      {/* Use Cases Section */}
      <div className="bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">Market Research Use Cases</h2>
            <p className="mt-4 text-lg text-gray-600">Discover how our platform helps businesses make data-driven decisions</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 text-blue-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Product Development</h3>
                <p className="text-gray-600">Identify feature requests, pain points, and user needs to guide your product roadmap and prioritize development efforts.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 text-blue-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Market Entry Strategy</h3>
                <p className="text-gray-600">Analyze market gaps, competitor strengths, and consumer preferences to develop effective market entry strategies.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 text-blue-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Content Marketing</h3>
                <p className="text-gray-600">Discover trending topics, common questions, and content gaps to create targeted content that resonates with your audience.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <FaqBlock item={faq} />
      </div>
      
      {/* CTA Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold">Ready to transform your market research?</h2>
          <p className="mt-4 text-xl max-w-3xl mx-auto">
            Join hundreds of businesses using our platform to gain competitive insights from Reddit discussions.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link 
              to="/pricing" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              Get Started
            </Link>
            <Link 
              to="/contact" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-500 bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
      
      <FooterBlock />
    </div>
  );
} 