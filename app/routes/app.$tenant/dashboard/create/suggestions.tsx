import { json, ActionFunctionArgs } from "@remix-run/node";
import { requireAuth } from "~/utils/loaders.middleware";
import { ResearchSuggestionsService } from "~/services/ai/researchSuggestions.server";

export async function action({ request, params }: ActionFunctionArgs) {
  await requireAuth({ request, params });
  
  const formData = await request.formData();
  const description = formData.get("description") as string;

  if (!description) {
    return json({ error: "Description is required" }, { status: 400 });
  }

  try {
    const suggestionsService = ResearchSuggestionsService.getInstance();
    const suggestions = await suggestionsService.getSuggestions(description);
    return json({ suggestions });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return json({ error: "Failed to get suggestions" }, { status: 500 });
  }
} 