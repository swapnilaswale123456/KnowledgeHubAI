import { useRef, useState } from 'react';
import { Paperclip, Mic, Smile, Send } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface ChatInputProps {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  onSend: () => void;
  disabled?: boolean;
  onFileUpload?: (file: File) => void;
  onVoiceRecord?: () => void;
  onEmojiSelect?: (emoji: string) => void;
}

export function ChatInput({
  message,
  setMessage,
  onSend,
  disabled,
  onFileUpload,
  onVoiceRecord,
  onEmojiSelect
}: ChatInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border-t bg-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && onSend()}
          />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => e.target.files && onFileUpload && onFileUpload(e.target.files[0])}
            accept=".pdf,.doc,.docx,.txt"
          />
          <button 
            className="p-2 hover:bg-gray-100 rounded-md"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button 
            className="p-2 hover:bg-gray-100 rounded-md"
            onClick={onVoiceRecord}
          >
            <Mic className="h-4 w-4" />
          </button>
          <button 
            className="p-2 hover:bg-gray-100 rounded-md relative"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile className="h-4 w-4" />
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-2">
                <EmojiPicker onSelect={onEmojiSelect} />
              </div>
            )}
          </button>
          <button 
            onClick={onSend}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 