import { Card, CardContent } from "~/components/ui/card";
import { format } from "date-fns";
import { Bot, Activity, Pause, Archive, Settings, Trash2, MoreVertical } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "~/components/ui/dropdown-menu";
import { ChatbotStatus } from "@prisma/client";
import { cn } from "~/lib/utils";
import type { ChatbotDetails } from "~/utils/services/chatbots/chatbotService.server";
import { ChatbotStatusBadge } from "./ChatbotStatusBadge";
import { ChatbotActions } from "./ChatbotActions";

interface ChatbotCardProps {
  chatbot: ChatbotDetails;
  onStatusChange: (id: string, status: ChatbotStatus) => void;
  onDelete: (id: string) => void;
  onNavigate: (path: string) => void;
  tenantSlug: string;
}

export function ChatbotCard({ chatbot, onStatusChange, onDelete, onNavigate, tenantSlug }: ChatbotCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg">{chatbot.name}</h3>
          </div>
          <ChatbotActions 
            chatbot={chatbot}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onNavigate={onNavigate}
            tenantSlug={tenantSlug}
          />
        </div>

        {/* Card Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <ChatbotStatusBadge status={chatbot.status} />
            <span className="text-gray-500">
              Created {format(new Date(chatbot.createdAt), 'MMM d, yyyy')}
            </span>
          </div>

          <div className="pt-4 border-t">
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => onNavigate(`/app/${tenantSlug}/g/chatbot/${chatbot.id}`)}
            >
              View Chatbot
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 