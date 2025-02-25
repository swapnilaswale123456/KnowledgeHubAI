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
  await verifyUserHasPermission(request, "admin.industry.update");

  const [industry, chatbotTypes] = await Promise.all([
    db.industry.findUnique({
      where: { id: parseInt(params.id!) },
      include: {
        chatbotTypes: {
          select: { chatbotTypeId: true }
        }
      }
    }),
    db.chatbotType.findMany({
      where: { isEnabled: true },
      select: { id: true, name: true, icon: true }
    })
  ]);

  if (!industry) {
    throw new Response("Not Found", { status: 404 });
  }

  return json({
    industry,
    chatbotTypes,
    selectedChatbotTypeIds: industry.chatbotTypes.map(ct => ct.chatbotTypeId)
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  await verifyUserHasPermission(request, "admin.industry.update");
  
  const { chatbotTypeIds } = await request.json();
  const industryId = parseInt(params.id!);

  await db.$transaction(async (tx) => {
    // Delete existing mappings
    await tx.industryChatbotTypes.deleteMany({
      where: { industryId }
    });

    // Create new mappings
    if (chatbotTypeIds.length > 0) {
      await tx.industryChatbotTypes.createMany({
        data: chatbotTypeIds.map((chatbotTypeId: number) => ({
          industryId,
          chatbotTypeId
        }))
      });
    }
  });

  return json({ success: true });
}

export default function AssignChatbotTypes() {
  const { industry, chatbotTypes, selectedChatbotTypeIds } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<number[]>(selectedChatbotTypeIds);
  const [isSaving, setIsSaving] = useState(false);

  const handleCheckboxChange = (typeId: number) => {
    setSelectedIds(prev => 
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/admin/industry/${industry.id}/assign-chatbot-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chatbotTypeIds: selectedIds })
      });
      toast.success(t("admin.industry.chatbotTypesAssigned"));
      navigate('/admin/industry');
    } catch (error) {
      toast.error(t("admin.industry.chatbotTypesAssignError"));
      setIsSaving(false);
    }
  };

  const hasChanges = JSON.stringify(selectedIds.sort()) !== JSON.stringify(selectedChatbotTypeIds.sort());

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/industry">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("common.Back")}
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {t("admin.industry.assignChatbotTypes", { industry: industry.name })}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.industry.selectChatbotTypes")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chatbotTypes.map(type => (
              <div key={type.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`type-${type.id}`}
                  checked={selectedIds.includes(type.id)}
                  onChange={() => handleCheckboxChange(type.id)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor={`type-${type.id}`} className="flex items-center space-x-2">
                  {type.icon && <span>{type.icon}</span>}
                  <span>{type.name}</span>
                </label>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/industry')}
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