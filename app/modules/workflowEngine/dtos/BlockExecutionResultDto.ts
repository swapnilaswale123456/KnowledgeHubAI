export type BlockExecutionResultDto = {
  output: { [key: string]: any } | any | null;
  toBlockIds: string[];
  error?: string | null;
  throwsError?: boolean;
  waitingForInput?: boolean;
  status?: "success" | "error" | "waiting";
};
