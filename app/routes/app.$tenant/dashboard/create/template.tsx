import { json, LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { useNavigate, useParams, useFetcher } from "@remix-run/react";
import { requireAuth } from "~/utils/loaders.middleware";
import ResearchTemplates from "~/components/research/ResearchTemplates";
import { ResearchRequestsService, CreateResearchRequestData } from "~/services/research/researchRequests.server";
import { useState, useEffect } from "react";
import { getTenantIdFromUrl } from "~/utils/services/.server/urlService";

interface ResearchTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  config: {
    subreddits: string[];
    keywords: string[];
    min_score: number;
    min_comments: number;
    schedule_type: 'daily' | 'weekly' | 'monthly';
    additional_settings?: Record<string, any>;
  };
}

interface ActionData {
  success?: boolean;
  requestId?: string;
  error?: string;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireAuth({ request, params });
  return json({});
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  await requireAuth({ request, params });
  const formData = await request.formData();
  const tenant = params.tenant;
  const tenantId = await getTenantIdFromUrl(params);
  if (!tenantId) {
    return json({ error: "Tenant ID is required" }, { status: 400 });
  }

  try {
    const researchService = ResearchRequestsService.getInstance();
    
    // Log the form data for debugging
    console.log('Form data received:', {
      name: formData.get("name"),
      description: formData.get("description"),
      tenant_id: tenantId,
      subreddits: formData.get("subreddits"),
      keywords: formData.get("keywords"),
      min_score: formData.get("min_score"),
      min_comments: formData.get("min_comments"),
      schedule_type: formData.get("schedule_type"),
      created_by: formData.get("created_by"),
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date")
    });

    // Validate required fields
    const requiredFields = ["name", "description", "subreddits", "keywords", "min_score", "min_comments", "schedule_type"];
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Parse and validate JSON fields
    let subreddits: string[];
    let keywords: string[];
    try {
      subreddits = JSON.parse(formData.get("subreddits") as string);
      if (!Array.isArray(subreddits)) {
        throw new Error("subreddits must be an array");
      }
    } catch (e) {
      throw new Error(`Invalid subreddits format: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    try {
      keywords = JSON.parse(formData.get("keywords") as string);
      if (!Array.isArray(keywords)) {
        throw new Error("keywords must be an array");
      }
    } catch (e) {
      throw new Error(`Invalid keywords format: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    // Create a new research request based on the template
    const requestData: CreateResearchRequestData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      tenant_id: tenantId,
      subreddits,
      keywords,
      min_score: Number(formData.get("min_score")),
      min_comments: Number(formData.get("min_comments")),
      schedule_type: formData.get("schedule_type") as 'daily' | 'weekly' | 'monthly',
      created_by: formData.get("created_by") as string,
      date_range: {
        start_date: formData.get("start_date") as string,
        end_date: formData.get("end_date") as string
      }
    };

    // Log the request data before sending
    console.log('Sending request data:', requestData);

    const newRequest = await researchService.createRequest(requestData);

    if (!newRequest?.id) {
      throw new Error("Failed to create research request: No ID returned");
    }

    return json({ success: true, requestId: newRequest.id });
  } catch (error) {
    console.error('Error creating research request:', error);
    return json(
      { 
        error: error instanceof Error 
          ? error.message 
          : "Failed to create research request",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
};

export default function CreateFromTemplate() {
  const navigate = useNavigate();
  const { tenant } = useParams();
  const fetcher = useFetcher<ActionData>();
  const [error, setError] = useState<string | null>(null);

  const handleTemplateSelect = async (template: ResearchTemplate) => {
    if (!tenant) {
      setError("Tenant ID is required");
      return;
    }

    const formData = new FormData();
    formData.append("name", template.name);
    formData.append("description", template.description);
    formData.append("subreddits", JSON.stringify(template.config.subreddits));
    formData.append("keywords", JSON.stringify(template.config.keywords));
    formData.append("min_score", template.config.min_score.toString());
    formData.append("min_comments", template.config.min_comments.toString());
    formData.append("schedule_type", template.config.schedule_type);
    formData.append("created_by", "system");
    formData.append("start_date", new Date().toISOString());
    formData.append("end_date", new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

    fetcher.submit(formData, { method: "post" });
  };

  // Handle fetcher state changes in useEffect
  useEffect(() => {
    if (fetcher.data?.error) {
      setError(fetcher.data.error);
    } else if (fetcher.data?.success && fetcher.data?.requestId) {
      navigate(`/app/${tenant}/dashboard/view/${fetcher.data.requestId}`);
    }
  }, [fetcher.data, navigate, tenant]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Research Request</h1>
        <p className="mt-2 text-sm text-gray-600">
          Choose a template to quickly set up your research request, or customize it to your needs.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ResearchTemplates onSelectTemplate={handleTemplateSelect} />
    </div>
  );
} 