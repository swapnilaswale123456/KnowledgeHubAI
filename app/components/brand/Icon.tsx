import clsx from "clsx";
import { Link } from "@remix-run/react";
import IconLight from "~/assets/img/icon-light.svg";
import IconDark from "~/assets/img/icon-dark.svg";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Icon({ className = "", size = "md" }: Props) {
  const sizes = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  return (
    <Link to="/" className={clsx(className, "flex")}>
      <img 
        className={clsx(sizes[size], "hidden w-auto dark:block")} 
        src={IconDark} 
        alt="Reddit Research Icon" 
      />
      <img 
        className={clsx(sizes[size], "w-auto dark:hidden")} 
        src={IconLight} 
        alt="Reddit Research Icon" 
      />
    </Link>
  );
}
