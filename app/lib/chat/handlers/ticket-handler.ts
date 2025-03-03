import { getTicketInfoForChatbot } from "~/lib/chatbot/ticket-utils";

export async function handleTicketCommand(message: string, userId: string) {
  // Parse the message to extract ticket system and ID
  const ticketMatch = message.match(/(?:show|get|find|lookup)\s+(?:ticket|issue)\s+(?:in\s+)?(?:([a-zA-Z]+)\s+)?([A-Z]+-\d+|\d+)/i);
  
  if (!ticketMatch) {
    return {
      type: "text",
      content: "I couldn't identify a ticket to look up. Please use format: 'show ticket JIRA-123' or 'get Zendesk ticket 456'"
    };
  }
  
  // Extract ticket system and ID from the match
  let ticketSystem = (ticketMatch[1] || "").toLowerCase();
  const ticketId = ticketMatch[2];
  
  // If no system specified, try to determine from the ticket ID format
  if (!ticketSystem) {
    if (ticketId.includes("-")) {
      ticketSystem = "jira"; // Assume Jira for PROJECT-123 format
    } else {
      ticketSystem = "zendesk"; // Assume Zendesk for numeric IDs
    }
  }
  
  try {
    // Use our stateless action utility to get the ticket info
    const ticketInfo = await getTicketInfoForChatbot(ticketSystem, ticketId, userId);
    
    if (!ticketInfo.success) {
      return {
        type: "text",
        content: `Sorry, I couldn't retrieve information for that ticket: ${ticketInfo.error}`
      };
    }
    
    // Return formatted ticket information
    return {
      type: "ticket-card",
      ticketInfo: ticketInfo.ticketInfo,
      content: `Here's the information for ${ticketSystem.toUpperCase()} ticket ${ticketId}:
      
**Title**: ${ticketInfo.ticketInfo?.title || "Unknown title"}
**Status**: ${ticketInfo.ticketInfo?.status || "Unknown status"}
**Assigned To**: ${ticketInfo.ticketInfo?.assignee || "Unassigned"}

${ticketInfo.ticketInfo?.description || "No description available"}

${ticketInfo.ticketInfo?.url ? `[View in ${ticketSystem}](${ticketInfo.ticketInfo.url})` : ""}`
    };
  } catch (error) {
    console.error("Error handling ticket command:", error);
    return {
      type: "text",
      content: "I encountered an error while trying to retrieve the ticket information. Please try again later."
    };
  }
} 