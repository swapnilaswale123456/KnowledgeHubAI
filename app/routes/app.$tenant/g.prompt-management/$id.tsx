import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const { id } = params;
  return json({
    promptId: id,
    // Add other prompt details
  });
};

export default function PromptDetail() {
  const { promptId } = useLoaderData<typeof loader>();

  return (
    <div className="p-6">
      <h1>Prompt Details {promptId}</h1>
      {/* Add prompt editing interface */}
    </div>
  );
} 