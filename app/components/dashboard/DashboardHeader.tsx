import { Button } from "~/components/ui/button";
import { Plus, Database } from "lucide-react";
import { Link } from "@remix-run/react";

interface DashboardHeaderProps {
  onNewChatbot: () => void;
  onDataSources: () => void;
}

export function DashboardHeader({ onNewChatbot, onDataSources }: DashboardHeaderProps) {
  return (
    <div className="border-b bg-white">
      <div className="flex h-16 items-center px-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            AI Chatbots
          </h1>
          <p className="text-sm text-gray-500">
            Manage and monitor your chatbots
          </p>
        </div>
        <div className="flex gap-3 ml-auto">
          <Button
            variant="outline"
            onClick={onDataSources}
            className="inline-flex items-center gap-x-2"
          >
            <Database className="w-4 h-4" />
            Data Sources
          </Button>
          <Button
            onClick={onNewChatbot}
            className="inline-flex items-center gap-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Chatbot
          </Button>
        </div>
      </div>
    </div>
  );
} 