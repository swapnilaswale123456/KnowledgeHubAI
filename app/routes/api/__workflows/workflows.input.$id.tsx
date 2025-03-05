import { ActionFunctionArgs, json } from "@remix-run/node";
import WorkflowsExecutionsService from "~/modules/workflowEngine/services/WorkflowsExecutionsService";
import { validateApiKey } from "~/utils/services/apiService";
import { db } from "~/utils/db.server";

/**
 * API endpoint for resuming a workflow with user input
 * This endpoint will process the input and continue to the next block
 */
export const action = async ({ request, params }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed." }, { status: 405 });
  }

  try {
    const { tenant, userId } = await validateApiKey(request, params);
    const executionId = params.id;
    
    if (!executionId) {
      return json({ error: "Execution ID is required" }, { status: 400 });
    }
    
    // Parse input from request body (can be JSON or FormData)
    let input: any;
    const contentType = request.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      // Handle JSON data
      const body = await request.json();
      input = body.input;
    } else {
      // Handle form data
      const formData = await request.formData();
      input = formData.get("input");
    }
    
    if (input === undefined || input === null) {
      return json({ error: "Input is required" }, { status: 400 });
    }

    // Get the complete execution data
    const currentExecution = await db.workflowExecution.findUnique({
      where: { id: executionId },
      select: { 
        id: true,
        status: true, 
        waitingBlockId: true, 
        output: true,
        workflowId: true
      }
    });
    
    console.log("[WORKFLOW-INPUT] Current execution state:", currentExecution);
    
    if (!currentExecution) {
      return json({ error: "Execution not found" }, { status: 404 });
    }
    
    if (currentExecution.status !== "waiting" || !currentExecution.waitingBlockId) {
      console.log("[WORKFLOW-INPUT] Execution is not in waiting state");
      console.log("[WORKFLOW-INPUT] Status:", currentExecution.status);
      console.log("[WORKFLOW-INPUT] Waiting block ID:", currentExecution.waitingBlockId);
      return json({ 
        error: "Execution is not waiting for input",
        executionStatus: currentExecution.status,
        waitingBlockId: currentExecution.waitingBlockId
      }, { status: 400 });
    }

    // Store the waiting block ID for later use
    const waitingBlockId = currentExecution.waitingBlockId;
    console.log("[WORKFLOW-INPUT] Waiting block ID:", waitingBlockId);

    try {
      // Update the execution status to running
      console.log("[WORKFLOW-INPUT] Setting execution status to running");
      await db.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: "running",
          // Keep the waitingBlockId until resumeWithInput processes it
          // This helps with context preservation
        },
      });
      
      console.log("[WORKFLOW-INPUT] Execution set to running, calling resumeWithInput");
      
      // Resume with input - this will process the input and continue to the next block
      const execution = await WorkflowsExecutionsService.resumeWithInput(
        executionId,
        input,
        { 
          userId: userId || "anonymous",
          tenantId: tenant?.id || "default" 
        }
      );
      
      console.log("[WORKFLOW-INPUT] Execution resumed with status:", execution.status);
      
      // Return successful response with appropriate message
      const message = execution.status === "success" 
        ? "Workflow completed successfully" 
        : execution.status === "waiting"
          ? "Workflow paused waiting for next input"
          : "Workflow continued to next block";
          
      return json({ 
        success: true, 
        execution,
        message
      });
    } catch (resumeError: any) {
      console.error("[WORKFLOW-INPUT] Error in resumeWithInput:", resumeError);
      
      // If we couldn't resume, reset the execution status back to waiting
      await db.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: "waiting",
          waitingBlockId: waitingBlockId,
        },
      });
      
      throw resumeError;
    }
  } catch (error: any) {
    console.error("[WORKFLOW-INPUT] Error processing workflow input:", error);
    return json({ 
      error: error.message, 
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined 
    }, { status: 500 });
  }
}; 