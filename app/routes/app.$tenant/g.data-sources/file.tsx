import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/server-runtime";
import { getFileUploadService } from "~/utils/services/api/fileUploadService.server";
import { useLoaderData, useParams, useFetcher, useNavigate } from "@remix-run/react";
import FileUpload from "~/components/core/files/FileUpload";    
import { FileList, FileSource } from "~/components/core/files/FileList";
import { requireAuth } from "~/utils/loaders.middleware";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { DataSourceQueryService } from "~/services/data/DataSourceQueryService";
import { useTranslation } from "react-i18next";
import { useChatbot } from "~/contexts/ChatbotContext";
import { getSelectedChatbot, setSelectedChatbot,commitSession } from "~/utils/session.server";

type LoaderData = {
  files: FileSource[];
  chatbotId: string;
};

// Add loader to fetch file list
export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const chatbotId = await getSelectedChatbot(request); 
  
  if (!chatbotId) {
    return redirect(`/app/${params.tenant}/dashboard`);
  }
  const tenantId = await getTenantIdFromUrl(params);
  const files = await DataSourceQueryService.getDataSources(tenantId, chatbotId);
 
  // Always re-set the session to ensure consistency
  //const session = await setSelectedChatbot(request, chatbotId);
  
  return json(
    { files, chatbotId }
    
  );
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const tenantId = await getTenantIdFromUrl(params);
  const fileUploadService = getFileUploadService(); 
  const selectedChatbotId = formData.get("chatbotId") as string;
  
  if (intent === "delete") {
    const sourceId = formData.get("sourceId") as string;
    const result = await fileUploadService.deleteDataSource(parseInt(sourceId));
    return json(result);
  }

  const file = formData.get("file") as File;
  if (!file) {
    return json({ success: false, message: "No file uploaded" });
  }

  const result = await fileUploadService.uploadFile(
    file, 
    tenantId, 
    request, 
    intent === "train",
    selectedChatbotId
  );
  return json(result);
};

export default function FileRoute() {
  const { t } = useTranslation();
  const { files, chatbotId } = useLoaderData<typeof loader>();
  const params = useParams();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const handleSuccess = () => {
   
  };

  const handleDelete = (sourceId: number) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("sourceId", sourceId.toString());
    formData.append("chatbotId", chatbotId);
    
    fetcher.submit(formData, {
      method: "POST"
    });
  };

  if (!chatbotId) {
    return <div>Please select a chatbot first</div>;
  }

  return (
    <div className="space-y-0">
      <FileUpload 
        onSuccess={handleSuccess}
        showBackButton={false}
        title="Upload Training Documents"
        chatbotId={chatbotId}
      />
      <FileList 
        files={files as unknown as FileSource[]}
        onDelete={handleDelete}
      />
    </div>
  );
}