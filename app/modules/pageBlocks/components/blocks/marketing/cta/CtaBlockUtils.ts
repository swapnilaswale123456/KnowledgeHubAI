import { Colors } from "~/application/enums/shared/Colors";

export type CtaBlockDto = {
  style: CtaBlockStyle;
  headline: string;
  description: string;
  color?: Colors;
  cta: {
    text: string;
    href: string;
    isPrimary: boolean;
    target?: undefined | "_blank";
    icon?: string;
  }[];
};

export const CtaBlockStyles = [
  { value: "simple", name: "Simple" },
  { value: "withImage", name: "With Image" },
  { value: "split", name: "Split" },
] as const;

export type CtaBlockStyle = (typeof CtaBlockStyles)[number]["value"];

export const defaultCtaBlock: CtaBlockDto = {
  style: "simple",
  headline: "Ready to get started?",
  description: "Join thousands of researchers and analysts who use our platform to gather insights from Reddit.",
  color: Colors.BLUE,
  cta: [
    {
      text: "Get Started",
      href: "/signup",
      isPrimary: true,
    },
    {
      text: "View Demo",
      href: "/demo",
      isPrimary: false,
    },
  ],
}; 