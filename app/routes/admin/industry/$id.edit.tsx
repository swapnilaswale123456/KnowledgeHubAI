import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { IndustryForm } from "~/components/industry/IndustryForm";
import { getIndustry, updateIndustry } from "~/services/chatbot/IndustryService";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";
import { Link } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await verifyUserHasPermission(request, "admin.industry.view");
  const industry = await getIndustry(params.id!);
  return json({ industry });
}

export async function action({ request, params }: ActionFunctionArgs) {
  await verifyUserHasPermission(request, "admin.industry.view");
  
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const isEnabled = formData.get("isEnabled") === "true";
  const icon = formData.get("icon") as string;

  await updateIndustry(params.id!, { 
    name, 
    description, 
    isEnabled, 
    icon 
  });
  return redirect("/admin/industry");
}

export default function EditIndustry() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const params = useParams();
  const { industry } = useLoaderData<typeof loader>();
  
  const defaultValues = industry ? {
    name: industry.name,
    description: industry.description || undefined,
    isEnabled: industry.isEnabled,
    icon: industry.icon || undefined
  } : undefined;

  const handleSubmit = async (formData: FormData) => {
    try {
      await fetch(`/admin/industry/${params.id}/edit`, {
        method: 'POST',
        body: formData
      });
      toast.success(t("admin.industry.updateSuccess"));
      navigate('/admin/industry');
    } catch (error) {
      toast.error(t("admin.industry.updateError"));
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/industry">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Industry</h1>
      </div>
      <IndustryForm 
        defaultValues={defaultValues} 
        isEditing 
        onSubmit={handleSubmit}
      />
    </div>
  );
} 