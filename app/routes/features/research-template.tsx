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
  const { time, getServerTimingHeader } = await createMetrics({ request, params }, "research-template");
  const { t } = await time(getTranslations(request), "getTranslations");
  const page = await time(getCurrentPage({ request, params, slug: "/features/research-template" }), "getCurrentPage.research-template");
  
  const data: LoaderData = {
    ...page,
    t,
  };
  
  return json(data, { headers: getServerTimingHeader() });
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return data?.metatags || defaultSeoMetaTags({ t: data?.t, slug: "/features/research-template" });
};

export default function ResearchTemplateRoute() {
  const { t } = useTranslation();
  const data = useTypedLoaderData<LoaderData>();
  
  const features: FeaturesBlockDto = {
    style: "groups",
    headline: "Research Template Features",
    subheadline: "Create and manage research templates to streamline your Reddit research process.",
    color: Colors.BLUE,
    items: [
      {
        name: "Template Management",
        description: "Create, edit, and organize research templates for different types of research projects.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>`,
        subFeatures: [
          { name: "Template Creation", description: "Create custom research templates with predefined settings" },
          { name: "Template Library", description: "Access and manage your research templates" },
          { name: "Template Sharing", description: "Share templates with team members" }
        ],
        highlight: { text: "Research Efficiency", color: Colors.BLUE }
      },
      {
        name: "Research Configuration",
        description: "Configure research parameters including subreddits, keywords, and analysis settings.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>`,
        subFeatures: [
          { name: "Subreddit Selection", description: "Choose target subreddits for research" },
          { name: "Keyword Configuration", description: "Set up keywords and search parameters" },
          { name: "Analysis Settings", description: "Configure analysis depth and metrics" }
        ],
        highlight: { text: "Custom Research", color: Colors.BLUE }
      },
      {
        name: "Template Analytics",
        description: "Track and analyze the performance of your research templates.",
        icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>`,
        subFeatures: [
          { name: "Usage Metrics", description: "Track template usage and effectiveness" },
          { name: "Performance Analysis", description: "Analyze research results quality" },
          { name: "Optimization Insights", description: "Get suggestions for template improvements" }
        ],
        highlight: { text: "Data-Driven", color: Colors.BLUE }
      }
    ],
    cta: [
      {
        text: "Start Using Templates",
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
    subheadline: "Common questions about our research template features",
    items: [
      {
        question: "How do research templates help streamline my research process?",
        answer: "Research templates help you save time by providing predefined configurations for different types of research. You can create templates for various research goals, such as market analysis, competitor research, or product feedback, and reuse them for consistent and efficient research."
      },
      {
        question: "Can I customize the templates to fit my specific needs?",
        answer: "Yes, our templates are fully customizable. You can modify subreddits, keywords, analysis settings, and other parameters to match your specific research requirements. You can also create entirely new templates from scratch."
      },
      {
        question: "How do I track the effectiveness of my templates?",
        answer: "Our platform provides analytics for each template, showing usage metrics, research quality scores, and performance indicators. This helps you identify which templates are most effective and where improvements can be made."
      },
      {
        question: "Can I share templates with my team?",
        answer: "Yes, you can share your research templates with team members. This promotes consistency across your organization and helps team members benefit from proven research configurations."
      },
      {
        question: "What types of research templates are available?",
        answer: "We offer templates for various research purposes, including market research, competitor analysis, product feedback, content strategy, and more. You can also create custom templates for specific research needs."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      <HeaderBlock />
    
      
      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <FeaturesBlock item={features} />
      </div>
      
      {/* Use Cases Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">Research Template Use Cases</h2>
          <p className="mt-4 text-lg text-gray-600">Discover how our templates can enhance your research process</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 text-blue-600">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Market Research</h3>
              <p className="text-gray-600">Create templates for comprehensive market research to identify trends and opportunities.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 text-blue-600">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Competitor Analysis</h3>
              <p className="text-gray-600">Track competitor activities and market positioning with predefined templates.</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-6 h-6 text-blue-600">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Product Feedback</h3>
              <p className="text-gray-600">Gather and analyze customer feedback using standardized research templates.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* FAQ Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <FaqBlock item={faq} />
      </div>
      
      {/* CTA Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-extrabold">Ready to streamline your research process?</h2>
        <p className="mt-4 text-xl max-w-3xl mx-auto">
          Join hundreds of researchers using our templates to enhance their research efficiency.
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
      
      <FooterBlock />
    </div>
  );
}
