import { db } from "~/utils/db.server";
import WorkflowsExecutionsService from "./WorkflowsExecutionsService";

/**
 * Service to handle workflow integration with the chatbot
 */
export default class WorkflowChatbotService {
  /**
   * Check if a workflow execution is waiting for input
   */
  static async checkForWaitingInput(executionId: string): Promise<{
    isWaiting: boolean;
    message?: string;
    inputType?: string;
    options?: Record<string, string>;
  }> {
    const execution = await db.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        waitingBlock: true,
      },
    });

    if (!execution || execution.status !== "waiting" || !execution.waitingBlockId) {
      return { isWaiting: false };
    }

    // Parse the output to get the input request details
    let outputData: {
      waitingForInput?: boolean;
      message?: string;
      inputType?: string;
      options?: Record<string, string>;
    } = {};

    try {
      outputData = execution.output ? JSON.parse(execution.output) : {};
    } catch (e) {
      console.error("Error parsing execution output:", e);
    }

    if (!outputData.waitingForInput) {
      return { isWaiting: false };
    }

    return {
      isWaiting: true,
      message: outputData.message || "Please provide input...",
      inputType: outputData.inputType || "text",
      options: outputData.options || {},
    };
  }

  /**
   * Submit user input to resume a workflow execution
   */
  static async submitInput(
    executionId: string,
    input: string,
    session: { userId: string | null; tenantId: string | null }
  ) {
    return WorkflowsExecutionsService.resumeWithInput(executionId, input, session);
  }

  /**
   * Get all workflow executions that are waiting for input for a specific tenant
   */
  static async getWaitingExecutions(tenantId: string) {
    const executions = await db.workflowExecution.findMany({
      where: {
        tenantId,
        status: "waiting",
        waitingBlockId: { not: null },
      },
      include: {
        workflow: true,
        waitingBlock: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return executions.map((execution) => ({
      id: execution.id,
      workflowId: execution.workflowId,
      workflowName: execution.workflow.name,
      waitingSince: execution.updatedAt,
      waitingBlockId: execution.waitingBlockId,
      waitingBlockType: execution.waitingBlock?.type,
      output: execution.output ? JSON.parse(execution.output) : null,
    }));
  }
} 