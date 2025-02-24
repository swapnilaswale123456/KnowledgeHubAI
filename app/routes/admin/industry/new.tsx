import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { IndustryForm } from "~/components/industry/IndustryForm";
import { createIndustry } from "~/services/chatbot/IndustryService";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";
import { Link } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useNavigate } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export async function action({ request }: ActionFunctionArgs) {
  await verifyUserHasPermission(request, "admin.industry.create");
  
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  await createIndustry({ name, description });
  return redirect("/admin/industry");
}

export default function NewIndustry() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (formData: FormData) => {
    try {
      await fetch('/admin/industry/new', {
        method: 'POST',
        body: formData
      });
      toast.success(t("admin.industry.createSuccess"));
      navigate('/admin/industry');
    } catch (error) {
      toast.error(t("admin.industry.createError"));
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
        <h1 className="text-2xl font-bold">Create New Industry</h1>
      </div>
      <IndustryForm onSubmit={handleSubmit} />
    </div>
  );
} 