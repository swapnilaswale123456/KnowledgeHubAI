import { useLoaderData } from "@remix-run/react";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

interface IndustrySelectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function IndustrySelection({ value, onChange }: IndustrySelectionProps) {
  const { industries } = useLoaderData<{ industries: Array<{ id: number; name: string; icon?: string }> }>();

  return (
    <div className="grid gap-2">
      <Label>Select Industry</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Choose an industry" />
        </SelectTrigger>
        <SelectContent>
          {industries.map((industry) => (
            <SelectItem key={industry.id} value={industry.id.toString()}>
              {industry.icon} {industry.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 