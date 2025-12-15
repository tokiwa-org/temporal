// 定数
export const TASK_QUEUE = 'leave-request-queue';
export const APPROVAL_TIMEOUT_DAYS = 3;

// 型の再エクスポート（後方互換性のため）
export type {
  LeaveStatus,
  LeaveRequest,
  ApprovalDecision,
  LeaveRequestResult,
  LeaveRequestState,
  LeaveRequestWithWorkflowId,
} from './types/leave-request';
