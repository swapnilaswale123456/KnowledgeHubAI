import { Card } from "~/components/ui/card";
import type { ChatbotConfig } from "~/types/chatbot";

interface FinalReviewProps {
  config: ChatbotConfig;
}

export function FinalReview({ config }: FinalReviewProps) {
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <h3 className="font-medium mb-4">Configuration Summary</h3>
        
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Industry</h4>
            <p className="mt-1">{config.industry}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Chatbot Type</h4>
            <p className="mt-1">{config.type}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Selected Skills</h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {config.skills.map((skill) => (
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