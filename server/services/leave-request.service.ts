import { Client, WorkflowNotFoundError } from '@temporalio/client';
import {
  LeaveRequest,
  LeaveRequestState,
  LeaveRequestResult,
  ApprovalDecision,
  LeaveRequestWithWorkflowId,
} from '../types/leave-request';
import { TASK_QUEUE } from '../shared';
import { leaveRequestWorkflow, approvalSignal, cancelSignal, getStateQuery } from '../temporal/workflows';

/**
 * 休暇申請サービス
 * Temporal操作をラップし、APIとTemporalの橋渡しを行う
 */
export class LeaveRequestService {
  constructor(private client: Client) {}

  /**
   * 新規休暇申請を作成
   * @param input 申請データ（requestIdなし）
   * @returns workflowIdとリクエスト情報
   */
  async submit(input: Omit<LeaveRequest, 'requestId'>): Promise<{
    workflowId: string;
    request: LeaveRequest;
  }> {
    const requestId = `leave-${Date.now()}`;
    const request: LeaveRequest = {
      requestId,
      ...input,
    };

    const handle = await this.client.workflow.start(leaveRequestWorkflow, {
      taskQueue: TASK_QUEUE,
      workflowId: requestId,
      args: [request],
    });

    return {
      workflowId: handle.workflowId,
      request,
    };
  }

  /**
   * 承認待ち申請の一覧を取得
   */
  async listPending(): Promise<LeaveRequestWithWorkflowId[]> {
    const workflows = this.client.workflow.list({
      query: `WorkflowType = 'leaveRequestWorkflow'`,
    });

    const requests: LeaveRequestWithWorkflowId[] = [];
    for await (const workflow of workflows) {
      try {
        const handle = this.client.workflow.getHandle(workflow.workflowId);
        const state = await handle.query(getStateQuery);
        requests.push({ ...state, workflowId: workflow.workflowId });
      } catch {
        // ワークフローが完了している場合はスキップ
      }
    }

    return requests;
  }

  /**
   * 申請の詳細を取得
   * @param workflowId ワークフローID
   * @returns 申請状態または完了結果
   */
  async getById(workflowId: string): Promise<LeaveRequestWithWorkflowId | null> {
    try {
      const handle = this.client.workflow.getHandle(workflowId);

      try {
        // まずQueryを試みる（実行中のワークフロー）
        const state = await handle.query(getStateQuery);
        return { ...state, workflowId };
      } catch {
        // ワークフローが完了している場合は結果を取得
        const result = await handle.result() as LeaveRequestResult;
        return {
          workflowId,
          request: { requestId: result.requestId } as LeaveRequest,
          status: result.status,
          submittedAt: result.completedAt, // 完了日時で代替
          decision: result.decision,
          completed: true,
        };
      }
    } catch (error) {
      if (error instanceof WorkflowNotFoundError) {
        return null;
      }
      throw error;
    }
  }

  /**
   * 申請を承認
   * @param workflowId ワークフローID
   * @param comment コメント
   * @param decidedBy 決定者
   */
  async approve(
    workflowId: string,
    comment?: string,
    decidedBy?: string
  ): Promise<void> {
    const handle = this.client.workflow.getHandle(workflowId);
    const decision: ApprovalDecision = {
      approved: true,
      comment: comment || '承認しました',
      decidedBy: decidedBy || 'manager@example.com',
    };
    await handle.signal(approvalSignal, decision);
  }

  /**
   * 申請を却下
   * @param workflowId ワークフローID
   * @param comment コメント
   * @param decidedBy 決定者
   */
  async reject(
    workflowId: string,
    comment?: string,
    decidedBy?: string
  ): Promise<void> {
    const handle = this.client.workflow.getHandle(workflowId);
    const decision: ApprovalDecision = {
      approved: false,
      comment: comment || '却下しました',
      decidedBy: decidedBy || 'manager@example.com',
    };
    await handle.signal(approvalSignal, decision);
  }

  /**
   * 申請を取り消し
   * @param workflowId ワークフローID
   * @param reason 取り消し理由
   */
  async cancel(workflowId: string, reason?: string): Promise<void> {
    const handle = this.client.workflow.getHandle(workflowId);
    await handle.signal(cancelSignal, reason || '申請者により取り消し');
  }
}
