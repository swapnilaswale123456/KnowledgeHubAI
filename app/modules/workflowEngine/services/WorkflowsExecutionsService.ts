import { db } from "~/utils/db.server";
import { updateWorkflowExecution } from "../db/workflowExecutions.db.server";
import { WorkflowExecutionDto } from "../dtos/WorkflowExecutionDto";
import WorkflowExecutionUtils from "../helpers/WorkflowExecutionUtils";
import WorkflowsService from "./WorkflowsService";
import WorkflowBlockService from "./blocks/WorkflowBlockService";
import WorkflowVariablesAndCredentialsService from "./WorkflowVariablesAndCredentialsService";
import { WorkflowBlockDto } from "../dtos/WorkflowBlockDto";
import { WorkflowStatus } from "../dtos/WorkflowStatus";
import { WorkflowDto } from "../dtos/WorkflowDto";
import { WorkflowBlockType } from "../dtos/WorkflowBlockTypes";
import { WorkflowConditionOperator } from "../dtos/WorkflowConditionDtos";

async function execute(
  workflowId: string,
  {
    type,
    input,
    session,
    execution,
    fromBlockId,
    appliesToAllTenants,
  }: {
    type: "manual" | "api";
    input: { [key: string]: any } | null;
    session: { tenantId: string | null; userId: string | null };
    execution?: { id: string } | null;
    fromBlockId?: string | null;
    appliesToAllTenants?: boolean;
  }
): Promise<WorkflowExecutionDto> {
  const workflow = await WorkflowsService.get(workflowId, session);
  if (!workflow) {
    throw new Error("Workflow not found");
  }
  if (!execution) {
    execution = await db.workflowExecution.create({
      data: {
        tenantId: session.tenantId,
        workflowId: workflow.id,
        type,
        input: JSON.stringify(input),
        status: "running",
        output: null,
        duration: null,
        endedAt: null,
        error: null,
        appliesToAllTenants,
      },
    });
  }
  let firstBlock: WorkflowBlockDto | undefined = undefined;
  if (fromBlockId) {
    firstBlock = workflow.blocks.find((f) => f.id === fromBlockId);
    if (!firstBlock) {
      throw new Error("Workflow has no block with id " + fromBlockId);
    }
  } else {
    firstBlock = workflow.blocks.find((f) => f.isTrigger);
    if (!firstBlock) {
      throw new Error("Workflow has no trigger block");
    }
  }
  const startTime = performance.now();
  let error: string | null = null;
  let result: {
    status: WorkflowStatus;
    workflowContext: { [key: string]: any };
  } = { status: "running", workflowContext: {} };
  let tenant = session.tenantId
    ? await db.tenant.findFirstOrThrow({ where: { OR: [{ slug: session.tenantId }, { id: session.tenantId }] } }).catch(() => null)
    : null;
  let user = session.userId ? await db.user.findUnique({ where: { id: session.userId } }) : null;
  try {
    result = await WorkflowBlockService.execute({
      workflowContext: {
        $params: input,
        $session: {
          tenant: tenant ? { id: tenant.id, name: tenant.name } : null,
          user: user ? { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } : null,
        },
        $vars: await WorkflowVariablesAndCredentialsService.getVariablesContext({ tenantId: session.tenantId }),
        $credentials: await WorkflowVariablesAndCredentialsService.getCredentialsContext({ tenantId: session.tenantId }),
      },
      workflowExecutionId: execution.id,
      workflow,
      block: firstBlock,
      fromBlock: null,
      session,
    });

    // Debug info for tracking execution status
    console.log("[WORKFLOW] Block execution success with status:", result.status);
  } catch (e: any) {
    error = e.message;
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error(e.stack);
    }
  }
  const endTime = performance.now();
  const duration = endTime - startTime;

  delete result.workflowContext.$credentials;
  
  // If the workflow is completed, make sure the status is set correctly
  if (result.status === "success") {
    console.log("[WORKFLOW] Workflow success successfully");
  }
  
  const updatedExecution = await updateWorkflowExecution(execution.id, {
    status: error ? "error" : result.status,
    output: JSON.stringify(result.workflowContext),
    duration: Math.round(duration),
    error: error,
  });

  console.log("[WORKFLOW] Final execution status:", updatedExecution.status);
  return WorkflowExecutionUtils.rowToDto(updatedExecution);
}

