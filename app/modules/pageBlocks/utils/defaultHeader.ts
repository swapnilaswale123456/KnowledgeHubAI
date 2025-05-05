import { TFunction } from "i18next";
import { HeaderBlockDto } from "~/modules/pageBlocks/components/blocks/marketing/header/HeaderBlockUtils";

export function defaultHeader({ t }: { t: TFunction }): HeaderBlockDto {
  return {
    style: "simple",
    withLogo: true,
    withSignInAndSignUp: true,
    withDarkModeToggle: true,
    withLanguageSelector: true,
    withThemeSelector: true,
    links: [
      { path: "/features", title: "Research Features" },
      { path: "/features/research-template", title: "Research Templates" },
      { path: "/pricing", title: t("front.navbar.pricing") },
      {
        title: "Resources",
        items: [
          
          { path: "/blog", title: "Research Blog" },
          { path: "/contact", title: "Contact Support" },
        ],
      },
    ],
  };
}
