import { Card } from "~/components/ui/card";
import type { ChatbotConfig } from "~/types/chatbot";
import { useLoaderData } from "@remix-run/react";
import type { loader } from "~/routes/app.$tenant/dashboard";

interface FinalReviewProps {
  config: ChatbotConfig;
}

export function FinalReview({ config }: FinalReviewProps) {
  const { industries, chatbotTypes, skills } = useLoaderData<typeof loader>();

  const getIndustryName = (id: string) => 
    industries.find(i => i.id.toString() === id)?.name ?? id;

  const getChatbotTypeName = (id: string) =>
    chatbotTypes.find(t => t.id.toString() === id)?.name ?? id;

  const getSkillNames = (ids: string[]) =>
    ids.map(id => skills.find(s => s.id.toString() === id)?.name ?? id);

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="font-medium mb-4">Configuration Summary</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Industry</h4>
            <p className="mt-1">{getIndustryName(config.industry)}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Chatbot Type</h4>
            <p className="mt-1">{getChatbotTypeName(config.type)}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Selected Skills</h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {getSkillNames(config.skills).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-1 bg-primary/10 text-primary rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Scope</h4>
            <div className="mt-1 space-y-2">
              <p><strong>Purpose:</strong> {config.scope.purpose}</p>
              <p><strong>Audience:</strong> {config.scope.audience}</p>
              <p><strong>Tone:</strong> {config.scope.tone}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Training Data</h4>
            <p className="mt-1">{config.trainingData.length} files uploaded</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Data Source</h4>
            <p className="mt-1">{config.dataSource}</p>
          </div>
        </div>
      </Card>
    </div>
  );
} 