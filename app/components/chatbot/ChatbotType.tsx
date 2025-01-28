import { useLoaderData } from "@remix-run/react";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

interface ChatbotTypeProps {
  value: string;
  onChange: (value: string) => void;
}

export function ChatbotType({ value, onChange }: ChatbotTypeProps) {
  const { chatbotTypes } = useLoaderData<{ chatbotTypes: Array<{ id: number; name: string; icon?: string }> }>();

  return (
    <div className="grid gap-2">
      <Label>Select Chatbot Type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a type" />
        </SelectTrigger>
        <SelectContent>
          {chatbotTypes.map((type) => (
            <SelectItem key={type.id} value={type.id.toString()}>
              {type.icon} {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 