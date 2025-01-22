import { ReactNode } from "react";
import { cn } from "~/lib/utils";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ChatbotLayoutProps {
  title: string;
  children: ReactNode;
  isConnected: boolean;
}

export function ChatbotLayout({ title, children, isConnected }: ChatbotLayoutProps) {
  return (
    <div className="flex-1 space-y-4 p-2 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">{title}</h3>
        {!isConnected && (
          <Alert variant="destructive" className="w-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connection lost. Attempting to reconnect...
            </AlertDescription>
          </Alert>
        )}
      </div>
      <div className="flex flex-1 h-full w-full p-3 bg-gray-100">
        <div className={cn(
          "flex bg-white rounded-lg border transition-all duration-200 overflow-hidden w-full h-full"
        )}>
          {children}
        </div>
      </div>
    </div>
  );
} 