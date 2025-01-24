import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-1.5">
      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
        <Bot className="w-3 h-3 text-blue-600" />
      </div>
      <div className="bg-gray-100 px-3 py-1.5 rounded-2xl rounded-bl-none">
        <div className="flex space-x-1">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
} 