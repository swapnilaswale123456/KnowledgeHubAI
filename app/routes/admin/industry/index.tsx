import { useLoaderData } from "@remix-run/react";
import { json, LoaderFunctionArgs } from "@remix-run/server-runtime";
import { getIndustries } from "~/services/chatbot/InstructionService";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";
import { getTranslations } from "~/locale/i18next.server";
import { useAppOrAdminData } from "~/utils/data/useAppOrAdminData";
import { getUserHasPermission } from "~/utils/helpers/PermissionsHelper";
import { useTranslation } from "react-i18next";

export async function loader({ request }: LoaderFunctionArgs) {
  await verifyUserHasPermission(request, "admin.industry.view");
  const industries = await getIndustries();
  const { t } = await getTranslations(request);
  return json({ industries, title: t("admin.industry.title") });
}

export default function Industry() {
  const { industries, title } = useLoaderData<typeof loader>();
  const appOrAdminData = useAppOrAdminData();
  const { t } = useTranslation();
  return (
    getUserHasPermission(appOrAdminData, "admin.industry.view") ? (
    <div >
      <h1>{title}</h1>
      <ul>
        {industries.map((industry: any) => (
          <li key={industry.id}>{industry.name}</li>
        ))}
      </ul>
      </div>
    ) : (
      <div>
        <h1>{t("admin.industry.unauthorized")}</h1>
      </div>
    )
  );
}