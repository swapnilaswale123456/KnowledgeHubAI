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
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "product-feedback");
  const { t } = await time(getTranslations(request), "getTranslations");
  const page = await time(getCurrentPage({ request, params, slug: "/features/product-feedback" }), "getCurrentPage.product-feedback");
  
  const data: LoaderData = {
    ...page,
    t,
  };
  
  return json(data, { headers: getServerTimingHeader() });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return data?.metatags || defaultSeoMetaTags({ t: data?.t, slug: "/features/product-feedback" });
};

export default function ProductFeedbackRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  
  const features: FeaturesBlockDto = {
    style: "groups",
    headline: "Product Feedback Features",
    subheadline: "Gather and analyze user feedback from Reddit to improve your product development and customer satisfaction.",
    color: Colors.GREEN,
    items: [
      {
        name: "Feature Request Tracking",
        description: "Identify and prioritize feature requests from Reddit discussions to guide your product roadmap.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>`,
        subFeatures: [
          { name: "Request Aggregation", description: "Collect and organize feature requests from multiple subreddits" },
          { name: "Priority Scoring", description: "Score and rank feature requests based on user demand" },
          { name: "Trending Features", description: "Identify which features are gaining traction over time" }
        ],
        highlight: { text: "User-Driven Development", color: Colors.GREEN }
      },
      {
        name: "Bug Detection",
        description: "Identify and track reported bugs and issues across Reddit discussions to improve product stability.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>`,
        subFeatures: [
          { name: "Issue Tracking", description: "Monitor and categorize reported bugs and issues" },
          { name: "Reproduction Steps", description: "Extract detailed bug reproduction steps from discussions" },
          { name: "Impact Assessment", description: "Evaluate the impact and severity of reported issues" }
        ],
        highlight: { text: "Proactive Support", color: Colors.GREEN }
      },
      {
        name: "User Experience Insights",
        description: "Gain valuable insights into user experience issues and opportunities for improvement.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>`,
        subFeatures: [
          { name: "Usability Feedback", description: "Identify usability issues and friction points" },
          { name: "Workflow Analysis", description: "Understand how users interact with your product" },
          { name: "Improvement Opportunities", description: "Discover areas for UX enhancement" }
        ],
        highlight: { text: "Enhanced Experience", color: Colors.GREEN }
      }
    ],
    cta: [
      {
        text: "Start Collecting Feedback",
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
    subheadline: "Common questions about our product feedback features",
    items: [
      {
        question: "How does Reddit feedback compare to traditional user testing?",
        answer: "Reddit feedback offers several advantages over traditional user testing. It provides a larger, more diverse sample size, captures authentic user experiences in real-world contexts, and often reveals issues that might not surface in controlled testing environments. Additionally, Reddit discussions can provide immediate feedback on new features or changes."
      },
      {
        question: "Can I track feedback for specific product features?",
        answer: "Yes, our platform allows you to create custom tracking for specific product features, components, or functionality. You can set up targeted monitoring for new features, track sentiment changes after updates, and compare feedback across different product versions or iterations."
      },
      {
        question: "How do you handle duplicate feedback or similar issues?",
        answer: "Our AI-powered system automatically clusters similar feedback and issues, reducing noise and helping you focus on the most important problems. The platform identifies patterns across discussions, groups related feedback, and provides a consolidated view of common issues and feature requests."
      },
      {
        question: "Can I integrate this feedback with my product management tools?",
        answer: "Absolutely! Our platform offers integrations with popular product management tools like Jira, Trello, and GitHub. You can automatically create tickets, track issues, and sync feedback data to streamline your product development workflow."
      },
      {
        question: "How do you ensure the feedback is representative of my user base?",
        answer: "We provide demographic and user segment analysis to help you understand which user groups are providing feedback. This allows you to identify potential biases and ensure your product decisions are based on representative feedback from your target audience."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <HeaderBlock />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Product Feedback Features
            </h1>
            <p className="mt-6 text-xl max-w-3xl mx-auto">
              Gather and analyze user feedback from Reddit to improve your product development and customer satisfaction.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link 
                to="/pricing" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#FF4500] hover:bg-[#FF5722] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF4500]"
              >
                Start Collecting Feedback
              </Link>
              <Link 
                to="/contact" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-500 bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
            <h2 className="text-3xl font-extrabold text-gray-900">Product Feedback Use Cases</h2>
            <p className="mt-4 text-lg text-gray-600">Discover how our platform helps product teams make data-driven decisions</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 text-green-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Product Roadmap Planning</h3>
                <p className="text-gray-600">Prioritize features and improvements based on real user feedback and demand, ensuring your product roadmap aligns with customer needs.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 text-green-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quality Assurance</h3>
                <p className="text-gray-600">Identify and address bugs and issues before they impact a large number of users, improving product stability and user satisfaction.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 text-green-600">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">User Experience Optimization</h3>
                <p className="text-gray-600">Identify usability issues and opportunities to enhance the user experience, leading to higher satisfaction and retention rates.</p>
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
      <div className="bg-green-600 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold">Ready to improve your product with user feedback?</h2>
          <p className="mt-4 text-xl max-w-3xl mx-auto">
            Join hundreds of product teams using our platform to gather insights and enhance their products.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link 
              to="/pricing" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-green-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              Get Started
            </Link>
            <Link 
              to="/contact" 
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-500 bg-opacity-20 hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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