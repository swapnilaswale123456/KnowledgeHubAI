export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 max-w-2xl mx-auto">
      <div className="flex space-x-2 p-3 bg-gray-100 rounded-lg">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
      </div>
    </div>
  );
} 