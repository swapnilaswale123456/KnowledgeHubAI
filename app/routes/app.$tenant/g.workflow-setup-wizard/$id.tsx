import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params;
  return json({
    workflowId: id,
    title: "Workflow Setup"
  });
};

export default function WorkflowSetupLayout() {
  const { workflowId } = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold">Configure Workflow</h1>
        </div>
      </div>

      <Tabs defaultValue="steps" className="flex-1">
        <div className="border-b px-6">
          <TabsList>
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>
        </div>
        <Outlet />
      </Tabs>
    </div>
  );
} 