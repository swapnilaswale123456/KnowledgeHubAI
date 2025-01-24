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
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(message.content || '');
  };

  const parseHtmlContent = (content: string) => {
    // Replace HTML tags with markdown equivalents
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

  const formatText = (text: string, key?: number) => {
    // First parse any HTML in the content
    const parsedText = parseHtmlContent(text);
    
    // Split by newlines and create paragraphs
    const paragraphs = parsedText.split('\n').filter(Boolean);
    return paragraphs.map((paragraph, idx) => {
      const finalKey = key !== undefined ? `${key}-${idx}` : idx;
      
      // Handle bold text
      paragraph = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Handle italic text
      paragraph = paragraph.replace(/_(.*?)_/g, '<em>$1</em>');
      
      // Check if it's a list item
      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
        return (
          <li key={finalKey} className="ml-4">
            <span dangerouslySetInnerHTML={{ __html: paragraph.slice(2) }} />
          </li>
        );
      }
      
      // Check if it's a numbered list item
      if (/^\d+\.\s/.test(paragraph)) {
        return (
          <li key={finalKey} className="ml-4 list-decimal">
            <span dangerouslySetInnerHTML={{ 
              __html: paragraph.replace(/^\d+\.\s/, '')
            }} />
          </li>
        );
      }

      // Check if it's a heading
      if (paragraph.startsWith('# ')) {
        return (
          <h1 key={finalKey} className="text-xl font-bold my-2">
            <span dangerouslySetInnerHTML={{ __html: paragraph.slice(2) }} />
          </h1>
        );
      }
      if (paragraph.startsWith('## ')) {
        return (
          <h2 key={finalKey} className="text-lg font-bold my-2">
            <span dangerouslySetInnerHTML={{ __html: paragraph.slice(3) }} />
          </h2>
        );
      }
      if (paragraph.startsWith('### ')) {
        return (
          <h3 key={finalKey} className="text-base font-bold my-2">
            <span dangerouslySetInnerHTML={{ __html: paragraph.slice(4) }} />
          </h3>
        );
      }

      // Regular paragraph
      return (
        <p key={finalKey} className={cn(
          "my-2 whitespace-pre-wrap",
          settings.fontSize === 'small' && 'text-xs',
          settings.fontSize === 'medium' && 'text-sm',
          settings.fontSize === 'large' && 'text-base'
        )}>
          <span dangerouslySetInnerHTML={{ __html: paragraph }} />
        </p>
      );
    });
  };

  const formatCodeBlock = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const code = part.slice(3, -3).trim();
        return (
          <pre key={index} className="bg-gray-800 text-white p-3 rounded-md overflow-x-auto my-2">
            <code>{code}</code>
          </pre>
        );
      }
      return formatText(part, index);
    });
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

    return (
      <div className="space-y-1">
        {formatCodeBlock(message.content)}
      </div>
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