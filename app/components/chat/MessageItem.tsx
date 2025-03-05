import { Message, ChatSettings } from "~/types/chat";
import { cn } from "~/lib/utils";
import { format } from "date-fns";
import { Bot, Copy } from "lucide-react";
import { useState, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

interface MessageItemProps {
  message: Message;
  settings: ChatSettings;
}

interface WorkflowInputConfig {
  executionId?: string;
  workflowId?: string;
  blockId?: string;
  inputType?: string;
  inputName?: string;
  options?: Record<string, string>;
}

export function MessageItem({ message, settings }: MessageItemProps) {
  const isBot = message.sender === 'bot';
  const [showCopy, setShowCopy] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copyMessage = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(message.content || '');
  };

  const formatContent = (content: string | null | undefined) => {
    // Make sure content is a string before using string methods
    if (typeof content !== 'string') {
      return '';
    }
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
      <div ref={contentRef} className="text-[15px] leading-6">
        {isBot ? (
          <div className="formatted-message">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="mb-4 last:mb-0 text-[15px] leading-6">{children}</p>,
                code: ({ children, className }) => (
                  <code className={cn("bg-gray-100 rounded px-1.5 py-0.5 font-mono text-[13px]", className)}>
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
          <div className="text-[15px] leading-6">
            {message.content}
          </div>
        )}
      </div>
    );
  };

  // Handle workflow input submission
  const handleWorkflowInputSubmit = async () => {
    if (!inputValue.trim() || !message.metadata?.isWorkflowInputRequest) return;
    
    setIsSubmitting(true);
    
    try {
      const inputConfig = message.metadata.workflowInputConfig as WorkflowInputConfig;
      
      // Create message data for input submission
      const inputData = {
        type: "workflow_input_submit",
        executionId: inputConfig?.executionId || "",
        input: inputValue,
        blockId: inputConfig?.blockId || "",
        workflowId: inputConfig?.workflowId || ""
      };
      
      // Dispatch an event for ChatInterface to send via its WebSocket
      window.dispatchEvent(new CustomEvent('send-workflow-input', {
        detail: inputData
      }));
      console.log('Dispatched workflow input event:', inputData);
      
      // Add user's response as a new message via event
      window.dispatchEvent(new CustomEvent('workflow-input-submitted', {
        detail: {
          input: inputValue,
          executionId: inputConfig?.executionId || "",
          blockId: inputConfig?.blockId || ""
        }
      }));
      
      // Clear input and disable the form
      setInputValue("");
      message.metadata.inputSubmitted = true;
      
    } catch (error) {
      console.error('Error submitting workflow input:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Determine if this is a workflow input request message
  const isWorkflowInput = !!message.metadata?.isWorkflowInputRequest && !message.metadata?.inputSubmitted;
  const inputConfig = (message.metadata?.workflowInputConfig || {}) as WorkflowInputConfig;

  console.log('Rendering MessageItem:', message.id, isWorkflowInput, message.metadata);

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
            isBot ? "shadow-sm" : "",
            "text-[15px] leading-6"
          )}>
            {renderContent()}
            
            {/* Render workflow input form if this is an input request */}
            {isWorkflowInput && (
              <div className="mt-3 bg-white rounded-md p-2 border">
                <p className="text-xs text-gray-500 mb-2">
                  {inputConfig?.inputType === 'select' 
                    ? 'Please select an option:' 
                    : 'Please provide your response:'}
                </p>
                
                {inputConfig?.inputType === 'select' && inputConfig?.options ? (
                  <Select 
                    value={inputValue} 
                    onValueChange={setInputValue}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(inputConfig.options || {}).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label as string}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Enter ${inputConfig.inputName || 'your response'}...`}
                    className="w-full mb-2"
                    disabled={isSubmitting}
                  />
                )}
                
                <Button 
                  onClick={handleWorkflowInputSubmit} 
                  className="w-full mt-2"
                  disabled={!inputValue.trim() || isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </div>
            )}
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