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
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            New Chatbot
          </Button>
        </div>
      </div>
    </div>
  );
} 