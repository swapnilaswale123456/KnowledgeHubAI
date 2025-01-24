import { Message, ChatSettings } from "~/types/chat";
import { cn } from "~/lib/utils";
import { format } from "date-fns";
import { Bot, Copy } from "lucide-react";
import { useState } from "react";

interface MessageItemProps {
  message: Message;
  settings: ChatSettings;
}

export function MessageItem({ message, settings }: MessageItemProps) {
  const isBot = message.sender === 'bot';
  const [showCopy, setShowCopy] = useState(false);

  const copyMessage = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(message.content || '');
  };

  const renderContent = () => {
    if (message.type === 'file') {
      return (
        <a 
          href={message.fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs"
        >
          📎 {message.fileName}
        </a>
      );
    }

    if (isBot) {
      return (
        <div className={cn(
          "formatted-message text-xs leading-relaxed",
          settings.fontSize === 'small' && 'text-xs',
          settings.fontSize === 'medium' && 'text-sm',
          settings.fontSize === 'large' && 'text-base'
        )}>
          <div dangerouslySetInnerHTML={{ __html: message.content }} />
        </div>
      );
    }

    return (
      <div className={cn(
        "whitespace-pre-wrap text-xs leading-relaxed",
        settings.fontSize === 'small' && 'text-xs',
        settings.fontSize === 'medium' && 'text-sm',
        settings.fontSize === 'large' && 'text-base'
      )}>
        {message.content}
      </div>
    );
  };
  
  return (
    <div 
      className={cn(
        "flex items-start gap-1.5 group",
        !isBot && "flex-row-reverse"
      )}
      onMouseEnter={() => setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      {isBot && (
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Bot className="w-3 h-3 text-blue-600" />
        </div>
      )}
      
      <div className={cn(
        "max-w-[85%] break-words",
        isBot ? "bg-gray-100" : "bg-blue-500 text-white",
        "px-3 py-1.5 rounded-2xl",
        isBot ? "rounded-bl-none" : "rounded-br-none"
      )}>
        {renderContent()}
        <span className={cn(
          "text-[10px] mt-0.5 block opacity-70",
          isBot ? "text-gray-500" : "text-blue-100"
        )}>
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>
      </div>

      {showCopy && (
        <button 
          onClick={copyMessage}
          className={cn(
            "p-1.5 rounded-full transition-colors",
            "hover:bg-gray-100",
            "opacity-0 group-hover:opacity-100"
          )}
          title="Copy message"
        >
          <Copy className="h-3 h-3 text-gray-500" />
        </button>
      )}
    </div>
  );
} 