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

  const parseHtmlContent = (content: string) => {
    return content
      .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
      .replace(/<b>(.*?)<\/b>/g, '**$1**')
      .replace(/<em>(.*?)<\/em>/g, '_$1_')
      .replace(/<i>(.*?)<\/i>/g, '_$1_')
      .replace(/<h1>(.*?)<\/h1>/g, '# $1')
      .replace(/<h2>(.*?)<\/h2>/g, '## $1')
      .replace(/<h3>(.*?)<\/h3>/g, '### $1')
      .replace(/<li>(.*?)<\/li>/g, '- $1')
      .replace(/<br\s*\/?>/g, '\n')
      .replace(/<p>(.*?)<\/p>/g, '$1\n')
      .replace(/<div>(.*?)<\/div>/g, '$1\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  };

  const renderContent = () => {
    if (message.type === 'file') {
      return (
        <a 
          href={message.fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          📎 {message.fileName}
        </a>
      );
    }

    if (isBot) {
      return (
        <div className={cn(
          "formatted-message",
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
        "whitespace-pre-wrap",
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
        "flex items-end gap-2 group",
        !isBot && "flex-row-reverse"
      )}
      onMouseEnter={() => setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      {isBot && (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-blue-600" />
        </div>
      )}
      
      <div className={cn(
        "max-w-[80%] break-words relative group-hover:opacity-100",
        isBot ? "bg-gray-100" : "bg-blue-500 text-white",
        "px-4 py-2 rounded-2xl",
        isBot ? "rounded-bl-none" : "rounded-br-none",
        "transition-all duration-200"
      )}>
        {renderContent()}
        <span className={cn(
          "text-xs mt-1 block opacity-70",
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
          <Copy className="h-4 w-4 text-gray-500" />
        </button>
      )}
    </div>
  );
} 