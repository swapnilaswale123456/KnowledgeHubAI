import { Message, ChatSettings } from "~/types/chat";
import { cn } from "~/lib/utils";
import { Copy, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { BotAvatar } from "~/components/avatars/BotAvatar";
import { UserAvatar } from "~/components/avatars/UserAvatar";

interface MessageItemProps {
  message: Message;
  settings: ChatSettings;
  onRetry?: () => void;
  onDelete?: () => void;
}

export function MessageItem({ message, settings, onRetry, onDelete }: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content);
  };

  return (
    <div 
      className={cn(
        "flex items-start gap-3 max-w-2xl mx-auto",
        message.sender === 'user' && 'flex-row-reverse'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="w-6 h-6">
        {message.sender === 'bot' ? <BotAvatar /> : <UserAvatar />}
      </div>
      <div className="flex flex-col gap-1">
        <div className={cn(
          "flex items-center gap-2",
          message.sender === 'user' && 'flex-row-reverse'
        )}>
          <div className={cn(
            "p-3 rounded-lg",
            message.sender === 'bot' ? 'bg-gray-100' : 'bg-blue-500 text-white'
          )}>
            {message.type === 'file' ? (
              <a 
                href={message.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                📎 {message.fileName}
              </a>
            ) : (
              <p className={cn(
                "text-sm",
                settings.fontSize === 'small' && 'text-xs',
                settings.fontSize === 'large' && 'text-base'
              )}>
                {message.content}
              </p>
            )}
          </div>
          {showActions && (
            <div className="flex items-center gap-1">
              <button 
                onClick={copyMessage}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Copy className="h-4 w-4" />
              </button>
              {message.status === 'error' && (
                <button 
                  onClick={onRetry}
                  className="p-1 hover:bg-gray-100 rounded text-red-500"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button 
                onClick={onDelete}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
        <div className={cn(
          "text-xs text-gray-500",
          message.sender === 'user' && 'text-right'
        )}>
          {message.sender === 'bot' ? 'AI Assistant' : 'You'} • {
            new Date(message.timestamp).toLocaleTimeString()
          }
        </div>
      </div>
    </div>
  );
} 