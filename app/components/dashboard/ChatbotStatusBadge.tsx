import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { ChatbotStatus } from "@prisma/client";

interface ChatbotStatusBadgeProps {
  status: ChatbotStatus;
}

export function ChatbotStatusBadge({ status }: ChatbotStatusBadgeProps) {
  return (
    <Badge 
      className={cn(
        "capitalize",
        status === "ACTIVE" && "bg-blue-50 text-blue-700 hover:bg-blue-50",
        status === "ARCHIVED" && "bg-gray-100 text-gray-700 hover:bg-gray-100",
        status === "INACTIVE" && "bg-yellow-50 text-yellow-700 hover:bg-yellow-50"
      )}
    >
      {status.toLowerCase()}
    </Badge>
  );
} 