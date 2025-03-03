import { json, type ActionFunctionArgs } from "@remix-run/node";
import { zapierConfig } from "~/lib/zapier/config";
import { isAuthenticated } from "~/utils/auth";

interface StatelessApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function action({ request }: ActionFunctionArgs) {
  // Check authentication
  const user = await isAuthenticated(request);
  if (!user) {
    return json<StatelessApiResponse>({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse request body
    const formData = await request.formData();
    const actionType = formData.get("actionType") as string;
    
    if (!actionType) {
      return json<StatelessApiResponse>({ success: false, error: "Missing actionType" }, { status: 400 });
    }
    
    // Handle different stateless action types
    switch (actionType) {
      case "getTicketInfo": {
        // Get required parameters
        const ticketId = formData.get("ticketId") as string;
        const ticketSystem = formData.get("ticketSystem") as string;
        
        if (!ticketId || !ticketSystem) {
          return json<StatelessApiResponse>({ 
            success: false, 
            error: "Missing required parameters: ticketId and ticketSystem are required" 
          }, { status: 400 });
        }
        
        // Generate and execute a stateless action to get ticket information
        const result = await executeStatelessTicketAction(ticketSystem, ticketId, user.id);
        return json<StatelessApiResponse>({ success: true, data: result });
      }
      
      default:
        return json<StatelessApiResponse>({ success: false, error: "Invalid actionType" }, { status: 400 });
    }
  } catch (error) {
    console.error("[Zapier Stateless API] Error:", error);
    return json<StatelessApiResponse>({ 
      success: false, 
      error: `Failed to process request: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
}

// Execute a stateless action for getting ticket information
async function executeStatelessTicketAction(ticketSystem: string, ticketId: string, userId: string) {
  console.log(`[Zapier Stateless] Executing ticket action for ${ticketSystem} ticket ${ticketId}`);
  
  // Dynamically build the stateless action configuration
  const statelessAction = {
    // Define the app and action to use
    app: getAppIdForTicketSystem(ticketSystem),
    action: getActionForTicketSystem(ticketSystem),
    
    // Include connection information if needed
    // For stateless actions, you either need to include connection details
    // or have them configured in your Zapier account
    connection: getConnectionForUser(userId, ticketSystem),
    
    // Define the inputs for the action
    params: {
      ticket_id: {
        field_id: "ticket_id",  // This matches the field ID expected by the app
        value: ticketId
      }
    },
    
    // Specify any additional options
    options: {
      skip_key_checks: false,
      use_path_lookup: true
    }
  };
  
  // Call Zapier's stateless action API
  const response = await fetch("https://actions.zapier.com/api/v2/stateless/actions/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": zapierConfig.apiKey
    },
    body: JSON.stringify(statelessAction)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Zapier Stateless API error (${response.status}): ${errorText}`);
  }
  
  const result = await response.json();
  console.log("[Zapier Stateless] Result:", result);
  
  return result;
}

// Helper functions for determining app-specific details

function getAppIdForTicketSystem(ticketSystem: string): string {
  // Map ticket systems to their Zapier app IDs
  const ticketSystemMap: Record<string, string> = {
    "jira": "jira",
  
    // Add more mappings as needed
  };
  
  return ticketSystemMap[ticketSystem.toLowerCase()] || "jira"; // Default to Jira
}

function getActionForTicketSystem(ticketSystem: string): string {
  // Map ticket systems to their "get ticket" action IDs
  const actionMap: Record<string, string> = {
    "jira": "get-issue",
    "zendesk": "get-ticket",
    "servicenow": "get-record",
    "freshdesk": "get-ticket",
    // Add more mappings as needed
  };
  
  return actionMap[ticketSystem.toLowerCase()] || "get-issue"; // Default to Jira's get-issue
}

function getConnectionForUser(userId: string, ticketSystem: string): any {
  // In a real implementation, you would retrieve the user's connection details
  // from your database, based on their previous authentication with the ticket system
  
  // This is a placeholder - in production you would implement proper connection retrieval
  return {
    connection_id: `${userId}_${ticketSystem.toLowerCase()}_connection`
  };
} 