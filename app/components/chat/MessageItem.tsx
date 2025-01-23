import { Message, ChatSettings } from "~/types/chat";
import { cn } from "~/lib/utils";
import { Copy, RotateCcw, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { BotAvatar } from "~/components/avatars/BotAvatar";
import { UserAvatar } from "~/components/avatars/UserAvatar";
import createDOMPurify from 'dompurify';

interface MessageItemProps {
  message: Message;
  settings: ChatSettings;
  onRetry?: () => void;
  onDelete?: () => void;
}

export function MessageItem({ message, settings, onRetry, onDelete }: MessageItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [sanitizer, setSanitizer] = useState<typeof createDOMPurify.DOMPurify | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSanitizer(createDOMPurify(window));
    }
  }, []);

  const copyMessage = () => {
    if (typeof window === 'undefined') return;
    
    const textContent = message.isFormatted 
      ? new DOMParser().parseFromString(message.content, 'text/html').body.textContent
      : message.content;
    navigator.clipboard.writeText(textContent || '');
  };

  const renderContent = () => {
    console.log('Rendering message:', message);
    
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

    // Check if content contains HTML-like structure
    const hasHtmlContent = typeof message.content === 'string' && 
      message.content.includes('<') && 
      message.content.includes('>');
    const shouldFormatContent = message.isFormatted || hasHtmlContent;

    console.log('Content formatting:', { 
      hasHtmlContent, 
      shouldFormatContent, 
      content: message.content 
    });

    if (shouldFormatContent && sanitizer) {
      const sanitizedContent = sanitizer.sanitize(message.content, {
        ALLOWED_TAGS: [
          'p', 'br', 'ul', 'ol', 'li', 
          'strong', 'em', 'h1', 'h2', 'h3', 
          'pre', 'code', 'div', 'span',
          'table', 'tr', 'td', 'th', 'thead', 'tbody'
        ],
        ALLOWED_ATTR: ['class', 'style']
      });

      return (
        <div 
          className="formatted-content prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
      );
    }

    // Fallback for formatted content when sanitizer is not ready
    if (shouldFormatContent && !sanitizer) {
      return <p className="text-sm">Loading formatted content...</p>;
    }

    // Handle markdown-style code blocks
    if (message.content.includes('```')) {
      const parts = message.content.split(/(```[a-z]*\n[\s\S]*?\n```)/g);
      return (
        <div className="space-y-2">
          {parts.map((part, index) => {
            if (part.startsWith('```')) {
              const code = part.replace(/```[a-z]*\n/, '').replace(/\n```$/, '');
              return (
                <pre key={index} className="bg-gray-800 text-white p-3 rounded-md overflow-x-auto">
                  <code>{code}</code>
                </pre>
              );
            }
            return (
              <p key={index} className={cn(
                "text-sm whitespace-pre-wrap",
                settings.fontSize === 'small' && 'text-xs',
                settings.fontSize === 'large' && 'text-base'
              )}>
                {part}
              </p>
            );
          })}
        </div>
      );
    }

    // Regular text content
    return (
      <p className={cn(
        "text-sm whitespace-pre-wrap",
        settings.fontSize === 'small' && 'text-xs',
        settings.fontSize === 'large' && 'text-base'
      )}>
        {message.content}
      </p>
    );
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
      <div className="flex flex-col gap-1 max-w-[85%]">
        <div className={cn(
          "flex items-start gap-2",
          message.sender === 'user' && 'flex-row-reverse'
        )}>
          <div className={cn(
            "p-3 rounded-lg",
            message.sender === 'bot' ? 'bg-gray-100' : 'bg-blue-500 text-white',
            message.sender === 'bot' && 'formatted-message'
          )}>
            {renderContent()}
          </div>
          {showActions && (
            <div className="flex items-center gap-1">
              <button 
                onClick={copyMessage}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy message"
              >
                <Copy className="h-4 w-4" />
              </button>
              {message.status === 'error' && (
                <button 
                  onClick={onRetry}
                  className="p-1 hover:bg-gray-100 rounded text-red-500"
                  title="Retry"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button 
                onClick={onDelete}
                className="p-1 hover:bg-gray-100 rounded"
                title="Delete message"
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