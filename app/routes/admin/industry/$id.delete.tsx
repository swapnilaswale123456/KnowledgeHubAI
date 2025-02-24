import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { deleteIndustry } from "~/services/chatbot/IndustryService";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";

export async function action({ request, params }: ActionFunctionArgs) {
  await verifyUserHasPermission(request, "admin.industry.delete");
  
  try {
    await deleteIndustry(params.id!);
    return redirect("/admin/industry");
  } catch (error) {
    return redirect("/admin/industry");
  }
} 