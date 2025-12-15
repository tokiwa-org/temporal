import {
  proxyActivities,
  defineSignal,
  defineQuery,
  setHandler,
  condition,
} from '@temporalio/workflow';
import type * as activities from './activities';
import {
  LeaveRequest,
  LeaveRequestResult,
  LeaveRequestState,
  ApprovalDecision,
  LeaveStatus,
} from '../types/leave-request';
import { APPROVAL_TIMEOUT_DAYS } from '../shared';

// アクティビティをプロキシとして取得
const { notifyApprover, notifyEmployee, sendReminder } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: '1 minute',
});

// Signal定義: 承認/却下を受け取る
export const approvalSignal = defineSignal<[ApprovalDecision]>('approval');

// Signal定義: 申請を取り消す
export const cancelSignal = defineSignal<[string]>('cancel'); // 取り消し理由

// Query定義: 現在の状態を取得
export const getStateQuery = defineQuery<LeaveRequestState>('getState');

/**
 * 休暇申請ワークフロー
 *
 * 1. 申請を受け付け、承認者に通知
 * 2. 承認/却下のシグナルを待つ（タイムアウトあり）
 * 3. 結果を申請者に通知
 */
export async function leaveRequestWorkflow(
  request: LeaveRequest
): Promise<LeaveRequestResult> {
  // ワークフローの状態
  let status: LeaveStatus = 'pending';
  let decision: ApprovalDecision | undefined;
  let cancelReason: string | undefined;
  const submittedAt = new Date().toISOString();

  // Queryハンドラー: 現在の状態を返す
  setHandler(getStateQuery, () => ({
    request,
    status,
    submittedAt,
    decision,
    cancelReason,
  }));

  // Signalハンドラー: 承認/却下を受け取る
  setHandler(approvalSignal, (approvalDecision: ApprovalDecision) => {
    if (status === 'pending') {
      decision = approvalDecision;
      status = approvalDecision.approved ? 'approved' : 'rejected';
    }
  });

  // Signalハンドラー: 取り消しを受け取る
  setHandler(cancelSignal, (reason: string) => {
    if (status === 'pending') {
      cancelReason = reason;
      status = 'cancelled';
    }
  });

  // 承認者に通知
  await notifyApprover(request);

  // 承認待ち（タイムアウト付き）
  // 1日ごとにリマインダーを送信し、3日でタイムアウト
  const timeoutMs = APPROVAL_TIMEOUT_DAYS * 24 * 60 * 60 * 1000;
  const reminderIntervalMs = 24 * 60 * 60 * 1000; // 1日
  const startTime = Date.now();

  while (status === 'pending') {
    // 1日待つか、シグナルが来るまで待機
    const gotSignal = await condition(
      () => status !== 'pending',
      reminderIntervalMs
    );

    if (gotSignal) {
      // シグナルを受け取った
      break;
    }

    // タイムアウトチェック
    if (Date.now() - startTime >= timeoutMs) {
      status = 'timeout';
      break;
    }

    // まだ pending の場合はリマインダー送信
    if (status === 'pending') {
      await sendReminder(request);
    }
  }

  // 結果を作成
  const result: LeaveRequestResult = {
    requestId: request.requestId,
    status,
    decision,
    cancelReason,
    completedAt: new Date().toISOString(),
  };

  // 申請者に結果を通知
  await notifyEmployee(request, result);

  return result;
}
