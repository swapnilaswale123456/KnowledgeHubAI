import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { deleteChatbotType } from "~/services/chatbot/ChatbotTypeService";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";

export async function action({ request, params }: ActionFunctionArgs) {
  await verifyUserHasPermission(request, "admin.chatbotType.delete");
  await deleteChatbotType(params.id!);
  return redirect("/admin/chatbot-type");
}

export async function loader() {
  return redirect("/admin/chatbot-type");
} 