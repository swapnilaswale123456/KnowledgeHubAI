import { ActionFunctionArgs, redirect } from "@remix-run/node";
import { deleteSkill } from "~/services/chatbot/SkillService";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";

export async function action({ request, params }: ActionFunctionArgs) {
  await verifyUserHasPermission(request, "admin.skill.delete");
  await deleteSkill(params.id!);
  return redirect("/admin/skill");
}

export async function loader() {
  return redirect("/admin/skill");
} 