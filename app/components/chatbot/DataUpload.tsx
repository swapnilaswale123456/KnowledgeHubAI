import { Upload, File, X, ArrowLeft } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { useFetcher } from "@remix-run/react";
import { Progress } from "~/components/ui/progress";
import FileUpload from "~/components/core/files/FileUpload";
import { FileList, FileSource } from "~/components/core/files/FileList";
import { DataSourceQueryService } from "~/services/data/DataSourceQueryService";

interface DataUploadProps {
  files: FileSource[];
  onChange: (files: FileSource[]) => void;
  onChangeDataSource: () => void;
  existingFiles: FileSource[];
  chatbotId?: string;
}

export function DataUpload({ files = [], onChange, onChangeDataSource, existingFiles, chatbotId }: DataUploadProps) {
  const fetcher = useFetcher();
  const [fileList, setFileList] = useState<FileSource[]>(
    existingFiles.filter(f => f.chatbotId === chatbotId)
  );

  useEffect(() => {
    onChange(fileList);
  }, [fileList, onChange]);

  useEffect(() => {
    setFileList(existingFiles.filter(f => f.chatbotId === chatbotId));
  }, [existingFiles, chatbotId]);

  useEffect(() => {
    if (chatbotId) {
      const formData = new FormData();
      formData.append("intent", "get-files");
      formData.append("chatbotId", chatbotId);
      
      fetcher.submit(formData, { method: "POST" });
    }
  }, [chatbotId]);

  const handleSuccess = (result: any) => {
    if (result && result.data) {
      const newFile: FileSource = {
        sourceId: result.data.sourceId,
        fileName: result.data.fileName,
        fileType: result.data.fileType || 'application/octet-stream',
        createdAt: new Date(),
        isTrained: false
      };
      setFileList(prev => [...prev, newFile]);
      onChange([...files, newFile]);
    }
  };

  const handleDelete = (sourceId: number) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("sourceId", sourceId.toString());
    
    fetcher.submit(formData, {
      method: "POST"
    });

    setFileList(prev => prev.filter(f => f.sourceId !== sourceId));
    onChange(files.filter(f => f.sourceId !== sourceId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onChangeDataSource}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Change Data Source
        </Button>
      </div>

      <FileUpload 
        onSuccess={handleSuccess}
        showBackButton={false}
        chatbotId={chatbotId}
      />

      <div className="mt-6">
        <FileList 
          files={fileList}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
} 