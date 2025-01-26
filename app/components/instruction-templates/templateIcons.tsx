import { 
  HeadphonesIcon, 
  GraduationCap, 
  ShoppingBag,
  Wrench,
  Clipboard,
  LucideIcon
} from "lucide-react";
import { createElement } from "react";

type IconMap = {
  [key: string]: LucideIcon;
};

const icons: IconMap = {
  'Customer Support Bot': HeadphonesIcon,
  'E-Learning Assistant': GraduationCap,
  'Sales Assistant': ShoppingBag,
  'Technical Support': Wrench,
  'HR Assistant': Clipboard,
};

export function getTemplateIcon(templateName: string) {
  const Icon = icons[templateName] || Clipboard;
  return createElement(Icon, { className: "w-5 h-5" });
} 