import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Users, Clock, MoreVertical, Settings, Trash2, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { ChatbotStatus } from "@prisma/client";
import { cn } from "~/lib/utils";
import { useFetcher } from "@remix-run/react";

interface ChatbotCardProps {
  chatbot: any;
  metrics?: {
    total_messages: number;
    total_sessions: number;
  };
  onStatusChange: (id: string, status: ChatbotStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onNavigate: (id: string) => void;
  isProcessing: boolean;
  fetcher: ReturnType<typeof useFetcher>;
  isEditing?: boolean;
}

export function ChatbotCard({
  chatbot,
  metrics,
  onStatusChange,
  onDelete,
  onNavigate,
  onEdit,
  isProcessing,
  fetcher,
  isEditing = false
}: ChatbotCardProps) {
  return (
    <div className="flex items-start space-x-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors relative">
      {isEditing && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Loading configuration...</span>
          </div>
        </div>
      )}

      

      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium leading-none">{chatbot.name}</h3>
          <div className="flex items-center space-x-2">
            <span className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
              chatbot.status === ChatbotStatus.ACTIVE && "bg-green-100 text-green-800",
              chatbot.status === ChatbotStatus.INACTIVE && "bg-yellow-100 text-yellow-800",
              chatbot.status === ChatbotStatus.ARCHIVED && "bg-gray-100 text-gray-800"
            )}>
              {chatbot.status.toLowerCase()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MessageSquare className="w-4 h-4 mr-1" />
            {metrics?.total_messages || 0} messages
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {metrics?.total_sessions || 0} sessions
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {formatDistanceToNow(new Date(chatbot.updatedAt), { addSuffix: true })}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {chatbot.status === ChatbotStatus.ACTIVE && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(chatbot.id)}
          >
            View
          </Button>
        )}

        {(chatbot.status === ChatbotStatus.ACTIVE || chatbot.status === ChatbotStatus.ARCHIVED) && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(chatbot.id)}
          >
            <Settings className="w-4 h-4 mr-1" />
            
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {chatbot.status === ChatbotStatus.ACTIVE && (
              <DropdownMenuItem onClick={() => onNavigate(chatbot.id)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Open Chat
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onEdit(chatbot.id)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(chatbot.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 