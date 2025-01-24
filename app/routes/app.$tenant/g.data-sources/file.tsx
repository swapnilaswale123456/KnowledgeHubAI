import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/server-runtime";
import { getFileUploadService } from "~/utils/services/api/fileUploadService.server";
import { useLoaderData, useParams, useFetcher, useNavigate } from "@remix-run/react";

import FileUpload from "~/components/core/files/FileUpload";    
import { requireAuth } from "~/utils/loaders.middleware";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";

// Add loader to fetch file list
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
      return json({ success: false, message: "No file provided for training" });
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

export default function DataSourceFileRoute() {
  const params = useParams();
  const navigate = useNavigate();

  const handleSuccess = () => {
    setTimeout(() => {
      navigate(`/app/${params.tenant}/g/chatbot`);
    }, 2000);
  };

  return (
    <FileUpload 
      onSuccess={handleSuccess}
      showBackButton={false}
      title="Upload Training Documents"
    />
  );
}