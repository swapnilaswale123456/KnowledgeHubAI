import { Link } from "@remix-run/react";
import LogoLight from "~/assets/img/logo-light.png";
import LogoDark from "~/assets/img/logo-dark.png";
import clsx from "clsx";

interface Props {
  className?: string;
  size?: string;
  to?: string;
}

export default function Logo({ className = "", size = "h-10", to }: Props) {
  return (
    <Link to={to ?? "/"} className={clsx(className, "flex")}>
      <img 
        className={clsx(size, "hidden w-auto dark:block")} 
        src={LogoDark} 
        alt="Reddit Research Logo" 
      />
      <img 
        className={clsx(size, "w-auto dark:hidden")} 
        src={LogoLight} 
        alt="Reddit Research Logo" 
      />
    </Link>
  );
}
