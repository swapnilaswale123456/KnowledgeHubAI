import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useTypedLoaderData } from "remix-typedjson";
import { ApiEndpointDto } from "~/modules/api/dtos/ApiEndpointDto";
import ApiSpecsService from "~/modules/api/services/ApiSpecsService";
import EditPageLayout from "~/components/ui/layouts/EditPageLayout";
import ApiSpecs from "~/modules/api/components/ApiSpecs";
import { verifyUserHasPermission } from "~/utils/helpers/.server/PermissionsService";

type LoaderData = {
  apiSpecs: {
    endpoints?: ApiEndpointDto[];
    openApi: any;
    postmanCollection?: any;
  };
};
export const loader = async ({ request }: LoaderFunctionArgs) => {
  await verifyUserHasPermission(request, "admin.apiKeys.view");
  const apiSpecs = await ApiSpecsService.generateSpecs({ request });
  const data: LoaderData = {
    apiSpecs,
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
