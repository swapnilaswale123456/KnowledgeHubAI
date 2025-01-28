import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { 
  File, 
  Globe, 
  Type, 
  BookOpen, 
  Youtube,
  Upload,
  X,
  ArrowLeft 
} from "lucide-react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import FileUpload from "~/components/core/files/FileUpload";
import { FileList } from "~/components/core/files/FileList";
import { cn } from "~/lib/utils";

interface DataSourceOption {
  key: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const dataSourceOptions: DataSourceOption[] = [
  {
    key: "file",
    name: "File Upload",
    icon: <File className="h-5 w-5" />,
    description: "Upload PDF, DOC, or TXT files"
  },
  {
    key: "website",
    name: "Website",
    icon: <Globe className="h-5 w-5" />,
    description: "Import from website URLs"
  },
  // ... other options
];

interface DataSourceSelectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function DataSourceSelection({ value, onChange }: DataSourceSelectionProps) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const fetcher = useFetcher();
  const { files } = useLoaderData<typeof loader>();

  const handleSourceSelect = (sourceKey: string) => {
    onChange(sourceKey);
    // The parent component will handle moving to step 6
  };

  const handleSuccess = (result: any) => {
    if (result.success) {
      onChange(result.file.sourceId.toString());
      setSelectedSource(null);
    }
  };

  const handleBack = () => {
    setSelectedSource(null);
  };

  return (
    <div className="space-y-6">
      {selectedSource === "file" ? (
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Sources
          </Button>
          <FileUpload 
            onSuccess={handleSuccess}
            showBackButton={false}
          />
          {files && files.length > 0 && (
            <div className="mt-6">
              <FileList 
                files={files}
                onDelete={(sourceId) => {
                  // Handle delete
                  fetcher.submit(
                    { intent: "delete", sourceId: sourceId.toString() },
                    { method: "POST" }
                  );
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dataSourceOptions.map((source) => (
            <Card 
              key={source.key}
              className={cn(
                "p-4 cursor-pointer hover:border-primary transition-colors",
                value === source.key && "border-primary bg-primary/5"
              )}
              onClick={() => handleSourceSelect(source.key)}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {source.icon}
                </div>
                <div>
                  <h4 className="font-medium">{source.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {source.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 