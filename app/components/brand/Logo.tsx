import { Link } from "@remix-run/react";
import LogoLight from "~/assets/img/logo-light.svg";
import LogoDark from "~/assets/img/logo-dark.svg";
import clsx from "clsx";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: Props) {
  const sizes = {
    sm: "h-8",
    md: "h-10",
    lg: "h-12",
  };

  return (
    <Link to="/" className={clsx(className, "flex")}>
      <img 
        className={clsx(sizes[size], "hidden w-auto dark:block")} 
        src={LogoDark} 
        alt="Reddit Research Logo" 
      />
      <img 
        className={clsx(sizes[size], "w-auto dark:hidden")} 
        src={LogoLight} 
        alt="Reddit Research Logo" 
      />
    </Link>
  );
}
