import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ArrowRight, ArrowLeft, Sparkles, X } from "lucide-react";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import { useState } from "react";

const CHATBOT_SKILLS = {
  recommended: [
    { id: "order_tracking", name: "Order Tracking", icon: "📦", category: "E-commerce" },
    { id: "refund_processing", name: "Refund Processing", icon: "💰", category: "E-commerce" },
    { id: "lead_capture", name: "Lead Capture", icon: "🎯", category: "Sales" },
    { id: "appointment", name: "Appointment Booking", icon: "📅", category: "Service" },
  ],
  additional: [
    { id: "faq", name: "FAQ Handling", icon: "❓", category: "Support" },
    { id: "feedback", name: "Feedback Collection", icon: "📝", category: "Support" },
    { id: "notifications", name: "Notifications", icon: "🔔", category: "Utility" },
    { id: "analytics", name: "Analytics", icon: "📊", category: "Utility" }
  ]
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return json({
    workflowId: params.id,
    currentStep: 2,
    totalSteps: 5
  });
};

export default function SkillSelection() {
  const { currentStep, totalSteps } = useLoaderData<typeof loader>();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const navigate = useNavigate();

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => 
      prev.includes(skillId) 
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleBack = () => {
    navigate("../steps");
  };

  const handleNext = () => {
    if (selectedSkills.length > 0) {
      navigate("../workflow-generation");
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col p-4">
      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1.5">
          <span>Step {currentStep} of {totalSteps}</span>
          <span>{(currentStep / totalSteps * 100).toFixed(0)}% Complete</span>
        </div>
        <Progress value={currentStep / totalSteps * 100} className="h-1.5" />
      </div>

      {/* Main Content */}
      <Card className="flex-1 p-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold">Choose Chatbot Skills</h2>
            <p className="text-xs text-gray-500">Select capabilities for your chatbot</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Suggest Skills
          </Button>
        </div>

        {/* Selected Skills Tags */}
        {selectedSkills.length > 0 && (
          <div className="bg-gray-50/80 rounded-md p-2 mb-3">
            <div className="flex flex-wrap gap-1.5">
              {selectedSkills.map(skillId => {
                const skill = [...CHATBOT_SKILLS.recommended, ...CHATBOT_SKILLS.additional]
                  .find(s => s.id === skillId);
                return (
                  <Badge 
                    key={skillId}
                    variant="secondary"
                    className="pl-2 pr-1 py-0.5 flex items-center gap-1 text-xs"
                  >
                    {skill?.icon} {skill?.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => toggleSkill(skillId)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Grid Layout for Skills */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-medium">Recommended Skills</h3>
                  <Badge variant="default" className="text-[10px]">AI Suggested</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CHATBOT_SKILLS.recommended.map((skill) => (
                    <Card 
                      key={skill.id}
                      className={`p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedSkills.includes(skill.id) ? 'border-blue-400 bg-blue-50' : ''
                      }`}
                      onClick={() => toggleSkill(skill.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{skill.icon}</span>
                        <div>
                          <div className="text-sm font-medium">{skill.name}</div>
                          <div className="text-xs text-gray-500">{skill.category}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Additional Skills</h3>
              <div className="space-y-2">
                {CHATBOT_SKILLS.additional.map((skill) => (
                  <Card 
                    key={skill.id}
                    className={`p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedSkills.includes(skill.id) ? 'border-blue-400 bg-blue-50' : ''
                    }`}
                    onClick={() => toggleSkill(skill.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{skill.icon}</span>
                      <div>
                        <div className="text-sm font-medium">{skill.name}</div>
                        <div className="text-xs text-gray-500">{skill.category}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-between items-center pt-3 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button 
            size="sm" 
            className="gap-2"
            disabled={selectedSkills.length === 0}
            onClick={handleNext}
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
} 