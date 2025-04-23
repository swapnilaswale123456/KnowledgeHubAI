import { Colors } from "~/application/enums/shared/Colors";
import { GridBlockDto, gridCols, gaps } from "~/modules/pageBlocks/components/blocks/shared/grid/GridBlockUtils";

export type HowItWorksBlockStyle = "steps" | "timeline" | "cards";

export interface HowItWorksBlockDto {
  style: HowItWorksBlockStyle;
  title?: string;
  headline?: string;
  subheadline?: string;
  topText?: string;
  items: HowItWorksItemDto[];
  grid?: GridBlockDto;
  position?: "left" | "right" | "center";
  color?: Colors;
  cta?: {
    text: string;
    href: string;
  };
}

export interface HowItWorksItemDto {
  title: string;
  description: string;
  icon?: string;
  img?: string;
  link?: {
    text: string;
    href: string;
  };
}

export const HowItWorksBlockStyles: HowItWorksBlockStyle[] = ["steps", "timeline", "cards"];

export const defaultHowItWorksBlock: HowItWorksBlockDto = {
  style: "steps",
  title: "How It Works",
  headline: "Find Your Perfect Customers on Reddit",
  subheadline: "Our AI-powered platform helps you discover and engage with your ideal customers in relevant subreddits",
  items: [
    {
      title: "Define Your Target Market",
      description: "Specify your ideal customer profile, including demographics, interests, and pain points",
      icon: "target",
    },
    {
      title: "Select Relevant Subreddits",
      description: "Choose from thousands of subreddits or let our AI suggest the most relevant ones for your market",
      icon: "subreddit",
    },
    {
      title: "Set Research Parameters",
      description: "Configure filters for post age, engagement metrics, and sentiment to focus on high-quality leads",
      icon: "settings",
    },
    {
      title: "AI-Powered Discovery",
      description: "Our AI analyzes discussions to identify potential customers and market opportunities",
      icon: "ai",
    },
    {
      title: "Engage & Convert",
      description: "Connect with potential customers through meaningful conversations and convert them into leads",
      icon: "conversion",
    },
  ],
  grid: {
    columns: "3" as const,
    gap: "md" as const,
  },
  position: "center",
  color: Colors.BLUE,
  cta: {
    text: "Start Your Research",
    href: "/app/research/new",
  },
}; 