import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { SkillForm } from "~/components/skill/SkillForm";
import { createSkill } from "~/services/chatbot/SkillService";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";
import { Link } from "@remix-run/react";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useNavigate } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export async function action({ request }: ActionFunctionArgs) {
  await verifyUserHasPermission(request, "admin.skill.create");
  
  const formData = await request.formData();
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const isEnabled = formData.get("isEnabled") === "true";
  const icon = formData.get("icon") as string;

  await createSkill({ name, description, isEnabled, icon });
  return redirect("/admin/skill");
}

export default function NewSkill() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (formData: FormData) => {
    try {
      await fetch('/admin/skill/new', {
        method: 'POST',
        body: formData
      });
      toast.success(t("admin.skill.createSuccess"));
      navigate('/admin/skill');
    } catch (error) {
      toast.error(t("admin.skill.createError"));
    }
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
        <h1 className="text-2xl font-bold">{t("admin.skill.new")}</h1>
      </div>
      <SkillForm onSubmit={handleSubmit} />
    </div>
  );
} 