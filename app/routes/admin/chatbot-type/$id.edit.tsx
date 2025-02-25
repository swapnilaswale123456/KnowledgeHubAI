import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ChatbotTypeForm } from "~/components/chatbot-type/ChatbotTypeForm";
import { updateChatbotType } from "~/services/chatbot/ChatbotTypeService";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";
import { Link } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useNavigate } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { db } from "~/utils/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await verifyUserHasPermission(request, "admin.chatbotType.edit");
  
  const chatbotType = await db.chatbotType.findUnique({
    where: { id: parseInt(params.id!) }
  });

  if (!chatbotType) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ chatbotType });
}

export async function action({ request, params }: ActionFunctionArgs) {
  await verifyUserHasPermission(request, "admin.chatbotType.edit");
  
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const isEnabled = formData.get("isEnabled") === "true";
  const icon = formData.get("icon") as string;

  await updateChatbotType(params.id!, { name, description, isEnabled, icon });
  return redirect("/admin/chatbot-type");
}

export default function EditChatbotType() {
  const { chatbotType } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (formData: FormData) => {
    try {
      await fetch(`/admin/chatbot-type/${chatbotType.id}/edit`, {
        method: 'POST',
        body: formData
      });
      toast.success(t("admin.chatbotType.updateSuccess"));
      navigate('/admin/chatbot-type');
    } catch (error) {
      toast.error(t("admin.chatbotType.updateError"));
    }
  };

  const formDefaultValues = {
    name: chatbotType.name,
    description: chatbotType.description || undefined,
    isEnabled: chatbotType.isEnabled,
    icon: chatbotType.icon || undefined
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/chatbot-type">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("admin.chatbotType.edit")}</h1>
      </div>
      <ChatbotTypeForm 
        defaultValues={formDefaultValues}
        isEditing={true}
        onSubmit={handleSubmit}
      />
    </div>
  );
} 