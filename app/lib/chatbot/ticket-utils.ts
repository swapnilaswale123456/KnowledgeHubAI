import { zapierConfig } from "~/lib/zapier/config";

export async function getTicketInfoForChatbot(ticketSystem: string, ticketId: string, userId: string) {
  console.log(`[Chatbot] Getting ticket info for ${ticketSystem} ticket ${ticketId}`);
  
  try {
    // Build the stateless action for retrieving ticket info
    const statelessAction = {
      app: getAppIdForTicketSystem(ticketSystem),
      action: getActionForTicketSystem(ticketSystem),
      connection: getConnectionForUser(userId, ticketSystem),
      params: {
        ticket_id: {
          field_id: "ticket_id",
          value: ticketId
        }
      }
    };
    
    // Execute the stateless action through Zapier's API
    const response = await fetch("https://actions.zapier.com/api/v2/stateless/actions/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": zapierConfig.apiKey
      },
      body: JSON.stringify(statelessAction)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get ticket info: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Format the result for the chatbot
    return {
      success: true,
      ticketInfo: {
        id: result.ticket_id || ticketId,
        title: result.title || result.summary || "Unknown title",
        status: result.status || "Unknown status",
        assignee: result.assignee || result.assigned_to || "Unassigned",
        description: result.description || "No description available",
        // Add more fields that might be useful
        url: result.url || result.web_url || null,
        created: result.created_at || result.created || null,
        updated: result.updated_at || result.updated || null,
      },
      rawData: result // Include the raw data for debugging
    };
  } catch (error) {
    console.error("[Chatbot] Ticket lookup error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to retrieve ticket information",
    };
  }
}

// Use the same helper functions from the API endpoint
function getAppIdForTicketSystem(ticketSystem: string): string {
  const ticketSystemMap: Record<string, string> = {
    "jira": "jira",
   
  };
  
  return ticketSystemMap[ticketSystem.toLowerCase()] || "jira";
}

function getActionForTicketSystem(ticketSystem: string): string {
  const actionMap: Record<string, string> = {
    "jira": "get-issue",
    "zendesk": "find_tickets",
    "servicenow": "get-record",
    "freshdesk": "get-ticket",
  };
  
  return actionMap[ticketSystem.toLowerCase()] || "get-issue";
}

function getConnectionForUser(userId: string, ticketSystem: string): any {
  // In a real implementation, retrieve the connection details from your database
  return {
    connection_id: `${userId}_${ticketSystem.toLowerCase()}_connection`
  };
} 