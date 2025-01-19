import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useParams, useFetcher, useNavigate } from "@remix-run/react";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "~/components/ui/card";
import { Link } from "@remix-run/react";
import { ChevronLeft } from "lucide-react";
import { requireAuth } from "~/utils/loaders.middleware";
import { getFileUploadService } from "~/utils/services/api/fileUploadService.server";

interface FileSource {
  sourceId: number;
  fileName: string;
  fileType: string;
  uploadedFilePath: string;
  createdAt: Date;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  return json({});
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const tenantId = params.tenant!;

  const fileUploadService = getFileUploadService();
  const result = await fileUploadService.uploadFile(file, tenantId, request);

  return json(result);
};

export default function FileUploadRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploadedFile(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      fetcher.submit(formData, {
        method: 'POST',
        encType: 'multipart/form-data'
      });

      setUploadedFile({
        name: file.name,
        size: file.size
      });
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex-1 space-y-6 p-8 max-w-5xl mx-auto">
      <div className="flex items-center mb-8">
        <Link
          to="../create"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Data Sources
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {!uploadedFile ? (
              <div className="flex items-center justify-center w-full">
                <label
                  className={`flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                    isUploading ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">
                        {isUploading ? "Uploading..." : "Click to upload"}
                      </span>
                      {!isUploading && " or drag and drop"}
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, TXT up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt"
                    disabled={isUploading}
                  />
                </label>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-medium mb-4">Uploaded File Details</h3>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-500">File name:</span>{" "}
                    <span className="font-medium">{uploadedFile.name}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">Size:</span>{" "}
                    <span className="font-medium">{formatFileSize(uploadedFile.size)}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-500">Status:</span>{" "}
                    <span className="text-green-600 font-medium">Ready for training</span>
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-500 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}
          </div>
        </CardContent>
        {uploadedFile && (
          <CardFooter className="flex justify-end space-x-4 pt-6">
            <button
              onClick={() => navigate('../create')}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {/* Handle training */}}
              className="px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800"
            >
              Train File
            </button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
} 