import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card } from "~/components/ui/card";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  return json({
    workflowId: params.id
  });
};

export default function WorkflowActions() {
  const { workflowId } = useLoaderData<typeof loader>();

  return (
    <div className="p-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-6">Workflow Actions</h2>
        {/* Add workflow actions configuration */}
      </Card>
    </div>
  );
} 