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
  console.log(`[WORKFLOW] Resuming execution ${executionId} with input:`, input);
  
  // Get the workflow execution with all necessary relations
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

  // Only accept the execution if it's either waiting or running
  if (execution.status !== "waiting" && execution.status !== "running") {
    console.error(`[WORKFLOW] Cannot resume execution in ${execution.status} state`);
    throw new Error(`Workflow execution is not in a valid state for input: ${execution.status}`);
  }
  
  // Get the waiting block ID from the execution
  let waitingBlockId = execution.waitingBlockId;
  
  // If no waiting block ID found, throw an error as we don't know where to continue from
  if (!waitingBlockId) {
    console.error("[WORKFLOW] No waiting block ID found");
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

  // Find any existing block execution for this waiting block
  const pendingBlockExecution = await db.workflowBlockExecution.findFirst({
    where: {
      workflowExecutionId: executionId,
      workflowBlockId: waitingBlockId,
      status: "pending",
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  // If we found a pending block execution, update it with the input and mark it as successful
  if (pendingBlockExecution) {
    console.log("[WORKFLOW] Updating pending block execution with input:", pendingBlockExecution.id);
    
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
  } else {
    console.log("[WORKFLOW] No pending block execution found, creating one");
    
    // Create a record to track that we received input for this block
    await db.workflowBlockExecution.create({
      data: {
        workflowExecutionId: executionId,
        workflowBlockId: waitingBlockId,
        status: "success", // Mark as success since we received input
        startedAt: new Date(),
        endedAt: new Date(),
        output: JSON.stringify({ [inputName]: input }),
      },
    });
  }

  // Now update the execution to running state and clear the waitingBlockId
  console.log("[WORKFLOW] Updating execution to running status");
  await db.workflowExecution.update({
    where: { id: executionId },
    data: {
      status: "running",
      waitingBlockId: null, // Clear the waiting block ID since we're no longer waiting
    },
  });

  // Setup execution tracking variables
  const startTime = performance.now();
  let error: string | null = null;
  let result: {
    status: WorkflowStatus;
    workflowContext: { [key: string]: any };
    waitingForInput?: boolean;
  } = { status: "running", workflowContext: {} };

  // Get tenant and user information
  let tenant = session.tenantId
    ? await db.tenant.findFirstOrThrow({ where: { OR: [{ slug: session.tenantId }, { id: session.tenantId }] } }).catch(() => null)
    : null;
  let user = session.userId ? await db.user.findUnique({ where: { id: session.userId } }) : null;

  try {
    // Set up the workflow context with the user input
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

    // Convert the database model to our DTO for execution
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
    
    // Get the next blocks to execute (the blocks that come after the waiting block)
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
      console.log(`[WORKFLOW] Found ${nextBlocks.length} next blocks to execute`);
      
      for (let i = 0; i < nextBlocks.length; i++) {
        const nextBlock = nextBlocks[i];
        const isLastBlock = i === nextBlocks.length - 1;
        
        console.log(`[WORKFLOW] Executing block ${i+1}/${nextBlocks.length}: ${nextBlock.id} (${nextBlock.type})`);
        
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
        result.workflowContext = {
          ...result.workflowContext,
          ...blockResult.workflowContext
        };
        
        // If the block is waiting for input, we need to pause execution
        if (blockResult.status === "waiting" || (blockResult as any).waitingForInput) {
          console.log("[WORKFLOW] Block is waiting for input, pausing execution");
          result.status = "waiting";
          break;
        }
        
        // If this is the last block and we're not waiting, the workflow is complete
        if (isLastBlock && result.status !== "waiting") {
          console.log("[WORKFLOW] Last block executed successfully, marking workflow as completed");
          result.status = "success";
          
          // Update the execution to mark it as completed
          await db.workflowExecution.update({
            where: { id: executionId },
            data: {
              status: "success",
              endedAt: new Date(),
            },
          });
        }
      }
    }
  } catch (e: any) {
    error = e.message;
    console.error("[WORKFLOW] Error during execution:", e);
    if (process.env.NODE_ENV === "development") {
      console.error(e.stack);
    }
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  // Remove credentials from context for security
  delete result.workflowContext.$credentials;
  
  // Final update to the execution
  const updatedExecution = await updateWorkflowExecution(executionId, {
    status: error ? "error" : result.status,
    output: JSON.stringify(result.workflowContext),
    duration: Math.round(duration),
    error: error,
  });

  // Get the execution DTO
  const executionDto = WorkflowExecutionUtils.rowToDto(updatedExecution);
  
  // If the status is waiting, find the next block that's waiting for input
  if (result.status === "waiting") {
    const nextBlockExecution = await db.workflowBlockExecution.findFirst({
      where: {
        workflowExecutionId: executionId,
        status: "pending",
      },
      orderBy: { startedAt: "desc" },
      include: {
        workflowBlock: true,
      },
    });
    
    if (nextBlockExecution) {
      console.log("[WORKFLOW] Next block waiting for input:", nextBlockExecution.workflowBlockId);
      
      // Use type assertion to avoid linter error
      return {
        ...executionDto,
        nextBlock: {
          id: nextBlockExecution.workflowBlockId,
          executionId: nextBlockExecution.id,
          status: nextBlockExecution.status,
          blockType: nextBlockExecution.workflowBlock?.type || null,
          startedAt: nextBlockExecution.startedAt,
          blockInput: nextBlockExecution.workflowBlock?.input ? 
            JSON.parse(nextBlockExecution.workflowBlock.input) : {},
        }
      } as WorkflowExecutionDto & { 
        nextBlock: {
          id: string;
          executionId: string;
          status: string;
          blockType: string | null;
          startedAt: Date;
          blockInput?: { [key: string]: any };
        }
      };
    }
  }
  
  console.log(`[WORKFLOW] Execution completed with status: ${result.status}`);
  return executionDto;
}

export default {
  execute,
  resumeWithInput,
};
