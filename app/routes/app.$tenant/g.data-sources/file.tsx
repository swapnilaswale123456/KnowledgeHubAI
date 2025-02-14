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
import { toast } from "sonner";
import { useRef, useState } from "react";
import ConfirmModal, { RefConfirmModal } from "~/components/ui/modals/ConfirmModal";
import { FileTrainingStatus } from "~/types/file-status.enum";

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
  const sourceId = formData.get("sourceId") as string;
  
  if (intent === "delete") {
    const result = await fileUploadService.deleteDataSource(parseInt(sourceId));
    return json(result);
  }

  if (intent === "update-status") {
    const status = FileTrainingStatus.TRAINED;
    const message = formData.get("message") as string;

    const result = await fileUploadService.updateDataSource(parseInt(sourceId), {
      sourceDetails: {
        status,
        message,
        isTrained: true
      }
    });
    return json({ 
      success: true, 
      message: "Status updated",
      intent: "update-status"
    });
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
    selectedChatbotId,
    sourceId
  );
  return json({
    success: true,
    message: "File processed",
    intent: intent?.toString(),
    data: result.data
  });
};

export default function FileRoute() {
  const { t } = useTranslation();
  const { files, chatbotId } = useLoaderData<typeof loader>();
  const params = useParams();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const confirmModal = useRef<RefConfirmModal>(null);
  const [sourceIdToDelete, setSourceIdToDelete] = useState<number | null>(null);

  const handleSuccess = () => {
   toast.success("File uploaded successfully and is ready for training",{
    description: "Your file has been uploaded and is ready for training.",
    duration: 3000,
    position: "top-center",
   });     
  };

  const handleDelete = (sourceId: number) => {
    setSourceIdToDelete(sourceId);
    confirmModal.current?.show(
      "Delete File", 
      "Delete", 
      "Cancel", 
      "Are you sure you want to delete this file? This action cannot be undone."
    );
  };

  const handleDeleteConfirm = () => {
    if (!sourceIdToDelete) return;
    
    const formData = new FormData();
    formData.append("intent", "delete");
    formData.append("sourceId", sourceIdToDelete.toString());
    formData.append("chatbotId", chatbotId);
    
    fetcher.submit(formData, {
      method: "POST"
    });

    setSourceIdToDelete(null); // Reset after delete
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
      <ConfirmModal ref={confirmModal} onYes={handleDeleteConfirm} destructive/>
    </div>
  );
}