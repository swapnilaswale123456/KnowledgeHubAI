import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useParams, useFetcher, useNavigate } from "@remix-run/react";
import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "~/components/ui/card";
import { Link } from "@remix-run/react";
import { ChevronLeft } from "lucide-react";
import { requireAuth } from "~/utils/loaders.middleware";
import { getFileUploadService } from "~/utils/services/api/fileUploadService.server";
import ErrorModal from "~/components/ui/modals/ErrorModal";
import SuccessModal, { RefSuccessModal } from "~/components/ui/modals/SuccessModal";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";

interface FileSource {
  sourceId: number;
  fileName: string;
  fileType: string;
  uploadedFilePath: string;
  createdAt: Date;
}

interface UploadResponse {
  success: boolean;
  message: string;
  data?: {
    sourceId: number;
    fileName: string;
    fileSize: number;
    filePath?: string;
    isTrain?: boolean;
  };
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  return json({});
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const tenantId = await getTenantIdFromUrl(params);
  const fileUploadService = getFileUploadService();

  if (intent === "delete") {
    const sourceId = formData.get("sourceId") as string;
    const result = await fileUploadService.deleteDataSource(parseInt(sourceId));
    return json(result);
  }

  if (intent === "train") {
    const sourceId = formData.get("sourceId") as string;
    const file = formData.get("file") as File;
    if (!file) {
      return json({ 
        success: false, 
        message: "No file provided for training" 
      });
    }
    const result = await fileUploadService.uploadFile(file, tenantId, request, true);
    return json(result);
  }

  const file = formData.get("file") as File;
  if (!file) {
    return json({ success: false, message: "No file uploaded" });
  }

  const result = await fileUploadService.uploadFile(file, tenantId, request);
  return json(result);
};

export default function FileUploadRoute() {
  const params = useParams();
  const navigate = useNavigate();
  const fetcher = useFetcher<UploadResponse>();
  const [isUploading, setIsUploading] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    sourceId?: number;
    file?: File;
  } | null>(null);
  const fileRef = useRef<File | null>(null);
  const successModal = useRef<RefSuccessModal>(null);
  const errorModal = useRef<any>(null);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      setUploadedFile({
        name: fetcher.data.data?.fileName || "",
        size: fetcher.data.data?.fileSize || 0,
        sourceId: fetcher.data.data?.sourceId,
        file: fileRef.current || undefined
      });
      if (isTraining) {
        successModal.current?.show("Success!", "File trained successfully");
        setIsTraining(false);
        setTimeout(() => {
         navigate(`/app/${params.tenant}/chatbot`);
        }, 2000);
      }
    } else if (fetcher.state === "idle" && !fetcher.data?.success) {
      setError(fetcher.data?.message || "");
    }
  }, [fetcher.state, fetcher.data, isTraining, navigate]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    fileRef.current = file;
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    
    fetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  const handleTrain = () => {
    if (!uploadedFile?.file) return;
    
    setIsTraining(true);
    const formData = new FormData();
    formData.append("file", uploadedFile.file);
    formData.append("intent", "train");
    
    fetcher.submit(formData, {
      method: "post",
      encType: "multipart/form-data"
    });
  };

  const handleCancel = () => {
    setUploadedFile(null);
    fileRef.current = null;
  };

  const handleSuccessModalClose = () => {
    navigate(`/app/${params.tenant}/chatbot`);
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
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleTrain}
              disabled={isTraining}
              className="px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTraining ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Training...
                </div>
              ) : (
                'Train File'
              )}
            </button>
          </CardFooter>
        )}
      </Card>
      <SuccessModal ref={successModal} onClosed={handleSuccessModalClose} />
      <ErrorModal ref={errorModal} />
    </div>
  );
} 