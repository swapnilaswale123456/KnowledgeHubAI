interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const COMMON_EMOJIS = ['😊', '👍', '❤️', '🎉', '🤔', '👏', '🙌', '💡', '✨', '🔥'];

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  return (
    <div className="absolute bottom-12 right-0 z-50 bg-white border rounded-lg shadow-lg p-2 min-w-[200px]">
      <div className="grid grid-cols-5 gap-2">
        {COMMON_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="hover:bg-gray-100 p-2 rounded text-lg"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
} 