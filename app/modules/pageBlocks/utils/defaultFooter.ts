import { TFunction } from "i18next";
import { FooterBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/footer/FooterBlockUtils";
import { defaultSocials } from "./defaultSocials";

export function defaultFooter({ t }: { t: TFunction }): FooterBlockDto {
  return {
    style: "columns",
    text: "Transform Reddit discussions into actionable insights",
    withDarkModeToggle: true,
    withLanguageSelector: true,
    withThemeSelector: true,
    sections: [
      {
        name: "Research Tools",
        items: [
          { name: "Market Research", href: "/features/market-research" },
          { name: "Product Feedback", href: "/features/product-feedback" },
          { name: "Brand Monitoring", href: "/features/brand-monitoring" },
          { name: "Research Templates", href: "/features/research-template" },
          { name: "Pricing", href: "/pricing" },
        ],
      },
      {
        name: "Resources",
        items: [
        
          { name: "Research Blog", href: "/blog" },
          { name: "Contact Support", href: "/contact" },
          { name: "Terms & Conditions", href: "/terms-and-conditions" },
          { name: "Privacy Policy", href: "/privacy-policy" },
        ],
      },
      {
        name: "Account",
        items: [
          { name: "Sign In", href: "/login" },
          { name: "Sign Up", href: "/register" },
          { name: "Dashboard", href: "/dashboard" },
          { name: "Settings", href: "/settings" },
        ],
      },
    ],
    socials: defaultSocials,
  };
}
