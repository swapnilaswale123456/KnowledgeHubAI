import { Message, ChatSettings } from "~/types/chat";
import { cn } from "~/lib/utils";
import { format } from "date-fns";
import { Bot, Copy } from "lucide-react";
import { useState, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';

interface MessageItemProps {
  message: Message;
  settings: ChatSettings;
}

export function MessageItem({ message, settings }: MessageItemProps) {
  const isBot = message.sender === 'bot';
  const [showCopy, setShowCopy] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const copyMessage = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(message.content || '');
  };

  const formatContent = (content: string) => {
    // Remove any unwanted asterisks
    return content.replace(/\*(?!\*)/g, '').trim();
  };

  const renderContent = () => {
    if (message.type === 'file') {
      return (
        <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" 
           className="flex items-center gap-1.5 text-xs">
          📎 {message.fileName}
        </a>
      );
    }

    return (
      <div 
        ref={contentRef}
        className={cn(
          "prose prose-neutral dark:prose-invert",
          "max-w-none leading-7",
          settings.fontSize === 'small' && 'text-sm',
          settings.fontSize === 'medium' && 'text-base', 
          settings.fontSize === 'large' && 'text-lg'
        )}
      >
        {isBot ? (
          <div className="formatted-message">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                code: ({ children, className }) => (
                  <code
                    className={cn(
                      "bg-gray-100 rounded px-1.5 py-0.5",
                      "text-sm font-mono text-gray-800",
                      className
                    )}
                  >
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-gray-50 rounded-md p-4 overflow-x-auto">
                    {children}
                  </pre>
                )
              }}
            >
              {formatContent(message.content)}
            </ReactMarkdown>
          </div>
        ) : (
          message.content
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "group relative",
      isBot ? "bg-gray-50" : "bg-white",
      "border-b"
    )}>
      <div className={cn(
        "relative m-auto flex w-full items-start gap-3 p-3 md:gap-4 md:py-4 lg:px-1",
        isBot ? "" : "flex-row-reverse",
        "max-w-3xl"
      )}>
        {isBot ? (
          <div className="w-6 h-6 rounded-sm bg-teal-500 flex items-center justify-center flex-shrink-0">
            <Bot className="w-2.5 h-2.5 text-white" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-sm bg-gray-800 flex items-center justify-center flex-shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-200" />
          </div>
        )}
        
        <div className={cn(
          "min-w-0 flex-1",
          !isBot && "flex justify-end"
        )}>
          <div className={cn(
            "max-w-[85%]",
            isBot ? "bg-white" : "bg-gray-100",
            "px-3 py-2 rounded-lg",
            isBot ? "shadow-sm" : ""
          )}>
            {renderContent()}
          </div>
        </div>

        <div className={cn(
          "absolute top-3",
          isBot ? "right-3" : "left-3",
          "opacity-0 group-hover:opacity-100 transition-opacity"
        )}>
          <button 
            onClick={copyMessage}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
            title="Copy message"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
} 