import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { SkillForm } from "~/components/skill/SkillForm";
import { updateSkill } from "~/services/chatbot/SkillService";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";
import { Link } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useNavigate } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { db } from "~/utils/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await verifyUserHasPermission(request, "admin.skill.edit");
  
  const skill = await db.skill.findUnique({
    where: { id: parseInt(params.id!) }
  });

  if (!skill) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({ skill });
}

export async function action({ request, params }: ActionFunctionArgs) {
  await verifyUserHasPermission(request, "admin.skill.edit");
  
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const isEnabled = formData.get("isEnabled") === "true";
  const icon = formData.get("icon") as string;

  await updateSkill(params.id!, { name, description, isEnabled, icon });
  return redirect("/admin/skill");
}

export default function EditSkill() {
  const { skill } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (formData: FormData) => {
    try {
      await fetch(`/admin/skill/${skill.id}/edit`, {
        method: 'POST',
        body: formData
      });
      toast.success(t("admin.skill.updateSuccess"));
      navigate('/admin/skill');
    } catch (error) {
      toast.error(t("admin.skill.updateError"));
    }
  };

  const formDefaultValues = {
    name: skill.name,
    description: skill.description || undefined,
    isEnabled: skill.isEnabled,
    icon: skill.icon || undefined
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/skill">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.Back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">{t("admin.skill.edit")}</h1>
      </div>
      <SkillForm 
        defaultValues={formDefaultValues}
        isEditing={true}
        onSubmit={handleSubmit}
      />
    </div>
  );
} 