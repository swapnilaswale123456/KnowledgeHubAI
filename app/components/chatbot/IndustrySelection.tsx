import { useState } from "react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "~/components/ui/tooltip";
import { Card } from "~/components/ui/card";

const industries = [
  { id: "ecommerce", name: "E-commerce", icon: "🛍️", description: "E-commerce description" },
  { id: "healthcare", name: "Healthcare", icon: "🏥", description: "Healthcare description" },
  { id: "education", name: "Education", icon: "📚", description: "Education description" },
  { id: "finance", name: "Finance", icon: "💰", description: "Finance description" },
  { id: "technology", name: "Technology", icon: "💻", description: "Technology description" },
  { id: "other", name: "Other", icon: "🔄", description: "Other description" },
];

interface IndustrySelectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function IndustrySelection({ value, onChange }: IndustrySelectionProps) {
  return (
    <div className="space-y-6">
      <TooltipProvider>
        <div className="grid gap-3 md:grid-cols-3">
          {industries.map((industry) => (
            <Card
              key={industry.id}
              className={`relative p-4 cursor-pointer hover:border-primary transition-colors ${
                value === industry.id ? "border-primary bg-primary/5" : ""
              }`}
              onClick={() => onChange(industry.id)}
            >
              <div className="flex flex-col h-full">
                <div className="mb-3">
                  <div className="p-1.5 w-fit rounded-lg bg-primary/10">
                    <span className="text-lg">{industry.icon}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">{industry.name}</h3>
                  <p className="text-xs text-gray-500">{industry.description}</p>
                </div>
              </div>
              {value === industry.id && (
                <div className="absolute top-2 right-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
              )}
            </Card>
          ))}
        </div>
      </TooltipProvider>

      {value && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Selected Industry</h3>
          <p className="text-gray-600">
            You've selected {industries.find((i) => i.id === value)?.name}. 
            We'll optimize your chatbot for this industry's specific needs.
          </p>
        </div>
      )}
    </div>
  );
} 