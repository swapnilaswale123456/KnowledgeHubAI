import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { zapierPartnerClient } from "~/lib/zapier/partner-client";
import { isAuthenticated } from "~/utils/auth";
import { getUserZapierToken } from "~/utils/zapier-auth.server";

// API response type
interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Check authentication
  const user = await isAuthenticated(request);
  if (!user) {
    return json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Get query parameters
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (!action) {
    return json<ApiResponse>({ success: false, error: "Missing action parameter" }, { status: 400 });
  }

  try {
    // Get user's Zapier access token from your database
    const zapierToken = await getUserZapierToken(user.id);
    
    if (!zapierToken) {
      return json<ApiResponse>({ 
        success: false, 
        error: "User not connected to Zapier" 
      }, { status: 401 });
    }

    // Handle different actions
    switch (action) {
      case "getUserZaps":
        const zaps = await zapierPartnerClient.getUserZaps(zapierToken);
        return json<ApiResponse>({ success: true, data: zaps });
      
      case "getIntegrations":
        const integrations = await zapierPartnerClient.getIntegrations();
        return json<ApiResponse>({ success: true, data: integrations });
      
      default:
        return json<ApiResponse>({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Zapier Partner API] Error:", error);
    return json<ApiResponse>({ 
      success: false, 
      error: `Failed to process request: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  // Check authentication
  const user = await isAuthenticated(request);
  if (!user) {
    return json<ApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Parse form data
  const formData = await request.formData();
  const action = formData.get("action") as string;

  if (!action) {
    return json<ApiResponse>({ success: false, error: "Missing action parameter" }, { status: 400 });
  }

  try {
    // Get user's Zapier access token from your database
    const zapierToken = await getUserZapierToken(user.id);
    
    if (!zapierToken) {
      return json<ApiResponse>({ 
        success: false, 
        error: "User not connected to Zapier" 
      }, { status: 401 });
    }

    // Handle different actions
    switch (action) {
      case "enableZap":
        const enableZapId = formData.get("zapId") as string;
        if (!enableZapId) {
          return json<ApiResponse>({ success: false, error: "Missing zapId" }, { status: 400 });
        }
        const enableResult = await zapierPartnerClient.enableZap(enableZapId, zapierToken);
        return json<ApiResponse>({ success: true, data: enableResult });
      
      case "disableZap":
        const disableZapId = formData.get("zapId") as string;
        if (!disableZapId) {
          return json<ApiResponse>({ success: false, error: "Missing zapId" }, { status: 400 });
        }
        const disableResult = await zapierPartnerClient.disableZap(disableZapId, zapierToken);
        return json<ApiResponse>({ success: true, data: disableResult });
      
      case "createZapTemplate":
        const templateData = JSON.parse(formData.get("template") as string);
        const templateResult = await zapierPartnerClient.createZapTemplate(templateData);
        return json<ApiResponse>({ success: true, data: templateResult });
      
      default:
        return json<ApiResponse>({ success: false, error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Zapier Partner API] Error:", error);
    return json<ApiResponse>({ 
      success: false, 
      error: `Failed to process request: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
}

// Helper function to get user's Zapier token
// Implement this based on your database structure
async function getUserZapierToken(userId: string): Promise<string | null> {
  // Your implementation to retrieve the token from your database
  // For example:
  // const userTokens = await db.userTokens.findUnique({
  //   where: { userId }
  // });
  // return userTokens?.zapierToken || null;
  
  // Placeholder for now
  return "user_zapier_token";
} 