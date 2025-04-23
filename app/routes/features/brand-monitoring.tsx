import { Colors } from "~/application/enums/shared/Colors";
import { FeaturesBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/features/FeaturesBlockUtils";
import { FaqBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/faq/FaqBlockUtils";
import { ContentBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/markdown/ContentBlockUtils";
import HeaderBlock from "~/modules/pageBlocks/components/blocks/marketing/header/HeaderBlock";
import FooterBlock from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlock";
import FeaturesBlock from "~/modules/pageBlocks/components/blocks/marketing/features/FeaturesBlock";
import FaqBlock from "~/modules/pageBlocks/components/blocks/marketing/faq/FaqBlock";
import ContentBlock from "~/modules/pageBlocks/components/blocks/marketing/markdown/ContentBlock";
import { json, LoaderFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { getPageBySlug } from "~/modules/pageBlocks/db/pages.db.server";
import { PageBlockDto } from "~/modules/pageBlocks/dtos/PageBlockDto";
import { parsePageBlocks } from "~/modules/pageBlocks/services/.server/pagesService";

type LoaderData = {
  page: {
    blocks: PageBlockDto[];
  } | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const page = await getPageBySlug("brand-monitoring");
  const blocks = page ? parsePageBlocks({ slug: page.slug, blocks: page.blocks }) : [];
  return json<LoaderData>({ 
    page: page ? { blocks } : null
  });
};

export default function BrandMonitoringRoute() {
  const features: FeaturesBlockDto = {
    style: "groups",
    headline: "Monitor Your Brand's Online Presence",
    subheadline: "Track mentions, analyze sentiment, and stay ahead of potential crises with our comprehensive brand monitoring tools.",
    color: Colors.EMERALD,
    items: [
      {
        name: "Mention Tracking",
        description: "Track every mention of your brand across Reddit communities in real-time. Never miss important conversations about your products or services.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>`,
        subFeatures: [
          { name: "Real-time Monitoring", description: "Track brand mentions across Reddit communities" },
          { name: "Keyword Tracking", description: "Monitor specific keywords and phrases" },
          { name: "Mention Analytics", description: "Analyze mention patterns and trends" }
        ],
        highlight: { text: "Brand Awareness", color: Colors.EMERALD }
      },
      {
        name: "Sentiment Analysis",
        description: "Understand the emotional tone behind brand mentions with our advanced sentiment analysis. Identify positive trends and address negative feedback promptly.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
        </svg>`,
        subFeatures: [
          { name: "Sentiment Scoring", description: "Measure positive, negative, and neutral sentiment" },
          { name: "Trend Analysis", description: "Track sentiment changes over time" },
          { name: "Emotion Detection", description: "Identify specific emotions in discussions" }
        ],
        highlight: { text: "Customer Insights", color: Colors.EMERALD }
      },
      {
        name: "Crisis Monitoring",
        description: "Get instant alerts when negative sentiment spikes or critical issues arise. Stay proactive in managing your brand's reputation.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>`,
        subFeatures: [
          { name: "Alert System", description: "Get notified of potential brand crises" },
          { name: "Issue Tracking", description: "Monitor and track brand-related issues" },
          { name: "Response Management", description: "Coordinate crisis response efforts" }
        ],
        highlight: { text: "Brand Protection", color: Colors.EMERALD }
      }
    ],
    cta: [
      {
        text: "Start Monitoring",
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
    items: [
      {
        question: "How does brand monitoring work?",
        answer: "Our AI-powered system continuously scans Reddit for mentions of your brand, analyzing the context and sentiment of each mention. You receive real-time notifications and detailed reports to help you understand and respond to brand-related discussions."
      },
      {
        question: "How accurate is the sentiment analysis?",
        answer: "Our sentiment analysis uses state-of-the-art natural language processing models, achieving over 90% accuracy in identifying positive, negative, and neutral sentiments. The system is continuously trained on Reddit-specific content to ensure high accuracy."
      },
      {
        question: "Can I integrate brand monitoring with other tools?",
        answer: "Yes! Our brand monitoring features can be integrated with popular CRM systems, social media management tools, and analytics platforms. We provide APIs and webhooks for seamless integration with your existing workflow."
      }
    ]
  };

  const content: ContentBlockDto = {
    style: "simple",
    content: "Monitor your brand's presence across Reddit communities with our comprehensive suite of tools. From tracking mentions to analyzing sentiment and managing potential crises, we help you stay informed and responsive to your audience's needs."
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <HeaderBlock />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-700 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Brand Monitoring
            </h1>
            <p className="mt-6 text-xl max-w-3xl mx-auto">
              Track mentions, analyze sentiment, and stay ahead of potential crises with our comprehensive brand monitoring tools.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link 
                to="/pricing" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#FF4500] hover:bg-[#FF5722] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
              >
                Start Monitoring
              </Link>
              <Link 
                to="/contact" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-500 bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
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
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Brand Monitoring Use Cases
            </h2>
            <p className="mt-4 text-xl text-gray-500">
              Discover how our platform helps businesses protect and enhance their brand
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Reputation Management
              </h3>
              <p className="mt-4 text-gray-500">
                Monitor and manage your brand's reputation by tracking mentions, sentiment, and addressing concerns proactively.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Crisis Prevention
              </h3>
              <p className="mt-4 text-gray-500">
                Identify potential issues early and take action before they escalate into full-blown crises.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Sentiment Analysis
              </h3>
              <p className="mt-4 text-gray-500">
                Track and analyze public sentiment about your brand to understand perception and improve customer satisfaction.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <FaqBlock item={faq} />
      </div>
      
      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to protect your brand?
          </h2>
          <p className="mt-4 text-lg text-indigo-200">
            Join hundreds of businesses using our platform to monitor and enhance their brand presence on Reddit.
          </p>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
              >
                Get Started
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600"
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