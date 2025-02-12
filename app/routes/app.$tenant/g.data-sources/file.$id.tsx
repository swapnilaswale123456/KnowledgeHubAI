import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/server-runtime";
import { getFileUploadService } from "~/utils/services/api/fileUploadService.server";
import { useLoaderData, useParams, useFetcher, useNavigate } from "@remix-run/react";
import FileUpload from "~/components/core/files/FileUpload";    
import { FileList, FileSource } from "~/components/core/files/FileList";
import { requireAuth } from "~/utils/loaders.middleware";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { db } from "~/utils/db.server";
import { DataSourceQueryService } from "~/services/data/DataSourceQueryService";

type LoaderData = {
  files: FileSource[];
};

// Add loader to fetch file list
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  const tenantId = await getTenantIdFromUrl(params);

  const files = await DataSourceQueryService.getDataSources(tenantId);

  return json({
    files
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const tenantId = await getTenantIdFromUrl(params);
  const fileUploadService = getFileUploadService(); 
  const selectedChatbotId = params.id;
  
  if (intent === "delete") {
    const sourceId = formData.get("sourceId") as string;
    const result = await fileUploadService.deleteDataSource(parseInt(sourceId));
    return json(result);
  }

  if (intent === "train") {
    const sourceId = formData.get("sourceId") as string;
    const file = formData.get("file") as File;
    if (!file) {
      return json({ success: false, message: "No file provided for training" });
    }
    const result = await fileUploadService.uploadFile(file, tenantId, request, true, selectedChatbotId);
    return json(result);
  }

  const file = formData.get("file") as File;
  if (!file) {
    return json({ success: false, message: "No file uploaded" });
  }

  const result = await fileUploadService.uploadFile(file, tenantId, request, false, selectedChatbotId);
  return json(result);
};

export default function DataSourceFileRoute() {
  const { files } = useLoaderData<typeof loader>();
  const params = useParams();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const handleSuccess = () => {
    setTimeout(() => {
      navigate(`/app/${params.tenant}/g/chatbot`);
    }, 2000);
  };

  const handleDelete = (sourceId: number) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("sourceId", sourceId.toString());
    
    fetcher.submit(formData, {
      method: "POST"
    });
  };

  return (
    <div className="space-y-0">
      <FileUpload 
        onSuccess={handleSuccess}
        showBackButton={false}
        title="Upload Training Documents"
      />
      <FileList 
        files={files as unknown as FileSource[]}
        onDelete={handleDelete}
      />
    </div>
  );
}