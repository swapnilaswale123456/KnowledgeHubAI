import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";

const availableSkills = [
  {
    id: "qa",
    name: "Question Answering",
    description: "Answer questions based on provided context",
    icon: "❓",
  },
  {
    id: "summarization",
    name: "Text Summarization",
    description: "Create concise summaries of longer texts",
    icon: "📝",
  },
  {
    id: "sentiment",
    name: "Sentiment Analysis",
    description: "Detect emotion and sentiment in messages",
    icon: "😊",
  },
  {
    id: "translation",
    name: "Language Translation",
    description: "Translate between different languages",
    icon: "🌐",
  },
  {
    id: "recommendations",
    name: "Recommendations",
    description: "Provide personalized suggestions",
    icon: "🎯",
  },
];

interface SkillsSelectionProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillsSelection({ selectedSkills, onChange }: SkillsSelectionProps) {
  const handleToggleSkill = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      onChange(selectedSkills.filter((id) => id !== skillId));
    } else {
      onChange([...selectedSkills, skillId]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {availableSkills.map((skill) => (
          <Card
            key={skill.id}
            className={`p-4 cursor-pointer hover:border-primary transition-colors ${
              selectedSkills.includes(skill.id) ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => handleToggleSkill(skill.id)}
          >
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={selectedSkills.includes(skill.id)}
                onCheckedChange={() => handleToggleSkill(skill.id)}
                id={skill.id}
                className="mt-1"
              />
              <div className="flex-1">
                <Label htmlFor={skill.id} className="flex items-center gap-1.5">
                  <span className="text-lg">{skill.icon}</span>
                  <span className="text-sm font-medium">{skill.name}</span>
                </Label>
                <p className="text-xs text-gray-600 mt-1">{skill.description}</p>
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
                {availableSkills.find((s) => s.id === skillId)?.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 