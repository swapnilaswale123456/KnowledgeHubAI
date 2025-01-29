import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import { Settings, Activity, Pause, Archive, Trash2, MoreVertical } from "lucide-react";
import { ChatbotStatus } from "@prisma/client";
import type { ChatbotDetails } from "~/utils/services/chatbots/chatbotService.server";

interface ChatbotActionsProps {
  chatbot: ChatbotDetails;
  onStatusChange: (id: string, status: ChatbotStatus) => void;
  onDelete: (id: string) => void;
  onNavigate: (path: string) => void;
  tenantSlug: string;
}

export function ChatbotActions({ chatbot, onStatusChange, onDelete, onNavigate, tenantSlug }: ChatbotActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onNavigate(`/app/${tenantSlug}/g/chatbot/${chatbot.id}`)}>
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {chatbot.status !== ChatbotStatus.ACTIVE && (
          <DropdownMenuItem onClick={() => onStatusChange(chatbot.id, ChatbotStatus.ACTIVE)}>
            <Activity className="h-4 w-4 mr-2" />
            Activate
          </DropdownMenuItem>
        )}
        {chatbot.status !== ChatbotStatus.INACTIVE && (
          <DropdownMenuItem onClick={() => onStatusChange(chatbot.id, ChatbotStatus.INACTIVE)}>
            <Pause className="h-4 w-4 mr-2" />
            Deactivate
          </DropdownMenuItem>
        )}
        {chatbot.status !== ChatbotStatus.ARCHIVED && (
          <DropdownMenuItem onClick={() => onStatusChange(chatbot.id, ChatbotStatus.ARCHIVED)}>
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(chatbot.id)} className="text-red-600">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 