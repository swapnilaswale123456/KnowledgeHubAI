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
        text: "Reddit Research Hub - Your AI-Powered Research Assistant",
        textMd: "Transform Reddit discussions into actionable insights",
        cta: [{ text: "Get Started", href: "/pricing", isPrimary: true, target: "_blank" }],
      },
    },
    // Header
    { header: defaultHeader({ t }) },
    // Hero
    {
      hero: {
        style: "simple",
        headline: "Unlock Reddit's Hidden Insights with AI",
        description: "Monitor discussions, track trends, and analyze sentiment across subreddits to make data-driven decisions.",
        image: "https://qwcsbptoezmuwgyijrxp.supabase.co/storage/v1/object/public/novel/1703743532626-analytics%20(2).png",
        cta: [
          {
            text: "Start Researching",
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
          text: "Powered by Advanced AI",
        },
        bottomText: {
          link: {
            text: `v${Constants.VERSION} - Reddit Research Platform`,
            href: "/changelog",
          },
        },
      },
    },
    // Logo Clouds
    {
      logoClouds: {
        style: "custom",
        headline: "Trusted by Research Teams",
        logos: [
          {
            alt: "Market Research",
            href: "#",
            src: "https://yahooder.sirv.com/saasrock/logos/clouds/colors/remix.png",
          },
          {
            alt: "Product Teams",
            href: "#",
            src: "https://yahooder.sirv.com/saasrock/logos/clouds/colors/tailwindcss.png",
          },
          {
            alt: "Brand Managers",
            href: "#",
            src: "https://yahooder.sirv.com/saasrock/logos/clouds/colors/prisma.png",
          },
        ],
      },
    },
    // Features
    {
      features: {
        style: "cards",
        topText: "Comprehensive Reddit Research",
        headline: "Everything You Need for Reddit Analysis",
        subheadline: "Monitor discussions, track trends, and analyze sentiment across subreddits with our powerful research tools.",
        cta: [
          { text: "View Pricing", isPrimary: true, href: "/pricing" },
          { text: "Contact Sales", isPrimary: false, href: "/contact" },
        ],
        grid: {
          columns: "3",
          gap: "md",
        },
        items: [
          {
            name: "Market Research",
            description: "Track industry trends, monitor competitor discussions, and analyze market sentiment across subreddits.",
            img: `https://qwcsbptoezmuwgyijrxp.supabase.co/storage/v1/object/public/novel/1703743532626-analytics%20(2).png`,
            link: { text: "Learn More", href: "/features/market-research" },
            subFeatures: [
              { name: "Trend Analysis" },
              { name: "Sentiment Tracking" },
              { name: "Competitor Monitoring" }
            ],
            highlight: { text: "Real-time Insights" },
          },
          {
            name: "Product Feedback",
            description: "Gather user feedback, track feature requests, and monitor product discussions to improve your offerings.",
            img: `https://qwcsbptoezmuwgyijrxp.supabase.co/storage/v1/object/public/novel/1704917949886-my-subscription.png`,
            link: { text: "Learn More", href: "/features/product-feedback" },
            subFeatures: [
              { name: "User Reviews" },
              { name: "Feature Requests" },
              { name: "Bug Reports" }
            ],
            highlight: { text: "User-Centric" },
          },
          {
            name: "Brand Monitoring",
            description: "Track brand mentions, analyze sentiment, and monitor customer discussions across Reddit communities.",
            img: `https://qwcsbptoezmuwgyijrxp.supabase.co/storage/v1/object/public/novel/1703830927472-app-portal-dashboard.png`,
            link: { text: "Learn More", href: "/features/brand-monitoring" },
            subFeatures: [
              { name: "Mention Tracking" },
              { name: "Sentiment Analysis" },
              { name: "Crisis Monitoring" }
            ],
            highlight: { text: "Brand Protection" },
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
        topText: "Powerful Research Tools",
        headline: "Transform Reddit Data into Actionable Insights",
        subheadline: "Our comprehensive research platform helps you monitor discussions, track trends, and analyze sentiment across subreddits.",
        items: [
          {
            type: "image",
            title: "Market Research Dashboard - Track industry trends and competitor discussions in real-time",
            src: "https://qwcsbptoezmuwgyijrxp.supabase.co/storage/v1/object/public/novel/1703743532626-analytics%20(2).png",
          },
          {
            type: "image",
            title: "Sentiment Analysis - Understand community sentiment and brand perception",
            src: "https://qwcsbptoezmuwgyijrxp.supabase.co/storage/v1/object/public/novel/1704917949886-my-subscription.png",
          },
          {
            type: "image",
            title: "Trend Tracking - Identify emerging trends and topics in your industry",
            src: "https://qwcsbptoezmuwgyijrxp.supabase.co/storage/v1/object/public/novel/1703830927472-app-portal-dashboard.png",
          },
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
