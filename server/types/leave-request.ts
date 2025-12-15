// 休暇申請のステータス
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'timeout' | 'cancelled';

// 休暇申請の入力データ
export interface LeaveRequest {
  requestId: string;
  employeeName: string;
  employeeEmail: string;
  startDate: string;  // YYYY-MM-DD形式
  endDate: string;    // YYYY-MM-DD形式
  reason: string;
  approverEmail: string;
}

// 承認/却下の決定
export interface ApprovalDecision {
  approved: boolean;
  comment?: string;
  decidedBy: string;
}

// ワークフローの結果
export interface LeaveRequestResult {
  requestId: string;
  status: LeaveStatus;
  decision?: ApprovalDecision;
  cancelReason?: string;
  completedAt: string;
}

// ワークフローの現在状態（Query用）
export interface LeaveRequestState {
  request: LeaveRequest;
  status: LeaveStatus;
  submittedAt: string;
  decision?: ApprovalDecision;
  cancelReason?: string;
}

// API レスポンス用の拡張型
export interface LeaveRequestWithWorkflowId extends LeaveRequestState {
  workflowId: string;
  completed?: boolean;
}
