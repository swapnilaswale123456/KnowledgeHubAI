import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

interface ChatbotScopeProps {
  scope: {
    purpose: string;
    audience: string;
    tone: string;
  };
  onChange: (field: string, value: string) => void;
}

const toneOptions = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
];

export function ChatbotScope({ scope, onChange }: ChatbotScopeProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="purpose">Purpose</Label>
          <Textarea
            id="purpose"
            placeholder="What is the main purpose of your chatbot?"
            value={scope.purpose}
            onChange={(e) => onChange("purpose", e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="audience">Target Audience</Label>
          <Input
            id="audience"
            placeholder="Who will be interacting with your chatbot?"
            value={scope.audience}
            onChange={(e) => onChange("audience", e.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="tone">Communication Tone</Label>
          <Select
            value={scope.tone}
            onValueChange={(value) => onChange("tone", value)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select a tone" />
            </SelectTrigger>
            <SelectContent>
              {toneOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(scope.purpose || scope.audience || scope.tone) && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
          <h3 className="font-medium">Chatbot Scope Summary</h3>
          {scope.purpose && (
            <p className="text-sm text-gray-600">
              <strong>Purpose:</strong> {scope.purpose}
            </p>
          )}
          {scope.audience && (
            <p className="text-sm text-gray-600">
              <strong>Audience:</strong> {scope.audience}
            </p>
          )}
          {scope.tone && (
            <p className="text-sm text-gray-600">
              <strong>Tone:</strong> {toneOptions.find(t => t.value === scope.tone)?.label}
            </p>
          )}
        </div>
      )}
    </div>
  );
} 