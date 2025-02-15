import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useTypedLoaderData } from "remix-typedjson";
import ApiSpecsService, { ApiSpecsDto } from "~/modules/api/services/ApiSpecsService";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import ApiSpecs from "~/modules/api/components/ApiSpecs";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";

type LoaderData = {
  apiSpecs: ApiSpecsDto;
};
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await verifyUserHasPermission(request, "admin.entities.view");
  const data: LoaderData = {
    apiSpecs: await ApiSpecsService.generateSpecs({ request }),
  };
  return json(data);
};

export default function () {
  const data = useTypedLoaderData<LoaderData>();

  return (
    <EditPageLayout title="API Docs">
      <ApiSpecs item={data.apiSpecs} />
    </EditPageLayout>
  );
}
