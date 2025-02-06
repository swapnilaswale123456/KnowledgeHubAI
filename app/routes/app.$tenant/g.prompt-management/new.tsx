import { ActionFunctionArgs, json } from "@remix-run/node";

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "POST") {
    // Handle prompt creation
    return json({ success: true });
  }
  return json({ error: "Method not allowed" }, { status: 405 });
};

export default function NewPrompt() {
  return (
    <div className="p-6">
      <h1>Create New Prompt</h1>
      {/* Add new prompt form */}
    </div>
  );
} 