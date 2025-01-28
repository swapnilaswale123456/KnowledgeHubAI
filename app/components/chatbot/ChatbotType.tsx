import { Card } from "~/components/ui/card";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Label } from "~/components/ui/label";

const chatbotTypes = [
  {
    id: "customer-service",
    title: "Customer Service",
    description: "Handle customer inquiries and support requests",
    icon: "🎯",
  },
  {
    id: "sales",
    title: "Sales Assistant",
    description: "Help customers with product selection and purchases",
    icon: "💼",
  },
  {
    id: "knowledge-base",
    title: "Knowledge Base",
    description: "Answer questions based on your documentation",
    icon: "📚",
  },
  {
    id: "custom",
    title: "Custom Assistant",
    description: "Build a custom chatbot for your specific needs",
    icon: "🎨",
  },
];

interface ChatbotTypeProps {
  value: string;
  onChange: (value: string) => void;
}

export function ChatbotType({ value, onChange }: ChatbotTypeProps) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="grid gap-3 md:grid-cols-2">
      {chatbotTypes.map((type) => (
        <Card
          key={type.id}
          className={`p-4 cursor-pointer hover:border-primary transition-colors ${
            value === type.id ? "border-primary bg-primary/5" : ""
          }`}
          onClick={() => onChange(type.id)}
        >
          <div className="flex items-start space-x-3">
            <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
            <div className="flex-1">
              <Label htmlFor={type.id} className="flex items-center gap-1.5">
                <span className="text-lg">{type.icon}</span>
                <span className="text-sm font-medium">{type.title}</span>
              </Label>
              <p className="text-xs text-gray-600 mt-1">{type.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </RadioGroup>
  );
} 