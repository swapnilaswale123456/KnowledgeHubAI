import { TFunction } from "i18next";
import { PageBlockDto } from "~/modules/pageBlocks/dtos/PageBlockDto";
import { defaultFooter } from "../defaultFooter";
import { defaultHeader } from "../defaultHeader";
import Constants from "~/application/Constants";
import { defaultTestimonials } from "../defaultTestimonials";
import { defaultGallery } from "../defaultGallery";
import { defaultFaq } from "../defaultFaq";

export function defaultLandingPage({ t }: { t: TFunction }) {
  const blocks: PageBlockDto[] = [
    // Banner
    {
      banner: {
        style: "top",
        text: "Find Your Next Customer on Reddit - Ready to Buy Now",
        textMd: "Stop cold outreach. Our AI finds Reddit users actively seeking solutions like yours.",
        cta: [{ text: "Get Started", href: "/pricing", isPrimary: true, target: "_blank" }],
      },
    },
    // Header
    { header: defaultHeader({ t }) },
    // Hero
    {
      hero: {
        style: "simple",
        headline: "Find Your Next Customer on Reddit",
        description: "Transform Reddit discussions into actionable insights. Our AI-powered platform analyzes millions of conversations to identify high-intent prospects, track trends, and uncover valuable market intelligence. Get comprehensive research reports and data-driven recommendations to make informed business decisions.",
        image: "https://qwcsbptoezmuwgyijrxp.supabase.co/storage/v1/object/public/novel/1703743532626-analytics%20(2).png",
        cta: [
          {
            text: "Get Started",
            href: "/pricing",
            isPrimary: true,
          },
          {
            text: "View Demo",
            href: "/contact",
            isPrimary: false,
          },
        ],
        topText: {
          text: "AI-Powered Research Platform",
        },
        bottomText: {
          link: {
            text: `v${Constants.VERSION} - Reddit Research Platform`,
            href: "/changelog",
          },
        },
      },
    },
   
    // Features
    {
      features: {
        style: "cards",
        topText: "AI-Powered Lead Generation",
        headline: "Everything You Need to Convert",
        subheadline: "Get direct access to qualified leads with complete context and engagement metrics.",
        cta: [
          { text: "View Pricing", isPrimary: true, href: "/pricing" },
          { text: "Contact Sales", isPrimary: false, href: "/contact" },
        ],
        grid: {
          columns: "3",
          gap: "lg",
        },
        items: [
          {
            name: "Target Your Market",
            description: "Select subreddits where your ideal customers are actively discussing problems your product solves.",
            img: `https://qwcsbptoezmuwgyijrxp.supabase.co/storage/v1/object/public/novel/1703743532626-analytics%20(2).png`,
            link: { text: "Learn More", href: "/features/market-research" },
            subFeatures: [
              { name: "Subreddit Selection" },
              { name: "Audience Targeting" },
              { name: "Problem Analysis" }
            ],
            highlight: { text: "Precision Targeting" },
            theme: "gradient-orange"
          },
          {
            name: "AI-Powered Discovery",
            description: "Our advanced AI analyzes millions of conversations in real-time to identify high-intent prospects actively seeking solutions.",
            img: `https://qwcsbptoezmuwgyijrxp.supabase.co/storage/v1/object/public/novel/1704917949886-my-subscription.png`,
            link: { text: "Learn More", href: "/features/product-feedback" },
            subFeatures: [
              { name: "Real-time Analysis" },
              { name: "Intent Detection" },
              { name: "Lead Scoring" }
            ],
            highlight: { text: "Smart Discovery" },
            theme: "gradient-blue"
          },
          {
            name: "Ready for Sales",
            description: "Convert warm leads into customers with direct links to relevant discussions and personalized outreach suggestions.",
            img: `https://qwcsbptoezmuwgyijrxp.supabase.co/storage/v1/object/public/novel/1703830927472-app-portal-dashboard.png`,
            link: { text: "Learn More", href: "/features/brand-monitoring" },
            subFeatures: [
              { name: "Direct Links" },
              { name: "Engagement Metrics" },
              { name: "Outreach Templates" }
            ],
            highlight: { text: "Sales Ready" },
            theme: "gradient-purple"
          },
        ],
      },
    },
    // Gallery
    {
      layout: {
        padding: { y: "py-12" },
      },
      gallery: {
        style: "carousel",
        topText: "Platform Overview",
        headline: "Comprehensive Research Dashboard",
        subheadline: "Get detailed insights and analytics about Reddit discussions, user sentiment, and potential leads.",
        items: [
          {
            type: "image",
            title: "Executive Summary Dashboard - View total activities, topic diversity, and community impact at a glance",
            src: "/images/dashboard/executive-summary.png"
          },
          {
            type: "image",
            title: "Top Redditor Leads - Track influence score, expertise level, activity level, and engagement quality",
            src: "/images/dashboard/redditor-leads.PNG"
          },
          {
            type: "image",
            title: "Sentiment Analysis - Analyze sentiment distribution and topic diversity across discussions",
            src: "/images/dashboard/sentiment-analysis.PNG"
          },
          {
            type: "image",
            title: "Research Metrics - Monitor key metrics including relevance scores, content quality, and engagement rates",
            src: "/images/dashboard/research-metrics.PNG"
          }
        ],
      },
    },
    // How It Works Section
    {
      features: {
        style: "cards",
        topText: "Simple Process",
        headline: "Find Reddit Users in Minutes",
        subheadline: "Our AI-powered platform makes it easy to find and connect with your ideal customers.",
        grid: {
          columns: "3",
          gap: "lg",
        },
        items: [
          {
            name: "Describe Your Request",
            description: "Tell us exactly what you're looking for - your target audience, product category, and goals.",
            icon: "✍️",
            highlight: { text: "Step 1" },
            theme: "glass-effect"
          },
          {
            name: "AI Agent Generation",
            description: "Our custom AI analyzes your needs and creates a specialized search agent.",
            icon: "🤖",
            highlight: { text: "Step 2" },
            theme: "glass-effect"
          },
          {
            name: "Find Reddit Users",
            description: "Connect with subject matter experts and potential customers who match your criteria.",
            icon: "🎯",
            highlight: { text: "Step 3" },
            theme: "glass-effect"
          },
        ],
      },
    },
    // Use Cases Section
    {
      features: {
        style: "cards",
        topText: "Versatile Applications",
        headline: "What Can You Use It For?",
        subheadline: "Discover the various ways our platform can help your business grow.",
        grid: {
          columns: "3",
          gap: "lg",
        },
        items: [
          {
            name: "Lead Generation & Sales",
            description: "Find potential customers actively looking to buy products like yours.",
            icon: "💼",
            highlight: { text: "High Intent Leads" },
            theme: "border-accent"
          },
          {
            name: "Talent & Recruitment",
            description: "Identify skilled professionals ready for new opportunities.",
            icon: "👥",
            highlight: { text: "Top Talent" },
            theme: "border-accent"
          },
          {
            name: "Market Research",
            description: "Analyze what your target audience really thinks about your industry.",
            icon: "📊",
            highlight: { text: "Real Insights" },
            theme: "border-accent"
          },
          {
            name: "Learning & Development",
            description: "Find experts willing to share their knowledge and mentor others.",
            icon: "📚",
            highlight: { text: "Expert Guidance" },
            theme: "border-accent"
          },
          {
            name: "Business Development",
            description: "Connect with potential partners who complement your business.",
            icon: "🤝",
            highlight: { text: "Strategic Partners" },
            theme: "border-accent"
          },
          {
            name: "Content & Marketing",
            description: "Discover proven creators to amplify your brand's message.",
            icon: "📢",
            highlight: { text: "Content Creators" },
            theme: "border-accent"
          },
        ],
      },
    },
    // Statistics Section
    {
      features: {
        style: "cards",
        topText: "Our Impact",
        headline: "Our Impact in Numbers",
        subheadline: "Join thousands of businesses finding their next customers on Reddit",
        grid: {
          columns: "4",
          gap: "lg",
        },
        items: [
          {
            name: "4,500+",
            description: "Expert Profiles",
            icon: "👥",
            highlight: { text: "Verified Experts" },
            theme: "minimal-dark"
          },
          {
            name: "100k+",
            description: "Comments Analyzed",
            icon: "💬",
            highlight: { text: "Data Points" },
            theme: "minimal-dark"
          },
          {
            name: "100+",
            description: "Active Subreddits",
            icon: "🎯",
            highlight: { text: "Communities" },
            theme: "minimal-dark"
          },
          {
            name: "20k+",
            description: "Posts Examined",
            icon: "📝",
            highlight: { text: "Content Analyzed" },
            theme: "minimal-dark"
          },
        ],
      },
    },
    // How We Find Experts Section
    {
      features: {
        style: "cards",
        topText: "Our Process",
        headline: "How We Find Reddit Experts",
        subheadline: "Our algorithm analyzes public Reddit data to identify and validate genuine experts.",
        grid: {
          columns: "2",
          gap: "lg",
        },
        items: [
          {
            name: "Comments & Posts",
            description: "We analyze comments and posts on content and quality to identify top contributors.",
            icon: "📝",
            theme: "floating-shadow"
          },
          {
            name: "Karma Tracking",
            description: "Track user karma to validate expertise and community recognition.",
            icon: "⭐",
            theme: "floating-shadow"
          },
          {
            name: "Consistency Check",
            description: "Monitor long-term Reddit Activity patterns.",
            icon: "📈",
            theme: "floating-shadow"
          },
          {
            name: "Profile Analysis",
            description: "Deep scan of user history to identify expertise areas and knowledge patterns.",
            icon: "🔍",
            theme: "floating-shadow"
          },
        ],
      },
    },
    // Predefined Templates Section
    {
      features: {
        style: "cards",
        topText: "Ready-to-Use Templates",
        headline: "Start with Predefined Templates",
        subheadline: "Choose from our collection of expertly crafted templates to kickstart your research.",
        grid: {
          columns: "3",
          gap: "lg",
        },
        items: [
          {
            name: "Product Feedback",
            description: "Find users discussing product features, bugs, and suggestions to improve your offering.",
            icon: "💡",
            highlight: { text: "Most Popular" },
            subFeatures: [
              { name: "Feature Requests" },
              { name: "Bug Reports" },
              { name: "User Experience" }
            ],
            theme: "gradient-blue",
            link: { text: "Use Template", href: "/templates/product-feedback" }
          },
          {
            name: "Market Research",
            description: "Analyze market trends, competitor mentions, and industry discussions.",
            icon: "📊",
            highlight: { text: "Trending" },
            subFeatures: [
              { name: "Competitor Analysis" },
              { name: "Industry Trends" },
              { name: "User Pain Points" }
            ],
            theme: "gradient-purple",
            link: { text: "Use Template", href: "/templates/market-research" }
          },
          {
            name: "Lead Generation",
            description: "Identify potential customers actively looking for solutions like yours.",
            icon: "🎯",
            highlight: { text: "High ROI" },
            subFeatures: [
              { name: "Purchase Intent" },
              { name: "Solution Seeking" },
              { name: "Problem Discussion" }
            ],
            theme: "gradient-orange",
            link: { text: "Use Template", href: "/templates/lead-generation" }
          },
          {
            name: "Content Ideas",
            description: "Discover trending topics and questions your audience is asking.",
            icon: "✍️",
            highlight: { text: "Content Strategy" },
            subFeatures: [
              { name: "Topic Research" },
              { name: "FAQ Mining" },
              { name: "Content Gaps" }
            ],
            theme: "glass-effect",
            link: { text: "Use Template", href: "/templates/content-ideas" }
          },
          {
            name: "Expert Finder",
            description: "Find subject matter experts and thought leaders in your industry.",
            icon: "👥",
            highlight: { text: "Networking" },
            subFeatures: [
              { name: "Expert Identification" },
              { name: "Knowledge Validation" },
              { name: "Engagement History" }
            ],
            theme: "border-accent",
            link: { text: "Use Template", href: "/templates/expert-finder" }
          },
          {
            name: "Community Pulse",
            description: "Monitor community sentiment and engagement around specific topics.",
            icon: "📈",
            highlight: { text: "Real-time" },
            subFeatures: [
              { name: "Sentiment Analysis" },
              { name: "Topic Tracking" },
              { name: "Engagement Metrics" }
            ],
            theme: "floating-shadow",
            link: { text: "Use Template", href: "/templates/community-pulse" }
          }
        ],
      },
    },
    // Pricing
    {
      pricing: {
        style: "simple",
        headline: "Choose Your Research Plan",
        subheadline: "Start analyzing Reddit discussions with our flexible pricing options.",
      },
    },
    // Community
    {
      community: {
        style: "simple",
        headline: "Join Our Research Community",
        subheadline: "Connect with other researchers and share insights about Reddit analysis.",
        withName: false,
        cta: [
          {
            text: "Get Started",
            href: "/pricing",
          },
          {
            text: "Join Discord",
            href: "https://discord.gg/KMkjU2BFn9",
          },
          {
            text: "Follow Updates",
            href: "https://www.youtube.com/@saasrock",
          },
        ],
      },
    },
    // Testimonials
    {
      testimonials: {
        style: "simple",
        headline: "What Our Users Say",
        subheadline: "See how teams are using our platform to gain insights from Reddit discussions.",
        items: defaultTestimonials,
      },
    },
    // Newsletter
    {
      newsletter: {
        style: "simple",
        headline: "Stay Updated with Reddit Research",
        subheadline: "Get the latest updates and tips for Reddit research.",
      },
    },
    // Faq
    {
      faq: {
        style: "simple",
        headline: "Frequently Asked Questions",
        subheadline: "Everything you need to know about our Reddit research platform.",
        items: defaultFaq({ t }),
      },
    },
    // Footer
    {
      footer: defaultFooter({ t }),
    },
  ];
  return blocks;
}
