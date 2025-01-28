import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Bot, FileText, Globe, Database } from "lucide-react";

const dataSourceTypes = [
  {
    id: "files",
    title: "Document Upload",
    description: "Upload PDFs, Word documents, or text files",
    icon: FileText,
  },
  {
    id: "website",
    title: "Website Crawler",
    description: "Import content from your website",
    icon: Globe,
  },
  {
    id: "database",
    title: "Database Connection",
    description: "Connect to your database",
    icon: Database,
  },
  {
    id: "chatbot",
    title: "Existing Chatbot",
    description: "Use an existing chatbot as a data source",
    icon: Bot,
  },
];

interface DataSourceSelectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function DataSourceSelection({ value, onChange }: DataSourceSelectionProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {dataSourceTypes.map((type) => {
        const Icon = type.icon;
        return (
          <Card
            key={type.id}
            className={`relative p-4 cursor-pointer hover:border-primary transition-colors ${
              value === type.id ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => onChange(type.id)}
          >
            <div className="flex flex-col h-full">
              <div className="mb-3">
                <div className="p-1.5 w-fit rounded-lg bg-primary/10">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1">{type.title}</h3>
                <p className="text-xs text-gray-500">{type.description}</p>
              </div>
            </div>
            {value === type.id && (
              <div className="absolute top-2 right-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
} 