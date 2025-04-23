import { Colors } from "~/application/enums/shared/Colors";
import { GridBlockDto } from "../../shared/grid/GridBlockUtils";

export type FeaturesBlockStyle = "list" | "cards" | "groups";

export interface FeaturesBlockDto {
  style: FeaturesBlockStyle;
  title?: string;
  headline?: string;
  subheadline?: string;
  topText?: string;
  items: FeatureDto[];
  grid?: GridBlockDto;
  position?: "left" | "right" | "center";
  color?: Colors;
  cta?: {
    text: string;
    href: string;
    isPrimary: boolean;
    target?: undefined | "_blank";
    icon?: string;
  }[];
}

export interface FeatureDto {
  name: string;
  description: string;
  icon?: string;
  img?: string;
  link?: {
    text: string;
    href: string;
    target?: undefined | "_blank";
  };
  subFeatures?: {
    name: string;
    description?: string;
  }[];
  highlight?: {
    text: string;
    color?: Colors;
  };
  logos?: {
    title?: string;
    items: {
      img?: string;
      name?: string;
    }[];
  };
  disabled?: boolean;
} 