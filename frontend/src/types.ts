export type ExecutionStatus = 'idle' | 'success' | 'error' | 'timeout';

export type SupportedLanguage = {
  id: string;
  label: string;
  ready: boolean;
  previewOnly?: boolean;
  note?: string | null;
  fileExt?: string;
};

export type ExecutionResult = {
  status: ExecutionStatus | 'running';
  output: string;
  stderr: string;
  executionTimeMs: number;
  language: string;
  inputRequired: boolean;
};
