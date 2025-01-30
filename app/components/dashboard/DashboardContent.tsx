import { ChatbotCard } from "./ChatbotCard";
import { DashboardStats } from "./DashboardStats";
import type { ChatbotDetails } from "~/types/chatbot";
import { ChatbotStatus } from "@prisma/client";
import { useState, useEffect } from "react";

interface DashboardContentProps {
  chatbots: ChatbotDetails[];
  dashboardStats: {
    totalDataSources: number;
    activeCount: number;
  };
  onStatusChange: (id: string, status: ChatbotStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (chatbot: ChatbotDetails) => void;
  tenantSlug: string;
  navigate: (path: string) => void;
  isLoading?: boolean;
}

export function DashboardContent({
  chatbots,
  dashboardStats,
  onStatusChange,
  onDelete,
  onEdit,
  tenantSlug,
  navigate,
  isLoading = false
}: DashboardContentProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Sort chatbots by createdAt in descending order
  const sortedChatbots = [...chatbots].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleEdit = async (chatbot: ChatbotDetails) => {
    setEditingId(chatbot.id);
    await onEdit(chatbot);
  };

  // Reset editingId when loading state changes
  useEffect(() => {
    if (!isLoading) {
      setEditingId(null);
    }
  }, [isLoading]);

  return (
    <div className="p-8">
      <DashboardStats 
        totalChatbots={chatbots.length}
        activeChatbots={dashboardStats.activeCount}
        totalMessages={0}
        totalDataSources={dashboardStats.totalDataSources}
      />

      {/* Single column layout with sorted chatbots */}
      <div className="space-y-6 max-w-6xl mx-auto">
        {sortedChatbots.map((chatbot) => (
          <ChatbotCard
            key={chatbot.id}
            chatbot={chatbot}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onEdit={handleEdit}
            onNavigate={navigate}
            tenantSlug={tenantSlug}
            isEditing={isLoading && editingId === chatbot.id}
          />
        ))}

        {chatbots.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No chatbots created yet</p>
          </div>
        )}
      </div>
    </div>
  );
} 