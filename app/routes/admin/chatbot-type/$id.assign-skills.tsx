import { ActionFunctionArgs, LoaderFunctionArgs, json, redirect } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";
import { db } from "~/utils/db.server";
import { Button } from "~/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "~/components/ui/card";
import { useState } from "react";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await verifyUserHasPermission(request, "admin.chatbotType.edit");

  const [chatbotType, skills] = await Promise.all([
    db.chatbotType.findUnique({
      where: { id: parseInt(params.id!) },
      include: {
        skills: {
          select: { skillId: true }
        }
      }
    }),
    db.skill.findMany({
      where: { isEnabled: true },
      select: { id: true, name: true, icon: true }
    })
  ]);

  if (!chatbotType) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({
    chatbotType,
    skills,
    selectedSkillIds: chatbotType.skills.map(s => s.skillId)
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  await verifyUserHasPermission(request, "admin.chatbotType.edit");
  
  const { skillIds } = await request.json();
  const chatbotTypeId = parseInt(params.id!);

  await db.$transaction(async (tx) => {
    // Delete existing mappings
    await tx.chatbotTypeSkills.deleteMany({
      where: { chatbotTypeId }
    });

    // Create new mappings
    if (skillIds.length > 0) {
      await tx.chatbotTypeSkills.createMany({
        data: skillIds.map((skillId: number) => ({
          chatbotTypeId,
          skillId
        }))
      });
    }
  });

  return json({ success: true });
}

export default function AssignSkills() {
  const { chatbotType, skills, selectedSkillIds } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<number[]>(selectedSkillIds);
  const [isSaving, setIsSaving] = useState(false);

  const handleCheckboxChange = (skillId: number) => {
    setSelectedIds(prev => 
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/admin/chatbot-type/${chatbotType.id}/assign-skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ skillIds: selectedIds })
      });
      toast.success(t("admin.chatbotType.skillsAssigned"));
      navigate('/admin/chatbot-type');
    } catch (error) {
      toast.error(t("admin.chatbotType.skillsAssignError"));
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(selectedIds.sort()) !== JSON.stringify(selectedSkillIds.sort());

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/chatbot-type">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.Back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {t("admin.chatbotType.assignSkills", { chatbotType: chatbotType.name })}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.chatbotType.selectSkills")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {skills.map(skill => (
              <div key={skill.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`skill-${skill.id}`}
                  checked={selectedIds.includes(skill.id)}
                  onChange={() => handleCheckboxChange(skill.id)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor={`skill-${skill.id}`} className="flex items-center space-x-2">
                  {skill.icon && <span>{skill.icon}</span>}
                  <span>{skill.name}</span>
                </label>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/chatbot-type')}
          >
            {t("common.Cancel")}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t("common.Saving") : t("common.Save")}
          </Button>
        </CardFooter>
      </Card>

      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 p-4 rounded-lg shadow-lg">
          <p className="text-yellow-800">
            {t("common.UnsavedChanges")}
          </p>
        </div>
      )}
    </div>
  );
} 