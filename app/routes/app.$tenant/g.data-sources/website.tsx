import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/server-runtime";
import { getWebsiteUploadService } from "~/utils/services/api/websiteUploadService.server";
import { useLoaderData, useParams, useFetcher, useNavigate } from "@remix-run/react";
import FileUpload from "~/components/core/files/FileUpload";    
import { WebsiteList , WebsiteSource } from "~/components/core/Websites/WebsiteList";
import { requireAuth } from "~/utils/loaders.middleware";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";
import { db } from "~/utils/db.server";
import { WebsiteQueryService } from "~/services/data/WebsiteQueryService";
import WebsiteUpload from "~/components/core/Websites/WebsiteUpload";

type LoaderData = {
    files: WebsiteSource[];
  };

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
    await requireAuth({ request, params });
    const tenantId = await getTenantIdFromUrl(params);
  
    const websites = await WebsiteQueryService.getDataSources(tenantId);
  
    return json({
        websites
    });
  };

  export const action = async ({ request, params }: ActionFunctionArgs) => {
    const formData = await request.formData();
    const intent = formData.get("intent");
    const tenantId = await getTenantIdFromUrl(params);
    const webssiteUploadService = getWebsiteUploadService();
  
    if (intent === "delete") {
      const sourceId = formData.get("sourceId") as string;
      const result = await webssiteUploadService.deleteDataSource(parseInt(sourceId));
      return json(result);
    }
  
    if (intent === "train") {
      const sourceId = formData.get("sourceId") as string;
      const url = formData.get("url") as string;
      if (!url) {
        return json({ success: false, message: "No url provided for training" });
      }
      const result = await webssiteUploadService.uploadWebsite(url, tenantId, request, true);
      return json(result);
    }
  
    const url = formData.get("url") as string;
    if (!url) {
      return json({ success: false, message: "No website uploaded" });
    }
  
    const result = await webssiteUploadService.uploadWebsite(url, tenantId, request);
    return json(result);
  };

  export default function DataSourceFileRoute() {
    const { websites } = useLoaderData<typeof loader>();
    const params = useParams();
    const navigate = useNavigate();
    const fetcher = useFetcher();
  
    const handleSuccess = () => {
      setTimeout(() => {
        navigate(`/app/${params.tenant}/g/chatbot`);
      }, 2000);
    };
  
    const handleDelete = (sourceId: number) => {
      if (!confirm("Are you sure you want to delete this file?")) return;
      
      const formData = new FormData();
      formData.append("intent", "delete");
      formData.append("sourceId", sourceId.toString());
      
      fetcher.submit(formData, {
        method: "POST"
      });
    };
  
    return (
      <div className="space-y-0">
        <WebsiteUpload 
          onSuccess={handleSuccess}
          showBackButton={false}
          title="Upload Training Urls"
        />
        <WebsiteList 
          websites={websites as unknown as WebsiteSource[]}
          onDelete={handleDelete}
        />
      </div>
    );
  }