async function resumeWithInput(
  executionId: string,
  input: any,
  session: { tenantId: string | null; userId: string | null }
): Promise<WorkflowExecutionDto> {
  // Get the workflow execution
  const execution = await db.workflowExecution.findUnique({
    where: { id: executionId },
    include: {
      workflow: {
        include: {
          blocks: {
            include: {
              conditionsGroups: {
                include: {
                  conditions: true,
                },
              },
              toBlocks: true,
              fromBlocks: true,
            },
          },
        },
      },
    },
  });

  if (!execution) {
    throw new Error("Workflow execution not found");
  }

  // Check if the execution has a stored waitingBlockId in metadata even if status is now running
  const previousBlockExecution = execution.status === "running" 
    ? await db.workflowBlockExecution.findFirst({
        where: {
          workflowExecutionId: executionId,
          status: "pending",
        },
        orderBy: { startedAt: "desc" },
      })
    : null;
  
  // Get the waiting block ID either from the execution or from the pending block execution
  let waitingBlockId = execution.waitingBlockId;
  
  // If execution is no longer in waiting state, try to determine the waiting block from history
  if (!waitingBlockId && execution.status === "running" && previousBlockExecution) {
    console.log("[WORKFLOW] Execution already transitioned to running, using block ID from pending execution");
    waitingBlockId = previousBlockExecution.workflowBlockId;
  }
  
  // If no waiting block ID found and status is running, try to find the last successful block execution
  if (!waitingBlockId && execution.status === "running") {
    console.log("[WORKFLOW] No pending block found, checking for the last successful block execution");
    const lastSuccessfulBlock = await db.workflowBlockExecution.findFirst({
      where: {
        workflowExecutionId: executionId,
        status: "success",
      },
      orderBy: { endedAt: "desc" },
    });
    
    if (lastSuccessfulBlock) {
      // Find blocks that come after this one
      const nextBlocks = execution.workflow.blocks.filter(
        block => block.fromBlocks.some(fb => fb.fromBlockId === lastSuccessfulBlock.workflowBlockId)
      );
      
      if (nextBlocks.length > 0) {
        console.log("[WORKFLOW] Found next blocks after last successful execution:", 
          nextBlocks.map(b => b.id));
        
        // Use the first next block as our continuation point
        waitingBlockId = nextBlocks[0].id;
      }
    }
  }
  
  // Accept the execution if it's either waiting or running
  if (execution.status !== "waiting" && execution.status !== "running") {
    throw new Error(`Workflow execution is not in a valid state for input: ${execution.status}`);
  }
  
  // Still need a valid block ID to resume from
  if (!waitingBlockId) {
    throw new Error("Could not determine which block to resume from");
  }

  // Get the waiting block
  const waitingBlock = execution.workflow.blocks.find((b) => b.id === waitingBlockId);
  if (!waitingBlock) {
    throw new Error("Waiting block not found");
  }

  // Parse the current output to get input details
  let outputData: { inputName?: string } = {};
  try {
    outputData = execution.output ? JSON.parse(execution.output) : {};
  } catch (e) {
    console.error("Error parsing execution output:", e);
  }

  const inputName = outputData.inputName || "userInput";

  // Create or update a block execution record for the input received
  let pendingBlockExecution = await db.workflowBlockExecution.findFirst({
    where: {
      workflowExecutionId: executionId,
      workflowBlockId: waitingBlockId,
      status: "pending",
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  // If no pending block execution found, we might need to create one or find the last one
  if (!pendingBlockExecution) {
    console.log("[WORKFLOW] No pending block execution found for block ID:", waitingBlockId);
    
    // Check if there's a successful block execution already
    const existingBlockExecution = await db.workflowBlockExecution.findFirst({
      where: {
        workflowExecutionId: executionId,
        workflowBlockId: waitingBlockId,
      },
      orderBy: {
        startedAt: "desc",
      },
    });
    
    if (!existingBlockExecution) {
      // Create a new block execution record if none exists
      console.log("[WORKFLOW] Creating new block execution record for input");
      pendingBlockExecution = await db.workflowBlockExecution.create({
        data: {
          workflowExecutionId: executionId,
          workflowBlockId: waitingBlockId,
          status: "pending",
          startedAt: new Date(),
        },
      });
    } else {
      console.log("[WORKFLOW] Found existing block execution:", existingBlockExecution.id);
      // We'll just update the execution context below
    }
  }

  // If we have a pending block execution, update it with the input
  if (pendingBlockExecution) {
    console.log("[WORKFLOW] Updating pending block execution with input");
    await db.workflowBlockExecution.update({
      where: {
        id: pendingBlockExecution.id,
      },
      data: {
        status: "success",
        output: JSON.stringify({ [inputName]: input }),
        endedAt: new Date(),
      },
    });
  }

  // Make sure the execution is in running state and clear waitingBlockId
  if (execution.status === "waiting" || execution.waitingBlockId) {
    console.log("[WORKFLOW] Updating execution status to running");
    await db.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: "running",
        waitingBlockId: null,
      },
    });
  }

  // Resume execution from the waiting block
  const startTime = performance.now();
  let error: string | null = null;
  let result: {
    status: WorkflowStatus;
    workflowContext: { [key: string]: any };
  } = { status: "running", workflowContext: {} };

  let tenant = session.tenantId
    ? await db.tenant.findFirstOrThrow({ where: { OR: [{ slug: session.tenantId }, { id: session.tenantId }] } }).catch(() => null)
    : null;
  let user = session.userId ? await db.user.findUnique({ where: { id: session.userId } }) : null;

  try {
    // Get the workflow context
    const workflowContext = {
      $params: execution.input ? JSON.parse(execution.input) : {},
      $session: {
        tenant: tenant ? { id: tenant.id, name: tenant.name } : null,
        user: user ? { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } : null,
      },
      $vars: await WorkflowVariablesAndCredentialsService.getVariablesContext({ tenantId: session.tenantId }),
      $credentials: await WorkflowVariablesAndCredentialsService.getCredentialsContext({ tenantId: session.tenantId }),
      // Add the user input to the context
      [inputName]: input,
    };

    // Convert the database model to our DTO
    const workflow: WorkflowDto = {
      id: execution.workflow.id,
      name: execution.workflow.name,
      description: execution.workflow.description,
      status: execution.workflow.status as any,
      blocks: execution.workflow.blocks.map((block) => ({
        id: block.id,
        type: block.type as any,
        description: block.description,
        isTrigger: block.isTrigger,
        isBlock: block.isBlock,
        input: block.input ? JSON.parse(block.input) : {},
        variableName: (block as any).variableName || "",
        index: (block as any).index || 0,
        workflowId: block.workflowId || execution.workflow.id,
        tenantId: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        conditionGroups: block.conditionsGroups.map((group) => ({
          id: group.id,
          workflowBlockId: group.workflowBlockId,
          index: group.index,
          type: group.type as "AND" | "OR",
          conditions: group.conditions.map((condition) => ({
            id: condition.id,
            workflowBlockConditionGroupId: condition.workflowBlockConditionGroupId,
            index: condition.index,
            variable: condition.variable,
            operator: condition.operator as WorkflowConditionOperator,
            value: condition.value,
          })),
        })),
        toBlocks: block.toBlocks.map((toBlock) => ({
          id: toBlock.id,
          toBlockId: toBlock.toBlockId,
          condition: toBlock.condition,
        })),
      })),
      tenantId: execution.workflow.tenantId,
      tenant: null,
      createdAt: execution.workflow.createdAt,
      updatedAt: execution.workflow.updatedAt,
      inputExamples: [],
      _count: {
        executions: 0,
      },
    };
    
    // Get the next blocks to execute
    const nextBlocks = workflow.blocks.filter(
      (b) => waitingBlock.toBlocks.some((tb) => tb.toBlockId === b.id)
    );

    if (nextBlocks.length === 0) {
      // If there are no next blocks, the workflow is complete
      console.log("[WORKFLOW] No next blocks found, marking workflow as completed");
      result.status = "success";
      
      // Update the execution immediately to prevent further processing attempts
      await db.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: "success",
          endedAt: new Date(),
        },
      });
    } else {
      // Execute each next block
      let finalBlockProcessed = false;
      
      for (const nextBlock of nextBlocks) {
        // Track if we're processing the final block
        if (nextBlock === nextBlocks[nextBlocks.length - 1]) {
          finalBlockProcessed = true;
        }
        
        const blockResult = await WorkflowBlockService.execute({
          workflowContext,
          workflowExecutionId: executionId,
          workflow,
          block: nextBlock,
          fromBlock: {
            id: waitingBlock.id,
            type: waitingBlock.type as WorkflowBlockType,
            description: waitingBlock.description,
            isTrigger: waitingBlock.isTrigger,
            isBlock: waitingBlock.isBlock,
            input: waitingBlock.input ? JSON.parse(waitingBlock.input) : {},
            variableName: (waitingBlock as any).variableName || "",
            index: (waitingBlock as any).index || 0,
            conditionGroups: waitingBlock.conditionsGroups.map((group) => ({
              id: group.id,
              workflowBlockId: group.workflowBlockId,
              type: "AND",
              index: 0,
              conditions: group.conditions.map((condition) => ({
                id: condition.id,
                workflowBlockConditionGroupId: condition.workflowBlockConditionGroupId,
                variable: condition.variable || "",
                operator: condition.operator as WorkflowConditionOperator,
                value: condition.value,
                index: condition.index || 0,
              })),
            })),
            toBlocks: waitingBlock.toBlocks.map((toBlock) => ({
              id: toBlock.id,
              fromBlockId: toBlock.fromBlockId,
              toBlockId: toBlock.toBlockId,
              condition: toBlock.condition,
            })),
          },
          session,
        });
        
        // Update the workflow context with the result
        result.workflowContext = blockResult.workflowContext;
        
        // If the status is waiting, break the loop
        if (blockResult.status === "waiting") {
          result.status = "waiting" as WorkflowStatus;
          break;
        }
      }
      
      // After all blocks are processed, if we're not waiting and processed the final block,
      // mark the workflow as completed
      if (result.status !== "waiting" && finalBlockProcessed) {
        console.log("[WORKFLOW] Final block executed and not waiting, marking as success");
        result.status = "success";
      }
    }
  } catch (e: any) {
    error = e.message;
    if (process.env.NODE_ENV === "development") {
      console.error(e.stack);
    }
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  delete result.workflowContext.$credentials;
  const updatedExecution = await updateWorkflowExecution(executionId, {
    status: error ? "error" : result.status,
    output: JSON.stringify(result.workflowContext),
    duration: Math.round(duration),
    error: error,
  });

  return WorkflowExecutionUtils.rowToDto(updatedExecution);
}

export default {
  execute,
  resumeWithInput,
};
