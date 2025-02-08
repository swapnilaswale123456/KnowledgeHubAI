import { X } from "lucide-react";
import { Link } from "@remix-run/react";
import { cn } from "~/lib/utils";

interface QuickStartStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  action: string;
  icon: React.ReactNode;
  link: string;
}

interface QuickStartGuideProps {
  steps: QuickStartStep[];
  onClose: () => void;
}

export function QuickStartGuide({ steps, onClose }: QuickStartGuideProps) {
  return (
    <div className="w-[420px] bg-white border-l hidden md:block">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Quick Start Guide</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-2 space-y-4 overflow-y-auto h-[calc(100%-5rem)]">
        {steps.map((step) => (
          <div key={step.id} className="group">
            <div className="flex items-start gap-3 mb-2">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center mt-0.5 text-sm",
                step.isCompleted 
                  ? "bg-primary text-white"
                  : "border-2 border-gray-300 text-gray-500"
              )}>
                {step.isCompleted ? '✓' : step.id}
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  {step.title}
                  <span className="text-gray-500">{step.icon}</span>
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
                <Link
                  to={step.link}
                  className="inline-flex items-center gap-2 px-4 py-1.5 text-xs bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors mt-2"
                >
                  {step.action}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 