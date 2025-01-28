import { useLoaderData } from "@remix-run/react";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";

interface SkillsSelectionProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillsSelection({ selectedSkills, onChange }: SkillsSelectionProps) {
  const { skills } = useLoaderData<{ skills: Array<{ id: number; name: string; icon?: string }> }>();

  const handleSkillChange = (skillId: string) => {
    const newSkills = selectedSkills.includes(skillId)
      ? selectedSkills.filter(id => id !== skillId)
      : [...selectedSkills, skillId];
    onChange(newSkills);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {skills.map((skill) => (
          <Card
            key={skill.id}
            className={`p-4 cursor-pointer hover:border-primary transition-colors ${
              selectedSkills.includes(skill.id.toString()) ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => handleSkillChange(skill.id.toString())}
          >
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={selectedSkills.includes(skill.id.toString())}
                onCheckedChange={() => handleSkillChange(skill.id.toString())}
                id={`skill-${skill.id}`}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor={`skill-${skill.id}`} className="flex items-center gap-1.5">
                  <span className="text-lg">{skill.icon}</span>
                  <span className="text-sm font-medium">{skill.name}</span>
                </Label>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedSkills.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium mb-2">Selected Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {selectedSkills.map((skillId) => (
              <Badge key={skillId} variant="secondary" className="text-xs">
                {skills.find((s) => s.id.toString() === skillId)?.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 