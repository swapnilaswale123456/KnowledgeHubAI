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
  onEdit: (chatbot: ChatbotDetails) => void;
  tenantSlug: string;
}

export function ChatbotCard({ chatbot, onStatusChange, onDelete, onNavigate, onEdit, tenantSlug }: ChatbotCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-6">
          {/* Left Section - Main Info */}
          <div className="flex items-start space-x-4 flex-1">
            <div className="p-2 bg-blue-100 rounded-lg shrink-0">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{chatbot.name}</h3>
                <ChatbotStatusBadge status={chatbot.status} />
              </div>
              <p className="text-sm text-gray-500 mt-1">Created {format(new Date(chatbot.createdAt), 'MMM d, yyyy')}</p>
              
              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-sm text-gray-500">Industry</p>
                  <p className="text-sm font-medium truncate">{chatbot.industry || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="text-sm font-medium truncate">{chatbot.type || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Data Sources</p>
                  <p className="text-sm font-medium">{chatbot.files?.length || 0} files</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline"
              size="sm"
              onClick={() => onNavigate(`/app/${tenantSlug}/g/chatbot/${chatbot.id}`)}
            >
              View
            </Button>
            
            {(chatbot.status === ChatbotStatus.ACTIVE || chatbot.status === ChatbotStatus.ARCHIVED) && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onEdit(chatbot)}
              >
                <Settings className="w-4 h-4 mr-1" />
                Configure
              </Button>
            )}
            
            <ChatbotActions 
              chatbot={chatbot}
              onStatusChange={onStatusChange}
              onDelete={onDelete}
              onNavigate={onNavigate}
              tenantSlug={tenantSlug}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 