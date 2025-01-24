import { ButtonProps } from "./button";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={className}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul className="flex flex-row items-center gap-1" {...props} />
  );
}

export function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={className} {...props} />;
}

export function PaginationLink({
  isActive,
  className,
  ...props
}: { isActive?: boolean } & ButtonProps) {
  return (
    <Button
      variant={isActive ? "outline" : "ghost"}
      className={className}
      {...props}
    />
  );
}

export function PaginationPrevious({ className, ...props }: ButtonProps) {
  return (
    <Button variant="ghost" className={className} {...props}>
      <ChevronLeft className="h-4 w-4" />
      <span>Previous</span>
    </Button>
  );
}

export function PaginationNext({ className, ...props }: ButtonProps) {
  return (
    <Button variant="ghost" className={className} {...props}>
      <span>Next</span>
      <ChevronRight className="h-4 w-4" />
    </Button>
  );
} 