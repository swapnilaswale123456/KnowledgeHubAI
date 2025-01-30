import { ChatbotCard } from "./ChatbotCard";
import { DashboardStats } from "./DashboardStats";
import type { ChatbotDetails } from "~/types/chatbot";
import { ChatbotStatus } from "@prisma/client";

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
}

export function DashboardContent({
  chatbots,
  dashboardStats,
  onStatusChange,
  onDelete,
  onEdit,
  tenantSlug,
  navigate
}: DashboardContentProps) {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <DashboardStats 
        totalChatbots={chatbots?.length ?? 0}
        activeChatbots={dashboardStats?.activeCount ?? 0}
        totalMessages={0}
        totalDataSources={dashboardStats?.totalDataSources ?? 0}
      />

      <div className="grid grid-cols-3 gap-6">
        {chatbots.map((chatbot) => (
          <ChatbotCard
            key={chatbot.id}
            chatbot={chatbot}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onNavigate={navigate}
            onEdit={onEdit}
            tenantSlug={tenantSlug}
          />
        ))}
      </div>
    </div>
  );
} 