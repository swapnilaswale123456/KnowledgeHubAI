import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/server-runtime";
import { getFileUploadService } from "~/utils/services/api/fileUploadService.server";
import { useLoaderData, useParams, useFetcher } from "@remix-run/react";
import { useState, useEffect } from "react";
import { db } from "~/utils/db.server";
import { FileUpload } from "~/components/data-sources/FileUpload";
import { FileList } from "~/components/data-sources/FileList";

interface FileSource {
  sourceId: number;
  fileName: string;
  fileType: string;
  uploadedFilePath: string;
  createdAt: Date;
}

function getFileFormat(fileType: string): string {
  // Remove 'application/' or other prefixes
  const format = fileType.split('/').pop() || fileType;
  
  // Map common mimetypes to shorter formats
  const formatMap: Record<string, string> = {
    'vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'msword': 'DOC',
    'pdf': 'PDF',
    'plain': 'TXT',
    'text/plain': 'TXT'
  };

  return formatMap[format] || format.toUpperCase();
}

// Add loader to fetch file list
export const loader = async ({ params }: LoaderFunctionArgs) => {
  const tenantId = params.tenant!;
  
  const rawFiles = await db.$queryRaw<FileSource[]>`
    SELECT 
      "sourceId",
      "uploadedFilePath",
      "createdAt",
      "sourceDetails"->>'fileName' as "fileName",
      "sourceDetails"->>'fileType' as "fileType"
    FROM "DataSources"
    WHERE "tenantId" = ${tenantId}
    AND "sourceTypeId" = 2
    ORDER BY "createdAt" DESC
  `;

  // Convert createdAt strings to Date objects
  const files = rawFiles.map(file => ({
    ...file,
    createdAt: new Date(file.createdAt)
  }));

  return json({ files });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    const sourceId = parseInt(formData.get("sourceId") as string);
    
    // Add type casting in the SQL query
    await db.$executeRaw`
      DELETE FROM "DataSources" 
      WHERE "sourceId" = ${sourceId}::integer
    `;
    
    return json({ success: true });
  }

  // ... rest of your existing action code for file upload
  const file = formData.get('file') as File;
  const tenantId = params.tenant!;

  if (!file) {
    return json(
      { success: false, message: 'No file provided' }, 
      { status: 400 }
    );
  }

  const fileUploadService = getFileUploadService();
  const result = await fileUploadService.uploadFile(file, tenantId, request);
  return json(result);
};

export default function DataSourceFileRoute() {
  const { t } = useTranslation();
  const params = useParams();
  const { files } = useLoaderData<typeof loader>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fetcher = useFetcher();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      fetcher.submit(formData, {
        method: 'POST',
        action: `/app/${params.tenant}/g/data-sources/file`,
        encType: 'multipart/form-data'
      });

      setSuccess("File uploaded and metadata saved successfully");
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (sourceId: number) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("sourceId", sourceId.toString());

    fetcher.submit(formData, {
      method: "POST",
      action: `/app/${params.tenant}/g/data-sources/file`,
    });
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const optimisticFiles = fetcher.state === "submitting" 
    ? files.filter(file => file.sourceId !== Number(fetcher.formData?.get("sourceId")))
    : files;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between py-4">
      <h2 className="text-xl font-semibold tracking-tight">File Upload</h2>
    </div>
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            <FileUpload 
              isUploading={isUploading}
              onFileSelect={handleFileUpload}
            />
            {error && (
              <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm text-green-500 p-2 bg-green-50 rounded">
                {success}
              </div>
            )}
            <FileList 
              files={optimisticFiles}
              onDelete={handleDelete}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}