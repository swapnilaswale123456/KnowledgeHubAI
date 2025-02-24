import { ButtonProps } from "./button";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </Button>
      <span className="flex items-center">
        Page {currentPage} of {totalPages}
      </span>
      <Button 
        variant="outline" 
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </Button>
    </div>
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