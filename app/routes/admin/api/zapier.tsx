import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { zapierClient } from "~/lib/zapier/client";
import { isZapierConfigured } from "~/lib/zapier/config";
import { getUserInfo } from "~/utils/session.server";
import { db } from "~/utils/db.server";

// Define proper types for API responses
type ApiResponse<T = any> = 
  | { success: true; [key: string]: any }
  | { success: false; error: string };

/**
 * Helper function to check if user is authenticated and is an admin
 */
async function isAuthenticated(request: Request) {
  const userInfo = await getUserInfo(request);
  if (!userInfo.userId) {
    return { user: null, isAdmin: false };
  }
  
  const isAdmin = await db.adminUser.findUnique({ where: { userId: userInfo.userId } });
  return { 
    user: userInfo, 
    isAdmin: !!isAdmin 
  };
}

/**
 * GET: Check Zapier configuration status
 */
export async function loader({ request }: LoaderFunctionArgs) {
  console.log("[Zapier API] Loader called");
  
  const { user, isAdmin } = await isAuthenticated(request);
  
  if (!user || !isAdmin) {
    console.log("[Zapier API] Authentication failed in loader");
    return json<ApiResponse>({ 
      success: false, 
      error: "Unauthorized" 
    }, { status: 401 });
  }

  return json<ApiResponse>({
    success: true,
    isConfigured: isZapierConfigured(),
  });
}

/**
 * POST: Handle Zapier API requests
 */
export async function action({ request }: ActionFunctionArgs) {
  console.log("[Zapier API] Action called");
  
  // Check authentication
  const { user, isAdmin } = await isAuthenticated(request);
  
  if (!user || !isAdmin) {
    console.log("[Zapier API] Authentication failed in action");
    return json<ApiResponse>({ 
      success: false, 
      error: "Unauthorized" 
    }, { status: 401 });
  }

  // Check configuration
  if (!isZapierConfigured()) {
    console.log("[Zapier API] Zapier not configured");
    return json<ApiResponse>({ 
      success: false, 
      error: "Zapier is not configured" 
    }, { status: 400 });
  }

  try {
    // Parse request body
    const body = await request.json();
    const { action, params = {} } = body;
    
    console.log(`[Zapier API] Processing action: ${action}`);

    // Handle different actions
    switch (action) {
      case "checkAuth":
        try {
          const authStatus = await zapierClient.checkAuth();
          return json(authStatus);
        } catch (error) {
          console.error("[Zapier API] Auth check error:", error);
          return json<ApiResponse>({ 
            success: false, 
            error: `Authentication error: ${error instanceof Error ? error.message : String(error)}` 
          }, { status: 500 });
        }

      case "listActions":
        try {
          const actions = await zapierClient.getActionList();
          return json(actions.results || []);
        } catch (error) {
          console.error("[Zapier API] List actions error:", error);
          return json<ApiResponse>({ 
            success: false, 
            error: `Failed to list actions: ${error instanceof Error ? error.message : String(error)}` 
          }, { status: 500 });
        }

      case "executeAction":
        if (!params.actionId || !params.instructions) {
          return json<ApiResponse>({ 
            success: false, 
            error: "Missing required parameters: actionId and instructions" 
          }, { status: 400 });
        }
        
        try {
          const result = await zapierClient.executeAction(
            params.actionId,
            params.instructions,
            params.previewOnly || false,
            params.additionalParams || {}
          );
          return json(result);
        } catch (error) {
          console.error("[Zapier API] Execute action error:", error);
          return json<ApiResponse>({ 
            success: false, 
            error: `Failed to execute action: ${error instanceof Error ? error.message : String(error)}` 
          }, { status: 500 });
        }

      case "getExecution":
        if (!params.executionId) {
          return json<ApiResponse>({ 
            success: false, 
            error: "Missing required parameter: executionId" 
          }, { status: 400 });
        }
        
        try {
          const result = await zapierClient.getExecution(params.executionId);
          return json(result);
        } catch (error) {
          console.error("[Zapier API] Get execution error:", error);
          return json<ApiResponse>({ 
            success: false, 
            error: `Failed to get execution: ${error instanceof Error ? error.message : String(error)}` 
          }, { status: 500 });
        }

      case "listExecutions":
        try {
          const result = await zapierClient.listExecutions(
            params.page || 1,
            params.pageSize || 10,
            params.actionId
          );
          return json(result);
        } catch (error) {
          console.error("[Zapier API] List executions error:", error);
          return json<ApiResponse>({ 
            success: false, 
            error: `Failed to list executions: ${error instanceof Error ? error.message : String(error)}` 
          }, { status: 500 });
        }

      default:
        console.log(`[Zapier API] Unknown action: ${action}`);
        return json<ApiResponse>({ 
          success: false, 
          error: `Unknown action: ${action}` 
        }, { status: 400 });
    }
  } catch (error) {
    console.error("[Zapier API] Request processing error:", error);
    return json<ApiResponse>({ 
      success: false, 
      error: `API error: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 