import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useParams, useNavigate } from "@remix-run/react";
import { Link } from "@remix-run/react";
import { ChevronLeft } from "lucide-react";
import { requireAuth } from "~/utils/loaders.middleware";
import { getFileUploadService } from "~/utils/services/api/fileUploadService.server";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import FileUpload from "~/components/core/files/FileUpload";

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

export default function FileUploadRoute() {
  const params = useParams();
  const navigate = useNavigate();

  const handleSuccess = () => {
    setTimeout(() => {
      navigate(`/app/${params.tenant}/g/chatbot`);
    }, 2000);
  };

  const backButton = (
    <Link
      to="../create"
      className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
    >
      <ChevronLeft className="h-4 w-4 mr-1" />
      Back to Data Sources
    </Link>
  );

  return (
    <FileUpload
      onSuccess={handleSuccess}
      showBackButton={true}
      backButtonComponent={backButton}
    />
  );
} 