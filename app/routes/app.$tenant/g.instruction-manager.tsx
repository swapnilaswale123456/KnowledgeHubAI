import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, useNavigate, useSubmit, useNavigation } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Plus, Search, FileText } from "lucide-react";
import { requireAuth } from "~/utils/loaders.middleware";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import EmptyState from "~/components/ui/empty-state";
import { useState } from "react";
import { TemplateCard } from "~/components/instruction-templates/TemplateCard";
import * as templateService from "~/services/instructionTemplateService.server";
import type { MetaFunction } from "@remix-run/node";
import { TemplateModal } from "~/components/instruction-templates/TemplateModal";

export async function loader({ request, params }: LoaderFunctionArgs) {
  await requireAuth({ request, params });
  const tenantId = await getTenantIdFromUrl(params);
  const url = new URL(request.url);
  const templateId = url.searchParams.get('templateId');
  
  const [templates, selectedTemplate] = await Promise.all([
    templateService.getTemplates(tenantId),
    templateId ? templateService.getTemplateById(Number(templateId)) : null
  ]);
  
  return json({ templates, selectedTemplate, title: "Instruction Manager" });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const tenantId = await getTenantIdFromUrl(params);
  const formData = await request.formData();
  const { _action, ...values } = Object.fromEntries(formData);

  switch (_action) {
    case 'create':
      return await templateService.createTemplate({ ...values, tenantId } as any);
    case 'update':
      return await templateService.updateTemplate(Number(values.id), values as any);
    case 'delete':
      return await templateService.deleteTemplate(Number(values.id));
    default:
      return null;
  }
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data?.title || "Instruction Templates | KnowledgeHub AI" }
];

export default function InstructionManager() {
  const { templates } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const submit = useSubmit();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isSubmitting = navigation.state === 'submitting';

  const filteredTemplates = templates.filter(template => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.objective.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSave = async (data: any) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    
    if (data.id) {
      formData.append('_action', 'update');
    } else {
      formData.append('_action', 'create');
    }

    await submit(formData, { method: 'post' });
    setIsModalOpen(false);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const formData = new FormData();
      formData.append('id', id.toString());
      formData.append('_action', 'delete');
      await submit(formData, { method: 'post' });
    }
  };

  const handleView = (template: any) => {
    setSelectedTemplate(template);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Instruction Templates
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Easily create, customize, and manage your chatbot templates
          </p>
        </div>
        <Button 
          onClick={handleCreate}
          className="inline-flex items-center gap-x-2 rounded-md bg-blue-600/10 px-3.5 py-2 text-sm font-medium text-blue-600 hover:bg-blue-600 hover:text-white dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500 dark:hover:text-white transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Template
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search templates..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8" />}
          title="No templates found"
          description={searchQuery ? "Try adjusting your search" : "Create your first template to get started"}
          action={
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Template
            </Button>
          }
        />
      ) : (
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
              onDuplicate={(id) => navigate(`duplicate/${id}`)}
              onDelete={handleDelete}
              onView={handleView}
            />
          ))}
        </div>
      )}

      <TemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={selectedTemplate}
        mode={modalMode}
        onSave={handleSave}
        isSubmitting={isSubmitting || isLoading}
      />
    </div>
  );
}
