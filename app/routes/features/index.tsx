import { useTranslation } from "react-i18next";
import { Colors } from "~/application/enums/shared/Colors";
import { FeaturesBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/features/FeaturesBlockUtils";
import { FaqBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/faq/FaqBlockUtils";
import HeaderBlock from "~/modules/pageBlocks/components/blocks/marketing/header/HeaderBlock";
import FooterBlock from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlock";
import FeaturesBlock from "~/modules/pageBlocks/components/blocks/marketing/features/FeaturesBlock";
import FaqBlock from "~/modules/pageBlocks/components/blocks/marketing/faq/FaqBlock";
import { defaultSeoMetaTags } from "~/modules/pageBlocks/utils/defaultSeoMetaTags";
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { getTranslations } from "~/locale/i18next.server";
import { getCurrentPage } from "~/modules/pageBlocks/services/.server/pagesService";
import { createMetrics } from "~/modules/metrics/services/.server/MetricTracker";
import { PageLoaderData } from "~/modules/pageBlocks/dtos/PageBlockData";
import { useTypedLoaderData } from "remix-typedjson";

type LoaderData = PageLoaderData & {
  t: any;
};

export const handle = { i18n: "translations" };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "features");
  const { t } = await time(getTranslations(request), "getTranslations");
  const page = await time(getCurrentPage({ request, params, slug: "/features" }), "getCurrentPage.features");
  
  const data: LoaderData = {
    ...page,
    t,
  };
  
  return json(data, { headers: getServerTimingHeader() });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return data?.metatags || defaultSeoMetaTags({ t: data?.t, slug: "/features" });
};

export default function FeaturesRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  
  const features: FeaturesBlockDto = {
    style: "groups",
    headline: "Research Features",
    subheadline: "Discover our comprehensive suite of research tools designed to help you analyze Reddit discussions and gain valuable insights.",
    color: Colors.PURPLE,
    items: [
      {
        name: "Market Research",
        description: "Track industry trends, monitor competitor discussions, and analyze market sentiment across subreddits.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>`,
        subFeatures: [
          { name: "Trend Analysis", description: "Identify emerging trends and topics" },
          { name: "Competitor Monitoring", description: "Track competitor discussions and strategies" },
          { name: "Market Sentiment", description: "Analyze overall market sentiment" }
        ],
        highlight: { text: "Market Insights", color: Colors.PURPLE }
      },
      {
        name: "Brand Monitoring",
        description: "Track brand mentions, analyze sentiment, and monitor customer discussions across Reddit communities.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>`,
        subFeatures: [
          { name: "Mention Tracking", description: "Monitor brand mentions in real-time" },
          { name: "Sentiment Analysis", description: "Understand customer sentiment" },
          { name: "Crisis Monitoring", description: "Stay ahead of potential issues" }
        ],
        highlight: { text: "Brand Protection", color: Colors.PURPLE }
      },
      {
        name: "Product Feedback",
        description: "Gather and analyze user feedback from Reddit to improve your product development and customer satisfaction.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>`,
        subFeatures: [
          { name: "Feature Requests", description: "Track and prioritize feature requests" },
          { name: "Bug Detection", description: "Identify and track reported issues" },
          { name: "User Experience", description: "Gain insights into user experience" }
        ],
        highlight: { text: "Product Improvement", color: Colors.PURPLE }
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
    subheadline: "Common questions about our research features",
    items: [
      {
        question: "How does Reddit research help with market analysis?",
        answer: "Reddit provides a wealth of authentic user discussions that can reveal consumer preferences, pain points, and emerging trends. Our platform aggregates and analyzes this data to give you actionable market insights that traditional research methods might miss."
      },
      {
        question: "Which subreddits are monitored for research?",
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
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Research Features
            </h1>
            <p className="mt-6 text-xl max-w-3xl mx-auto">
              Discover our comprehensive suite of research tools designed to help you analyze Reddit discussions and gain valuable insights.
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
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-500 bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
            <h2 className="text-3xl font-extrabold text-gray-900">Research Use Cases</h2>
            <p className="mt-4 text-lg text-gray-600">Discover how our platform helps businesses make data-driven decisions</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 text-purple-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Market Analysis</h3>
                <p className="text-gray-600">Track industry trends, monitor competitor activities, and analyze market sentiment to make informed business decisions.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 text-purple-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Brand Monitoring</h3>
                <p className="text-gray-600">Track brand mentions, analyze sentiment, and monitor customer discussions to protect and enhance your brand reputation.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 text-purple-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Product Feedback</h3>
                <p className="text-gray-600">Gather and analyze user feedback to improve your product development and enhance customer satisfaction.</p>
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
      <div className="bg-purple-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to start your research?
          </h2>
          <p className="mt-4 text-lg text-purple-200">
            Join hundreds of businesses using our platform to gain valuable insights from Reddit discussions.
          </p>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-purple-600 bg-white hover:bg-purple-50"
              >
                Get Started
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-500 hover:bg-purple-600"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <FooterBlock />
    </div>
  );
}