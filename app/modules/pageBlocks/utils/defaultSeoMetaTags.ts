import { TFunction } from "i18next";
import { MetaTagsDto } from "~/application/dtos/seo/MetaTagsDto";

type SiteTags = {
  title: string;
  description: string;
  keywords: string;
  image: string;
  thumbnail: string;
  twitterCreator: string;
  twitterSite: string;
};
export function getDefaultSiteTags(): SiteTags {
  return {
    title: "Reddit Research | Reddit Research & Analytics Platform",
    description:
      "Transform Reddit discussions into actionable insights. Monitor trends, analyze sentiment, and track brand mentions across subreddits. AI-powered research platform for market analysis, product feedback, and brand monitoring.",
    keywords: "reddit,research,analytics,market-research,product-feedback,brand-monitoring,sentiment-analysis,trend-tracking,subreddit,data-analysis,ai,insights",
    image: "https://qwcsbptoezmuwgyijrxp.supabase.co/storage/v1/object/public/novel/1703743532626-analytics%20(2).png",
    thumbnail: "https://qwcsbptoezmuwgyijrxp.supabase.co/storage/v1/object/public/novel/1703743532626-analytics%20(2).png",
    twitterCreator: "@KnowledgeHubAI",
    twitterSite: "@KnowledgeHubAI",
  };
}

export function defaultSeoMetaTags({ t, slug }: { t: TFunction; slug?: string }): MetaTagsDto {
  const siteTags = getDefaultSiteTags();
  if (slug === "/pricing") {
    siteTags.title = `${t("front.pricing.title")} | Reddit Research Plans`;
    siteTags.description = t("front.pricing.headline");
  } else if (slug === "/blog") {
    siteTags.title = `${t("blog.title")} | Reddit Research Insights`;
    siteTags.description = t("blog.headline");
  } else if (slug === "/contact") {
    siteTags.title = `${t("front.contact.title")} | Get Reddit Research Support`;
    siteTags.description = t("front.contact.headline");
  } else if (slug === "/newsletter") {
    siteTags.title = `${t("front.newsletter.title")} | Reddit Research Updates`;
    siteTags.description = t("front.newsletter.headline");
  } else if (slug === "/changelog") {
    siteTags.title = `${t("front.changelog.title")} | Reddit Research Platform Updates`;
    siteTags.description = t("front.changelog.headline");
  }
  return parseMetaTags(siteTags);
}

function parseMetaTags(tags: SiteTags): MetaTagsDto {
  return [
    { title: tags.title },
    { name: "description", content: tags.description },
    { name: "keywords", content: tags.keywords },
    { property: "og:title", content: tags.title },
    { property: "og:type", content: "website" },
    { property: "og:image", content: tags.image },
    { property: "og:card", content: "summary_large_image" },
    { property: "og:description", content: tags.description },
    { property: "twitter:image", content: tags.thumbnail },
    { property: "twitter:card", content: "summary_large_image" },
    { property: "twitter:creator", content: tags.twitterCreator ?? "" },
    { property: "og:creator", content: tags.twitterCreator },
    { property: "twitter:site", content: tags.twitterSite ?? "" },
    { property: "twitter:title", content: tags.title },
    { property: "twitter:description", content: tags.description },
  ];
}
